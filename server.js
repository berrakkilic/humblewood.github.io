const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const multer = require('multer');
const { Server } = require('socket.io');
const scryptAsync = promisify(crypto.scrypt);

const app = express();

// Configure app config
let proxyTrust = "loopback, linklocal, uniquelocal";
if (process.env.TRUST_PROXY) {
  proxyTrust = `${proxyTrust}, ${process.env.TRUST_PROXY}`;
}
app.set("trust proxy", proxyTrust);

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DM_PIN = String(process.env.DM_PIN || 'humblewood');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json());
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Keep local development working when the three frontend files are stored in
// the repository root. A deployed project can still place them in /public;
// express.static above takes precedence in that case.
function sendFrontendFile(filename) {
  return (req, res, next) => {
    const publicFile = path.join(publicDir, filename);
    const rootFile = path.join(__dirname, filename);
    const selected = fs.existsSync(publicFile) ? publicFile : rootFile;
    if (!fs.existsSync(selected)) return next();
    res.sendFile(selected);
  };
}
app.get('/', sendFrontendFile('index.html'));
app.get('/index.html', sendFrontendFile('index.html'));
app.get('/app.js', sendFrontendFile('app.js'));
app.get('/style.css', sendFrontendFile('style.css'));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/uploads/' + req.file.filename, name: req.file.originalname });
});

// ---- Persisted room state (single table: "Humblewood") ----
// Backed by a local SQLite database file (via libSQL) at data/local.db.
// On Simon's server, docker-compose.yml mounts /app/data as a volume, so
// this file and everything in it survives container restarts and
// rebuilds without needing any external database service.
const { createClient } = require('@libsql/client');

const defaultState = {
  scene: {
    mapUrl: null,
    mapName: 'No map loaded',
    gridSize: 50,
    gridVisible: false,
    fitTokensToGrid: true,
    doodlePaths: [] // array of {points:[{x,y}], color, width, id}
  },
  tokens: [], // {id, x, y, size, imageUrl, label, kind: 'pc'|'npc'|'item', hp, maxHp, visibleToPlayers}
  npcs: {}, // id -> reusable NPC record; map tokens reference these with npcId
  savedScenes: {}, // name -> {name, savedAt, scene, tokens, initiative}
  activeSceneName: null,
  jukebox: {
    playlist: [], // {id, title, url}
    currentIndex: -1,
    isPlaying: false,
    startedAt: 0, // server timestamp when current track started (for sync)
    seek: 0
  },
  characters: {}, // name -> sheet object
  rollLog: [], // {id, name, expression, rolls, modifier, total, ts}
  initiative: { entries: [], round: 1, currentIndex: -1 }, // {id, name, value, tokenId}
  fog: [] // reserved for future fog-of-war rects
};

let state = defaultState;

const localDir = DATA_DIR;
if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

const db = createClient({ url: 'file:' + path.join(localDir, 'local.db') });

async function loadStateFromDb() {
  const result = await db.execute('SELECT data FROM state WHERE id = 1');
  if (result.rows.length) {
    try {
      const saved = JSON.parse(result.rows[0].data);
      state = {
        ...defaultState,
        ...saved,
        scene: { ...defaultState.scene, ...(saved.scene || {}) },
        jukebox: { ...defaultState.jukebox, ...(saved.jukebox || {}) },
        characters: saved.characters || {},
        npcs: saved.npcs && typeof saved.npcs === 'object' ? saved.npcs : {},
        savedScenes: saved.savedScenes && typeof saved.savedScenes === 'object' ? saved.savedScenes : {},
        activeSceneName: saved.activeSceneName || null,
        rollLog: Array.isArray(saved.rollLog) ? saved.rollLog : [],
        tokens: Array.isArray(saved.tokens) ? saved.tokens : [],
        initiative: { ...defaultState.initiative, ...(saved.initiative || {}) }
      };
      if (!Array.isArray(state.scene.doodlePaths)) state.scene.doodlePaths = [];
      if (!Array.isArray(state.initiative.entries)) state.initiative.entries = [];
      Object.values(state.characters).forEach(normalizeCharacter);
      Object.values(state.npcs).forEach(normalizeNpc);
      state.tokens.forEach(token => {
        normalizeToken(token);
        if (token.kind !== 'pc' || token.characterName) return;
        const character = Object.values(state.characters).find(entry => entry.name.toLowerCase() === String(token.label || '').toLowerCase());
        if (character) {
          token.characterName = character.name;
          token.ownerUsername = character.ownerUsername || null;
          token.ownerId = character.ownerId || null;
        }
      });
      normalizeSavedScenes();
      syncNpcRosterFromTokens(state.tokens, true);
    } catch (e) {
      console.warn('Could not parse saved state, starting fresh.', e.message);
    }
  }
}

let saveTimer = null;
let pendingSave = false;
function persistState() {
  pendingSave = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (!pendingSave) return;
    pendingSave = false;
    try {
      await db.execute({
        sql: 'INSERT INTO state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
        args: [JSON.stringify(state)]
      });
    } catch (err) {
      console.error('Failed to save state:', err.message);
    }
  }, 300); // debounce rapid updates (e.g. token drags)
}

const dbReady = Promise.all([
  db.execute('CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT)'),
  db.execute(`CREATE TABLE IF NOT EXISTS player_accounts (
    username TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`)
]).then(loadStateFromDb);

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function validUsername(username) {
  return /^[a-z0-9][a-z0-9_.-]{2,31}$/.test(username);
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

async function makePasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return { salt, passwordHash: derived.toString('hex') };
}

async function verifyPassword(password, salt, expectedHash) {
  const derived = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

function broadcastState() {
  for (const client of io.sockets.sockets.values()) {
    if (client.data.identified) client.emit('state:full', publicStateFor(client));
  }
}

const CONDITIONS = new Set([
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated',
  'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
  'Stunned', 'Unconscious'
]);

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function cleanAttacks(attacks) {
  if (!Array.isArray(attacks)) return [];
  return attacks.slice(0, 30).map(attack => ({
    name: String(attack?.name || '').trim().slice(0, 100),
    bonus: String(attack?.bonus || '').trim().slice(0, 30),
    damage: String(attack?.damage || '').trim().slice(0, 80)
  })).filter(attack => attack.name);
}

function normalizeNpc(npc) {
  if (!npc || typeof npc !== 'object') return null;
  npc.id = String(npc.id || ('npc_' + Date.now() + Math.random().toString(36).slice(2, 7))).slice(0, 120);
  npc.name = String(npc.name || npc.label || 'Unnamed NPC').trim().slice(0, 100) || 'Unnamed NPC';
  npc.imageUrl = String(npc.imageUrl || '').slice(0, 1000) || null;
  npc.maxHp = Math.max(1, Math.min(9999, Number(npc.maxHp ?? npc.hp) || 10));
  npc.hp = Math.max(0, Math.min(npc.maxHp, Number(npc.hp) || 0));
  npc.tempHp = Math.max(0, Math.min(9999, Number(npc.tempHp) || 0));
  npc.ac = Math.max(0, Math.min(99, Number(npc.ac) || 10));
  npc.initiativeModifier = Math.max(-99, Math.min(99, Number(npc.initiativeModifier) || 0));
  npc.tokenScale = Math.max(0.35, Math.min(3, Number(npc.tokenScale ?? npc.sizeScale) || 1));
  npc.attacks = cleanAttacks(npc.attacks);
  npc.notes = String(npc.notes || '').slice(0, 4000);
  const combat = npc.combat && typeof npc.combat === 'object' ? npc.combat : {};
  npc.combat = {
    conditions: Array.isArray(combat.conditions) ? combat.conditions.filter(condition => CONDITIONS.has(condition)) : [],
    concentration: !!combat.concentration,
    exhaustion: Math.max(0, Math.min(6, Number(combat.exhaustion) || 0))
  };
  return npc;
}

function npcFromToken(token) {
  return normalizeNpc({
    id: token.npcId || ('npc_' + token.id),
    name: token.label,
    imageUrl: token.imageUrl,
    hp: token.hp,
    maxHp: token.maxHp,
    tempHp: token.tempHp,
    ac: token.ac,
    initiativeModifier: token.initiativeModifier,
    tokenScale: token.sizeScale,
    attacks: token.attacks,
    notes: token.notes,
    combat: token.combat
  });
}

function normalizeToken(token) {
  if (!token || typeof token !== 'object') return null;
  token.id = String(token.id || ('t' + Date.now() + Math.random().toString(36).slice(2, 7))).slice(0, 140);
  token.kind = ['pc', 'npc', 'item'].includes(token.kind) ? token.kind : 'npc';
  token.label = String(token.label || 'Token').trim().slice(0, 100) || 'Token';
  token.imageUrl = String(token.imageUrl || '').slice(0, 1000) || null;
  token.size = Math.max(18, Math.min(180, Number(token.size) || 44));
  token.sizeScale = Math.max(0.35, Math.min(3, Number(token.sizeScale) || 1));
  // Older releases stored the token's upper-left corner. The new renderer stores
  // its centre, which makes snapping and grid-size changes mathematically stable.
  if (token.coordinateMode !== 'center') {
    token.x = (Number(token.x) || 0) + 22;
    token.y = (Number(token.y) || 0) + 22;
    token.coordinateMode = 'center';
  } else {
    token.x = Number(token.x) || 0;
    token.y = Number(token.y) || 0;
  }
  token.visibleToPlayers = token.visibleToPlayers !== false;
  if (token.kind === 'item') {
    token.hp = null;
    token.maxHp = null;
    token.tempHp = 0;
  } else {
    token.maxHp = Math.max(1, Math.min(9999, Number(token.maxHp ?? token.hp) || 10));
    token.hp = Math.max(0, Math.min(token.maxHp, Number(token.hp) || 0));
    token.tempHp = Math.max(0, Math.min(9999, Number(token.tempHp) || 0));
  }
  if (token.kind === 'npc') {
    token.npcId = String(token.npcId || ('npc_' + token.id)).slice(0, 120);
    const npc = normalizeNpc({ ...token, id: token.npcId, name: token.label });
    token.ac = npc.ac;
    token.initiativeModifier = npc.initiativeModifier;
    token.attacks = npc.attacks;
    token.notes = npc.notes;
    token.combat = npc.combat;
  }
  return token;
}

function syncNpcRosterFromTokens(tokens, overwrite = false) {
  (tokens || []).filter(token => token.kind === 'npc').forEach(token => {
    normalizeToken(token);
    const fromToken = npcFromToken(token);
    if (overwrite || !state.npcs[fromToken.id]) state.npcs[fromToken.id] = fromToken;
  });
}

function syncNpcFromToken(token) {
  if (!token || token.kind !== 'npc') return;
  state.npcs[token.npcId] = npcFromToken(token);
}

function applyNpcToToken(npc, token) {
  normalizeNpc(npc);
  token.npcId = npc.id;
  token.label = npc.name;
  token.kind = 'npc';
  token.imageUrl = npc.imageUrl;
  token.sizeScale = Math.max(0.35, Math.min(3, Number(token.sizeScale ?? npc.tokenScale) || 1));
  token.hp = npc.hp;
  token.maxHp = npc.maxHp;
  token.tempHp = npc.tempHp;
  token.ac = npc.ac;
  token.initiativeModifier = npc.initiativeModifier;
  token.attacks = cloneJson(npc.attacks);
  token.notes = npc.notes;
  token.combat = cloneJson(npc.combat);
  return normalizeToken(token);
}

function normalizeSavedScenes() {
  const normalized = {};
  Object.entries(state.savedScenes || {}).forEach(([fallbackName, saved]) => {
    if (!saved || typeof saved !== 'object') return;
    const name = String(saved.name || fallbackName).trim().slice(0, 80);
    if (!name) return;
    const scene = { ...defaultState.scene, ...(saved.scene || {}) };
    if (!Array.isArray(scene.doodlePaths)) scene.doodlePaths = [];
    const tokens = Array.isArray(saved.tokens) ? saved.tokens : [];
    tokens.forEach(normalizeToken);
    const initiative = { ...defaultState.initiative, ...(saved.initiative || {}) };
    if (!Array.isArray(initiative.entries)) initiative.entries = [];
    normalized[name] = { name, savedAt: Number(saved.savedAt) || Date.now(), scene, tokens, initiative };
    syncNpcRosterFromTokens(tokens);
  });
  state.savedScenes = normalized;
}

function savedSceneMetadata() {
  return Object.values(state.savedScenes || {})
    .map(saved => ({
      name: saved.name,
      savedAt: saved.savedAt,
      mapName: saved.scene?.mapName || 'No map loaded',
      tokenCount: Array.isArray(saved.tokens) ? saved.tokens.length : 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function snapCoordinateToCell(value, gridSize) {
  return Math.floor(Number(value) / gridSize) * gridSize + gridSize / 2;
}

function removeInitiativeForTokenIds(tokenIds, initiative = state.initiative) {
  const ids = new Set(tokenIds);
  const currentId = initiative.entries[initiative.currentIndex]?.id || null;
  initiative.entries = initiative.entries.filter(entry => !ids.has(entry.tokenId));
  initiative.currentIndex = currentId ? initiative.entries.findIndex(entry => entry.id === currentId) : -1;
  if (initiative.currentIndex < 0 && initiative.entries.length) initiative.currentIndex = 0;
}

function isDm(socket) {
  return socket.data.identified && socket.data.role === 'dm';
}

function ownsCharacter(socket, character) {
  if (!socket.data.identified || !character) return false;
  if (isDm(socket)) return true;
  if (character.ownerUsername) return character.ownerUsername === socket.data.username;
  const legacyOwner = String(character.fields?.player || character.owner || '').trim().toLowerCase();
  return !!legacyOwner && [socket.data.name, socket.data.username]
    .map(value => String(value || '').trim().toLowerCase())
    .includes(legacyOwner);
}

function controlsToken(socket, token) {
  if (!socket.data.identified || !token) return false;
  if (isDm(socket)) return true;
  if (token.characterName) return ownsCharacter(socket, state.characters[token.characterName]);
  return token.kind === 'pc' && token.ownerUsername && token.ownerUsername === socket.data.username;
}

function deny(socket, message) {
  socket.emit('action:denied', { message });
}

function normalizeCharacter(character) {
  if (!character.fields || typeof character.fields !== 'object') character.fields = {};
  character.hp = Math.max(0, Number(character.hp ?? character.fields.hp) || 0);
  character.maxHp = Math.max(0, Number(character.maxHp ?? character.fields.maxhp) || 0);
  character.tempHp = Math.max(0, Number(character.tempHp ?? character.fields.temphp) || 0);
  const previous = character.combat && typeof character.combat === 'object' ? character.combat : {};
  const successes = previous.deathSaves?.successes ?? [1, 2, 3].filter(i => character.fields[`death-success-${i}`]).length;
  const failures = previous.deathSaves?.failures ?? [1, 2, 3].filter(i => character.fields[`death-failure-${i}`]).length;
  const spellSlots = {};
  for (let level = 1; level <= 9; level += 1) {
    const stored = previous.spellSlots?.[level] || previous.spellSlots?.[String(level)] || {};
    const total = Math.max(0, Number(stored.total ?? character.fields[`spell-slots-${level}`]) || 0);
    spellSlots[level] = {
      total,
      used: Math.max(0, Math.min(total, Number(stored.used ?? character.fields[`spell-used-${level}`]) || 0))
    };
  }
  character.combat = {
    conditions: Array.isArray(previous.conditions) ? previous.conditions.filter(condition => CONDITIONS.has(condition)) : [],
    concentration: !!previous.concentration,
    exhaustion: Math.max(0, Math.min(6, Number(previous.exhaustion) || 0)),
    deathSaves: {
      successes: Math.max(0, Math.min(3, Number(successes) || 0)),
      failures: Math.max(0, Math.min(3, Number(failures) || 0))
    },
    stable: !!previous.stable,
    dead: !!previous.dead,
    spellSlots
  };
  syncCombatFields(character);
  return character;
}

function syncCombatFields(character) {
  const combat = character.combat;
  character.fields.hp = String(character.hp);
  character.fields.maxhp = String(character.maxHp);
  character.fields.temphp = String(character.tempHp);
  for (let i = 1; i <= 3; i += 1) {
    character.fields[`death-success-${i}`] = i <= combat.deathSaves.successes;
    character.fields[`death-failure-${i}`] = i <= combat.deathSaves.failures;
  }
  for (let level = 1; level <= 9; level += 1) {
    character.fields[`spell-slots-${level}`] = String(combat.spellSlots[level].total);
    character.fields[`spell-used-${level}`] = String(combat.spellSlots[level].used);
  }
}

function publicCharacter(socket, character) {
  normalizeCharacter(character);
  const { ownerId, ownerUsername, ...safe } = character;
  return { ...safe, claimed: !!ownerUsername, legacyClaimed: !!ownerId, canManage: ownsCharacter(socket, character) };
}

function publicToken(socket, token) {
  const { ownerId, ownerUsername, ...safe } = token;
  return { ...safe, canControl: controlsToken(socket, token) };
}

function publicNpc(npc) {
  return cloneJson(normalizeNpc(npc));
}

function publicStateFor(socket) {
  const visibleCharacters = Object.entries(state.characters)
    .filter(([, character]) => isDm(socket) || ownsCharacter(socket, character));
  return {
    ...state,
    characters: Object.fromEntries(visibleCharacters.map(([name, character]) => [name, publicCharacter(socket, character)])),
    tokens: state.tokens
      .filter(token => isDm(socket) || token.visibleToPlayers !== false)
      .map(token => publicToken(socket, token)),
    npcs: isDm(socket)
      ? Object.fromEntries(Object.entries(state.npcs).map(([id, npc]) => [id, publicNpc(npc)]))
      : {},
    savedScenes: isDm(socket) ? savedSceneMetadata() : []
  };
}

function emitCharacterUpdate(character) {
  for (const client of io.sockets.sockets.values()) {
    if (!client.data.identified) continue;
    if (isDm(client) || ownsCharacter(client, character)) {
      client.emit('character:update', publicCharacter(client, character));
    } else {
      // Remove a previously visible sheet if its ownership changed. Clients
      // never receive the contents of sheets owned by another player.
      client.emit('character:remove', { name: character.name });
    }
  }
}

function emitToken(event, token) {
  for (const client of io.sockets.sockets.values()) {
    if (!client.data.identified) continue;
    if (!isDm(client) && token.visibleToPlayers === false) client.emit('token:remove', { id: token.id });
    else client.emit(event, publicToken(client, token));
  }
}

function emitNpcRoster() {
  for (const client of io.sockets.sockets.values()) {
    if (!isDm(client)) continue;
    client.emit('npcs:update', Object.fromEntries(
      Object.entries(state.npcs).map(([id, npc]) => [id, publicNpc(npc)])
    ));
  }
}

function emitSavedScenes() {
  for (const client of io.sockets.sockets.values()) {
    if (isDm(client)) client.emit('scenes:update', savedSceneMetadata());
  }
}

function syncCharacterTokens(character) {
  state.tokens.filter(token => token.characterName === character.name).forEach(token => {
    token.label = character.name;
    token.imageUrl = character.portraitUrl || token.imageUrl || null;
    token.hp = character.hp;
    token.maxHp = character.maxHp;
    token.tempHp = character.tempHp;
    token.ownerUsername = character.ownerUsername || token.ownerUsername || null;
    token.ownerId = null;
    emitToken('token:update', token);
  });
}

function upsertInitiativeEntry({ name, value, tokenId }) {
  const safeName = String(name || 'Unnamed').trim().slice(0, 100) || 'Unnamed';
  const currentId = state.initiative.entries[state.initiative.currentIndex]?.id || null;
  const normalizedName = safeName.toLowerCase();
  let entry = state.initiative.entries.find(item =>
    (tokenId && item.tokenId === tokenId) || String(item.name).toLowerCase() === normalizedName
  );
  if (entry) {
    entry.name = safeName;
    entry.value = Number(value) || 0;
    if (tokenId) entry.tokenId = tokenId;
  } else {
    entry = {
      id: 'i' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: safeName,
      value: Number(value) || 0,
      tokenId: tokenId || null
    };
    state.initiative.entries.push(entry);
  }
  state.initiative.entries.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  state.initiative.currentIndex = currentId
    ? state.initiative.entries.findIndex(item => item.id === currentId)
    : -1;
  return entry;
}

io.on('connection', (socket) => {
  socket.data.authAttempts = 0;
  const rejectIdentity = (message) => {
    socket.data.authAttempts += 1;
    socket.emit('identify:result', { ok: false, message });
    if (socket.data.authAttempts >= 10) setTimeout(() => socket.disconnect(true), 150);
  };

  socket.on('identify', async (payload = {}) => {
    const requestedRole = payload.role === 'dm' ? 'dm' : 'player';
    let name;
    let username = null;
    try {
      if (requestedRole === 'dm') {
        if (String(payload.dmPin || '') !== DM_PIN) return rejectIdentity('That Dungeon Master PIN is not correct.');
        name = String(payload.name || '').trim().slice(0, 80) || 'The DM';
      } else {
        username = normalizeUsername(payload.username);
        const password = String(payload.password || '');
        if (!validUsername(username)) return rejectIdentity('Use a 3–32 character username containing letters, numbers, dots, dashes or underscores.');
        if (!validPassword(password)) return rejectIdentity('Passwords must be between 8 and 128 characters.');
        const existingResult = await db.execute({ sql: 'SELECT * FROM player_accounts WHERE username = ?', args: [username] });
        const existing = existingResult.rows[0];
        if (payload.authMode === 'register') {
          if (existing) return rejectIdentity('That username is already taken. Choose Sign in if it belongs to you.');
          name = String(payload.name || '').trim().slice(0, 80) || username;
          const passwordRecord = await makePasswordRecord(password);
          await db.execute({
            sql: 'INSERT INTO player_accounts (username, display_name, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
            args: [username, name, passwordRecord.passwordHash, passwordRecord.salt, Date.now()]
          });
        } else {
          if (!existing || !(await verifyPassword(password, existing.salt, existing.password_hash))) {
            return rejectIdentity('The username or password is incorrect.');
          }
          name = String(existing.display_name).slice(0, 80);
        }
      }
    } catch (error) {
      console.error('Account sign-in failed:', error.message);
      return rejectIdentity('The account could not be checked right now. Please try again.');
    }
    socket.data.role = requestedRole;
    socket.data.name = name;
    socket.data.username = username;
    socket.data.identified = true;
    socket.data.authAttempts = 0;
    socket.emit('identify:result', { ok: true, role: requestedRole, name, username });
    socket.emit('state:full', publicStateFor(socket));
    io.emit('presence', { role: requestedRole, name, connected: true });
  });

  socket.on('accounts:list', async () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can view player accounts.');
    try {
      const result = await db.execute('SELECT username, display_name, created_at FROM player_accounts ORDER BY display_name COLLATE NOCASE');
      socket.emit('accounts:update', result.rows.map(row => ({
        username: String(row.username),
        displayName: String(row.display_name),
        createdAt: Number(row.created_at)
      })));
    } catch (error) {
      console.error('Could not list accounts:', error.message);
      deny(socket, 'Player accounts could not be loaded right now.');
    }
  });

  socket.on('account:resetPassword', async ({ username: requestedUsername, password } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can reset player passwords.');
    const username = normalizeUsername(requestedUsername);
    if (!validPassword(password)) return deny(socket, 'The new password must be between 8 and 128 characters.');
    try {
      const existing = await db.execute({ sql: 'SELECT username FROM player_accounts WHERE username = ?', args: [username] });
      if (!existing.rows.length) return deny(socket, 'No player account uses that username.');
      const passwordRecord = await makePasswordRecord(password);
      await db.execute({
        sql: 'UPDATE player_accounts SET password_hash = ?, salt = ? WHERE username = ?',
        args: [passwordRecord.passwordHash, passwordRecord.salt, username]
      });
      socket.emit('account:passwordReset', { username });
    } catch (error) {
      console.error('Could not reset account password:', error.message);
      deny(socket, 'That password could not be reset right now.');
    }
  });

  // --- Map / scene ---
  socket.on('scene:setMap', ({ mapUrl, mapName } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the map.');
    state.scene.mapUrl = String(mapUrl || '').slice(0, 1000) || null;
    state.scene.mapName = String(mapName || 'Map').slice(0, 140);
    state.scene.doodlePaths = [];
    persistState();
    io.emit('scene:update', state.scene);
  });

  socket.on('scene:setGrid', ({ gridSize, gridVisible, fitTokensToGrid } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the grid.');
    const previousSize = state.scene.gridSize;
    if (gridSize !== undefined) state.scene.gridSize = Math.max(10, Math.min(300, Number(gridSize) || 50));
    if (gridVisible !== undefined) state.scene.gridVisible = !!gridVisible;
    if (fitTokensToGrid !== undefined) state.scene.fitTokensToGrid = !!fitTokensToGrid;
    if (state.scene.fitTokensToGrid && (previousSize !== state.scene.gridSize || fitTokensToGrid === true)) {
      state.tokens.forEach(token => {
        token.x = snapCoordinateToCell(token.x, state.scene.gridSize);
        token.y = snapCoordinateToCell(token.y, state.scene.gridSize);
      });
    }
    persistState();
    broadcastState();
  });

  socket.on('scene:save', ({ name } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can save scenes.');
    const requestedName = String(name || '').trim().slice(0, 80);
    if (!requestedName) return deny(socket, 'Give the scene a name first.');
    const existingName = Object.keys(state.savedScenes).find(savedName => savedName.toLowerCase() === requestedName.toLowerCase());
    const safeName = existingName || requestedName;
    state.savedScenes[safeName] = {
      name: safeName,
      savedAt: Date.now(),
      scene: cloneJson(state.scene),
      tokens: cloneJson(state.tokens),
      initiative: cloneJson(state.initiative)
    };
    state.activeSceneName = safeName;
    persistState();
    emitSavedScenes();
    io.emit('scene:active', { name: safeName });
    socket.emit('scene:saved', { name: safeName });
  });

  socket.on('scene:load', ({ name } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can load scenes.');
    const saved = state.savedScenes[String(name || '')];
    if (!saved) return deny(socket, 'That saved scene no longer exists.');
    state.scene = { ...defaultState.scene, ...cloneJson(saved.scene) };
    state.tokens = cloneJson(saved.tokens || []);
    state.tokens.forEach(normalizeToken);
    state.initiative = { ...defaultState.initiative, ...cloneJson(saved.initiative || {}) };
    if (!Array.isArray(state.initiative.entries)) state.initiative.entries = [];
    state.activeSceneName = saved.name;
    syncNpcRosterFromTokens(state.tokens, true);
    Object.values(state.characters).forEach(character => syncCharacterTokens(character));
    persistState();
    broadcastState();
    emitNpcRoster();
    io.emit('scene:loaded', { name: saved.name });
  });

  socket.on('scene:delete', ({ name } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can delete saved scenes.');
    const safeName = String(name || '');
    if (!state.savedScenes[safeName]) return;
    delete state.savedScenes[safeName];
    if (state.activeSceneName === safeName) state.activeSceneName = null;
    persistState();
    emitSavedScenes();
    io.emit('scene:active', { name: state.activeSceneName });
    socket.emit('scene:deleted', { name: safeName });
  });

  socket.on('scene:doodle:add', (path) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can draw on the map.');
    if (!path || !Array.isArray(path.points)) return;
    state.scene.doodlePaths.push(path);
    persistState();
    io.emit('scene:doodle:add', path);
  });

  socket.on('scene:doodle:undo', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit map drawings.');
    state.scene.doodlePaths.pop();
    persistState();
    io.emit('scene:doodle:redrawAll', state.scene.doodlePaths);
  });

  socket.on('scene:doodle:clear', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit map drawings.');
    state.scene.doodlePaths = [];
    persistState();
    io.emit('scene:doodle:clear');
  });

  // --- Tokens ---
  socket.on('token:add', (requested = {}) => {
    if (!socket.data.identified) return deny(socket, 'Join the table before adding a token.');
    let token;
    if (!isDm(socket)) {
      const character = state.characters[String(requested.characterName || '')];
      if (!ownsCharacter(socket, character)) return deny(socket, 'You can only place your own character on the map.');
      const existing = state.tokens.find(entry => entry.characterName === character.name);
      if (existing) return socket.emit('token:exists', publicToken(socket, existing));
      normalizeCharacter(character);
      token = {
        id: 't' + Date.now() + Math.random().toString(36).slice(2, 6),
        characterName: character.name,
        ownerUsername: character.ownerUsername || socket.data.username,
        ownerId: null,
        label: character.name,
        kind: 'pc',
        imageUrl: character.portraitUrl || null,
        x: state.scene.gridSize / 2,
        y: state.scene.gridSize / 2,
        size: 44,
        sizeScale: 1,
        coordinateMode: 'center',
        hp: character.hp,
        maxHp: character.maxHp,
        tempHp: character.tempHp,
        visibleToPlayers: true
      };
      if (!character.ownerUsername) character.ownerUsername = socket.data.username;
      character.ownerId = null;
    } else {
      const linkedCharacter = state.characters[String(requested.characterName || requested.label || '')];
      if (linkedCharacter) normalizeCharacter(linkedCharacter);
      const kind = linkedCharacter ? 'pc' : (['pc', 'npc', 'item'].includes(requested.kind) ? requested.kind : 'npc');
      token = {
        id: 't' + Date.now() + Math.random().toString(36).slice(2, 6),
        label: String(requested.label || linkedCharacter?.name || 'Token').trim().slice(0, 100),
        kind,
        imageUrl: String(requested.imageUrl || linkedCharacter?.portraitUrl || '').slice(0, 1000) || null,
        x: Number.isFinite(Number(requested.x)) ? Number(requested.x) : state.scene.gridSize / 2,
        y: Number.isFinite(Number(requested.y)) ? Number(requested.y) : state.scene.gridSize / 2,
        size: Math.max(18, Math.min(180, Number(requested.size) || 44)),
        sizeScale: Math.max(0.35, Math.min(3, Number(requested.sizeScale) || 1)),
        coordinateMode: 'center',
        hp: linkedCharacter ? linkedCharacter.hp : (kind === 'item' ? null : Math.max(0, Number(requested.hp) || 10)),
        maxHp: linkedCharacter ? linkedCharacter.maxHp : (kind === 'item' ? null : Math.max(1, Number(requested.maxHp ?? requested.hp) || 10)),
        tempHp: linkedCharacter ? linkedCharacter.tempHp : 0,
        visibleToPlayers: requested.visibleToPlayers !== false,
        characterName: linkedCharacter?.name || null,
        ownerUsername: linkedCharacter?.ownerUsername || null,
        ownerId: null
      };
      if (kind === 'npc') {
        const npc = normalizeNpc({
          id: requested.npcId,
          name: token.label,
          imageUrl: token.imageUrl,
          hp: token.hp,
          maxHp: token.maxHp,
          ac: requested.ac,
          initiativeModifier: requested.initiativeModifier,
          attacks: requested.attacks,
          notes: requested.notes
        });
        state.npcs[npc.id] = npc;
        applyNpcToToken(npc, token);
      }
    }
    normalizeToken(token);
    state.tokens.push(token);
    persistState();
    emitToken('token:add', token);
    if (token.kind === 'npc') emitNpcRoster();
    if (token.characterName) emitCharacterUpdate(state.characters[token.characterName]);
  });

  socket.on('token:move', ({ id, x, y } = {}) => {
    const token = state.tokens.find(entry => entry.id === id);
    if (!controlsToken(socket, token)) return deny(socket, 'You can only move your own character token.');
    if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
    token.x = Math.max(-5000, Math.min(50000, Number(x)));
    token.y = Math.max(-5000, Math.min(50000, Number(y)));
    persistState();
    io.emit('token:move', { id, x: token.x, y: token.y });
  });

  socket.on('token:update', (updated = {}) => {
    const token = state.tokens.find(entry => entry.id === updated.id);
    if (!isDm(socket) || !token) return deny(socket, 'Only the Dungeon Master can edit token details.');
    if (updated.hp !== undefined && !token.characterName) token.hp = Math.max(0, Number(updated.hp) || 0);
    if (updated.maxHp !== undefined && !token.characterName) token.maxHp = Math.max(0, Number(updated.maxHp) || 0);
    if (updated.visibleToPlayers !== undefined) token.visibleToPlayers = !!updated.visibleToPlayers;
    if (updated.sizeScale !== undefined) token.sizeScale = Math.max(0.35, Math.min(3, Number(updated.sizeScale) || 1));
    normalizeToken(token);
    syncNpcFromToken(token);
    persistState();
    emitToken('token:update', token);
    if (token.kind === 'npc') emitNpcRoster();
  });

  socket.on('token:remove', ({ id } = {}) => {
    const token = state.tokens.find(entry => entry.id === id);
    if (!controlsToken(socket, token)) return deny(socket, 'You can only remove your own character token.');
    state.tokens = state.tokens.filter(entry => entry.id !== id);
    removeInitiativeForTokenIds([id]);
    persistState();
    io.emit('token:remove', { id });
    io.emit('initiative:update', state.initiative);
  });

  socket.on('npc:place', ({ id } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can place NPCs.');
    const npc = state.npcs[String(id || '')];
    if (!npc) return deny(socket, 'That NPC no longer exists.');
    const existing = state.tokens.find(token => token.npcId === npc.id);
    if (existing) return socket.emit('token:exists', publicToken(socket, existing));
    const token = applyNpcToToken(npc, {
      id: 't' + Date.now() + Math.random().toString(36).slice(2, 6),
      x: state.scene.gridSize / 2,
      y: state.scene.gridSize / 2,
      size: 44,
      sizeScale: npc.tokenScale,
      coordinateMode: 'center',
      visibleToPlayers: true,
      ownerUsername: null,
      ownerId: null
    });
    state.tokens.push(token);
    persistState();
    emitToken('token:add', token);
    emitNpcRoster();
  });

  socket.on('npc:update', (requested = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit NPCs.');
    const existing = state.npcs[String(requested.id || '')];
    if (!existing) return deny(socket, 'That NPC no longer exists.');
    const updated = normalizeNpc({
      ...existing,
      ...requested,
      id: existing.id,
      imageUrl: requested.imageUrl === undefined ? existing.imageUrl : requested.imageUrl,
      combat: existing.combat
    });
    state.npcs[updated.id] = updated;
    state.tokens.filter(token => token.npcId === updated.id).forEach(token => {
      const position = { x: token.x, y: token.y, id: token.id, size: token.size, sizeScale: token.sizeScale, coordinateMode: 'center', visibleToPlayers: token.visibleToPlayers };
      applyNpcToToken(updated, token);
      Object.assign(token, position);
      emitToken('token:update', token);
    });
    const activeNpcTokenIds = new Set(state.tokens.filter(token => token.npcId === updated.id).map(token => token.id));
    state.initiative.entries.filter(entry => activeNpcTokenIds.has(entry.tokenId)).forEach(entry => { entry.name = updated.name; });
    Object.values(state.savedScenes).forEach(saved => {
      saved.tokens.filter(token => token.npcId === updated.id).forEach(token => {
        token.label = updated.name;
        token.imageUrl = updated.imageUrl;
        token.maxHp = updated.maxHp;
        token.hp = Math.min(Number(token.hp) || 0, updated.maxHp);
        token.ac = updated.ac;
        token.initiativeModifier = updated.initiativeModifier;
        token.attacks = cloneJson(updated.attacks);
        token.notes = updated.notes;
      });
      saved.initiative.entries.filter(entry => saved.tokens.some(token => token.id === entry.tokenId && token.npcId === updated.id))
        .forEach(entry => { entry.name = updated.name; });
    });
    persistState();
    emitNpcRoster();
    io.emit('initiative:update', state.initiative);
    socket.emit('npc:saved', { id: updated.id, name: updated.name });
  });

  socket.on('npc:delete', ({ id } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can delete NPCs.');
    const npcId = String(id || '');
    const npc = state.npcs[npcId];
    if (!npc) return;
    const removedTokenIds = state.tokens.filter(token => token.npcId === npcId).map(token => token.id);
    state.tokens = state.tokens.filter(token => token.npcId !== npcId);
    removeInitiativeForTokenIds(removedTokenIds);
    Object.values(state.savedScenes).forEach(saved => {
      const savedIds = saved.tokens.filter(token => token.npcId === npcId).map(token => token.id);
      saved.tokens = saved.tokens.filter(token => token.npcId !== npcId);
      removeInitiativeForTokenIds(savedIds, saved.initiative);
    });
    delete state.npcs[npcId];
    persistState();
    removedTokenIds.forEach(tokenId => io.emit('token:remove', { id: tokenId }));
    io.emit('initiative:update', state.initiative);
    emitNpcRoster();
    emitSavedScenes();
    socket.emit('npc:deleted', { id: npcId, name: npc.name });
  });

  socket.on('token:combat:update', (payload = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can manage NPC combat.');
    const token = state.tokens.find(entry => entry.id === String(payload.id || ''));
    if (!token || token.kind !== 'npc') return deny(socket, 'That NPC is not on the current map.');
    normalizeToken(token);
    const combat = token.combat;
    const amount = Math.max(0, Math.min(9999, Number(payload.amount) || 0));
    if (payload.action === 'damage' && amount) {
      const absorbed = Math.min(token.tempHp, amount);
      token.tempHp -= absorbed;
      token.hp = Math.max(0, token.hp - (amount - absorbed));
    } else if (payload.action === 'heal' && amount) {
      token.hp = Math.min(token.maxHp, token.hp + amount);
    } else if (payload.action === 'tempHp') {
      token.tempHp = amount;
    } else if (payload.action === 'condition:toggle' && CONDITIONS.has(payload.condition)) {
      combat.conditions = combat.conditions.includes(payload.condition)
        ? combat.conditions.filter(condition => condition !== payload.condition)
        : [...combat.conditions, payload.condition];
    } else if (payload.action === 'concentration:set') {
      combat.concentration = !!payload.value;
    } else if (payload.action === 'exhaustion') {
      combat.exhaustion = Math.max(0, Math.min(6, combat.exhaustion + Math.sign(Number(payload.delta) || 0)));
    } else if (payload.action === 'longRest') {
      token.hp = token.maxHp;
      token.tempHp = 0;
      combat.concentration = false;
      combat.exhaustion = Math.max(0, combat.exhaustion - 1);
    } else {
      return;
    }
    syncNpcFromToken(token);
    persistState();
    emitToken('token:update', token);
    emitNpcRoster();
  });

  // --- Jukebox ---
  socket.on('jukebox:setPlaylist', (playlist) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit the playlist.');
    state.jukebox.playlist = Array.isArray(playlist) ? playlist.slice(0, 100) : [];
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:play', ({ index } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can control playback.');
    state.jukebox.currentIndex = Math.max(0, Math.min(state.jukebox.playlist.length - 1, Number(index) || 0));
    state.jukebox.isPlaying = true;
    state.jukebox.startedAt = Date.now();
    state.jukebox.seek = 0;
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:pause', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can control playback.');
    state.jukebox.isPlaying = false;
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:resume', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can control playback.');
    state.jukebox.isPlaying = true;
    state.jukebox.startedAt = Date.now();
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  // --- Character sheets and quick combat controls ---
  socket.on('character:save', (requested = {}) => {
    if (!socket.data.identified || !requested || typeof requested !== 'object') return;
    const name = String(requested.name || '').trim().slice(0, 100);
    if (!name) return;
    const originalName = String(requested._originalName || name).trim().slice(0, 100);
    const original = state.characters[originalName];
    const destination = state.characters[name];
    if (!isDm(socket) && ((original && !ownsCharacter(socket, original)) || (destination && destination !== original && !ownsCharacter(socket, destination)))) {
      return deny(socket, `You cannot edit ${name}.`);
    }
    const sheet = { ...requested };
    delete sheet._originalName;
    delete sheet.ownerId;
    delete sheet.ownerUsername;
    delete sheet.canManage;
    delete sheet.claimed;
    sheet.name = name;
    sheet.owner = isDm(socket)
      ? String(sheet.fields?.player || original?.owner || destination?.owner || 'Dungeon Master')
      : socket.data.name;
    sheet.ownerUsername = original?.ownerUsername || destination?.ownerUsername || (isDm(socket) ? null : socket.data.username);
    sheet.ownerId = isDm(socket) ? (original?.ownerId || destination?.ownerId || null) : null;
    if (original?.combat && !sheet.combat) {
      sheet.combat = {
        conditions: original.combat.conditions,
        concentration: original.combat.concentration,
        exhaustion: original.combat.exhaustion,
        stable: original.combat.stable,
        dead: original.combat.dead
      };
    }
    normalizeCharacter(sheet);
    if (originalName !== name && original) {
      delete state.characters[originalName];
      state.tokens.filter(token => token.characterName === originalName).forEach(token => { token.characterName = name; });
      io.emit('character:remove', { name: originalName });
    }
    state.characters[name] = sheet;
    syncCharacterTokens(sheet);
    persistState();
    emitCharacterUpdate(sheet);
  });

  socket.on('character:remove', ({ name } = {}) => {
    const existing = state.characters[name];
    if (!ownsCharacter(socket, existing)) return deny(socket, `You cannot delete ${name || 'that character'}.`);
    delete state.characters[name];
    const removedTokenIds = state.tokens.filter(token => token.characterName === name).map(token => token.id);
    state.tokens = state.tokens.filter(token => token.characterName !== name);
    removeInitiativeForTokenIds(removedTokenIds);
    persistState();
    io.emit('character:remove', { name });
    removedTokenIds.forEach(id => io.emit('token:remove', { id }));
    io.emit('initiative:update', state.initiative);
  });

  socket.on('character:claim', ({ name } = {}) => {
    const character = state.characters[name];
    if (!character || isDm(socket) || character.ownerUsername || !ownsCharacter(socket, character)) {
      return deny(socket, 'That character cannot be claimed by this player.');
    }
    character.ownerUsername = socket.data.username;
    character.ownerId = null;
    character.owner = socket.data.name;
    syncCharacterTokens(character);
    persistState();
    emitCharacterUpdate(character);
  });

  socket.on('character:ownership:release', ({ name } = {}) => {
    const character = state.characters[name];
    if (!isDm(socket) || !character) return deny(socket, 'Only the Dungeon Master can release character ownership.');
    character.ownerId = null;
    character.ownerUsername = null;
    state.tokens.filter(token => token.characterName === name).forEach(token => {
      token.ownerId = null;
      token.ownerUsername = null;
      emitToken('token:update', token);
    });
    persistState();
    emitCharacterUpdate(character);
  });

  socket.on('character:combat:update', (payload = {}) => {
    const character = state.characters[String(payload.name || '')];
    if (!ownsCharacter(socket, character)) return deny(socket, 'You can only manage combat for your own character.');
    normalizeCharacter(character);
    const combat = character.combat;
    const amount = Math.max(0, Math.min(9999, Number(payload.amount) || 0));
    if (payload.action === 'damage' && amount) {
      const absorbed = Math.min(character.tempHp, amount);
      character.tempHp -= absorbed;
      character.hp = Math.max(0, character.hp - (amount - absorbed));
      if (combat.concentration) {
        const dc = Math.max(10, Math.floor(amount / 2));
        for (const client of io.sockets.sockets.values()) {
          if (ownsCharacter(client, character)) client.emit('concentration:required', { name: character.name, damage: amount, dc });
        }
      }
    } else if (payload.action === 'heal' && amount) {
      character.hp = Math.min(character.maxHp, character.hp + amount);
      if (character.hp > 0) {
        combat.deathSaves = { successes: 0, failures: 0 };
        combat.stable = false;
        combat.dead = false;
      }
    } else if (payload.action === 'tempHp') {
      character.tempHp = amount;
    } else if (payload.action === 'condition:toggle' && CONDITIONS.has(payload.condition)) {
      combat.conditions = combat.conditions.includes(payload.condition)
        ? combat.conditions.filter(condition => condition !== payload.condition)
        : [...combat.conditions, payload.condition];
    } else if (payload.action === 'concentration:set') {
      combat.concentration = !!payload.value;
    } else if (payload.action === 'exhaustion') {
      combat.exhaustion = Math.max(0, Math.min(6, combat.exhaustion + Math.sign(Number(payload.delta) || 0)));
    } else if (payload.action === 'deathSave') {
      const kind = payload.kind === 'failures' ? 'failures' : 'successes';
      combat.deathSaves[kind] = Math.max(0, Math.min(3, combat.deathSaves[kind] + Math.sign(Number(payload.delta) || 0)));
      combat.stable = combat.deathSaves.successes >= 3;
      combat.dead = combat.deathSaves.failures >= 3;
    } else if (payload.action === 'spellSlot') {
      const level = Math.max(1, Math.min(9, Number(payload.level) || 1));
      const slot = combat.spellSlots[level];
      slot.used = Math.max(0, Math.min(slot.total, slot.used + Math.sign(Number(payload.delta) || 0)));
    } else if (payload.action === 'restoreAllSlots') {
      Object.values(combat.spellSlots).forEach(slot => { slot.used = 0; });
    } else if (payload.action === 'longRest') {
      character.hp = character.maxHp;
      character.tempHp = 0;
      combat.concentration = false;
      combat.deathSaves = { successes: 0, failures: 0 };
      combat.stable = false;
      combat.dead = false;
      combat.exhaustion = Math.max(0, combat.exhaustion - 1);
      Object.values(combat.spellSlots).forEach(slot => { slot.used = 0; });
    } else {
      return;
    }
    syncCombatFields(character);
    syncCharacterTokens(character);
    persistState();
    emitCharacterUpdate(character);
  });

  // --- Dice roller ---
  socket.on('roll:make', (payload = {}) => {
    if (!socket.data.identified) return deny(socket, 'Join the table before rolling.');
    const character = payload.characterName ? state.characters[String(payload.characterName)] : null;
    const rollToken = payload.tokenId ? state.tokens.find(token => token.id === String(payload.tokenId)) : null;
    if (payload.characterName && !ownsCharacter(socket, character)) return deny(socket, 'You cannot roll for another player’s character.');
    const validCharacterToken = !!character && !!rollToken && rollToken.kind === 'pc' &&
      rollToken.characterName === character.name && ownsCharacter(socket, character);
    const validNpcToken = isDm(socket) && rollToken?.kind === 'npc';
    if (payload.tokenId && !validCharacterToken && !validNpcToken) {
      return deny(socket, 'You cannot roll for that token.');
    }
    let count = Math.max(1, Math.min(20, Number(payload.count) || 1));
    let sides = Math.max(2, Math.min(1000, Number(payload.sides) || 20));
    const modifier = Math.max(-1000, Math.min(1000, Number(payload.modifier) || 0));
    const mode = ['advantage', 'disadvantage'].includes(payload.mode) && sides === 20 && count === 1 ? payload.mode : 'normal';
    const actualCount = mode === 'normal' ? count : 2;
    const rolls = Array.from({ length: actualCount }, () => 1 + Math.floor(Math.random() * sides));
    const kept = mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : null;
    const diceTotal = kept ?? rolls.reduce((a, b) => a + b, 0);
    const total = diceTotal + modifier;
    const expression = mode === 'normal'
      ? `${count}d${sides}${modifier ? (modifier > 0 ? '+' + modifier : modifier) : ''}`
      : `2d20${mode === 'advantage' ? 'kh1' : 'kl1'}${modifier ? (modifier > 0 ? '+' + modifier : modifier) : ''}`;
    const rollerName = String(socket.data.name || 'Someone').slice(0, 80);
    const entry = {
      id: 'r' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: rollToken
        ? `${rollerName} as ${rollToken.label}`
        : (character && rollerName !== character.name ? `${rollerName} as ${character.name}` : (character?.name || rollerName)),
      characterName: character?.name || null,
      label: String(payload.label || '').slice(0, 140),
      expression,
      rolls,
      kept,
      mode,
      modifier,
      total,
      ts: Date.now()
    };
    const hasTargetDc = payload.targetDc !== null && payload.targetDc !== undefined && payload.targetDc !== '' &&
      Number.isFinite(Number(payload.targetDc));
    if (hasTargetDc) {
      entry.targetDc = Math.max(1, Math.min(1000, Number(payload.targetDc)));
      entry.success = total >= entry.targetDc;
    }
    state.rollLog.unshift(entry);
    state.rollLog = state.rollLog.slice(0, 50);
    if (payload.initiativeName && sides === 20 && (isDm(socket) || payload.initiativeName === character?.name)) {
      const initiativeToken = rollToken || state.tokens.find(entry => entry.characterName === payload.initiativeName);
      upsertInitiativeEntry({ name: payload.initiativeName, value: total, tokenId: initiativeToken?.id || null });
      io.emit('initiative:update', state.initiative);
    }
    if (payload.concentrationFor && character?.name === payload.concentrationFor && entry.targetDc && !entry.success) {
      normalizeCharacter(character);
      character.combat.concentration = false;
      syncCombatFields(character);
      emitCharacterUpdate(character);
      syncCharacterTokens(character);
    }
    persistState();
    io.emit('roll:made', entry);
  });

  // --- Initiative tracker ---
  socket.on('initiative:add', ({ name, value, tokenId }) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can add initiative manually.');
    upsertInitiativeEntry({ name, value, tokenId });
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:remove', ({ id }) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change turn order.');
    const currentId = state.initiative.entries[state.initiative.currentIndex]?.id || null;
    const idx = state.initiative.entries.findIndex(e => e.id === id);
    if (idx !== -1) {
      state.initiative.entries.splice(idx, 1);
      state.initiative.currentIndex = currentId && currentId !== id
        ? state.initiative.entries.findIndex(entry => entry.id === currentId)
        : Math.min(idx, state.initiative.entries.length - 1);
    }
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:next', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can advance turns.');
    if (state.initiative.entries.length === 0) return;
    const next = state.initiative.currentIndex + 1;
    if (next >= state.initiative.entries.length) {
      state.initiative.currentIndex = 0;
      state.initiative.round += 1;
    } else {
      state.initiative.currentIndex = next;
    }
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:reset', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can reset initiative.');
    state.initiative = { entries: [], round: 1, currentIndex: -1 };
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('disconnect', () => {
    if (socket.data.name) {
      io.emit('presence', { role: socket.data.role, name: socket.data.name, connected: false });
    }
  });
});

dbReady.then(() => {
  server.listen(PORT, () => {
    console.log(`Humblewood Table running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

async function flushAndExit() {
  clearTimeout(saveTimer);
  if (pendingSave) {
    try {
      await db.execute({
        sql: 'INSERT INTO state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
        args: [JSON.stringify(state)]
      });
    } catch (err) {
      console.error('Failed to flush state on shutdown:', err.message);
    }
  }
  process.exit(0);
}
process.on('SIGTERM', flushAndExit);
process.on('SIGINT', flushAndExit);
