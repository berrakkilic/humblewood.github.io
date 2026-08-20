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
    doodlePaths: [] // array of {points:[{x,y}], color, width, id}
  },
  tokens: [], // {id, x, y, size, imageUrl, label, kind: 'pc'|'npc'|'item', hp, maxHp, visibleToPlayers}
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
        rollLog: Array.isArray(saved.rollLog) ? saved.rollLog : [],
        tokens: Array.isArray(saved.tokens) ? saved.tokens : [],
        initiative: { ...defaultState.initiative, ...(saved.initiative || {}) }
      };
      if (!Array.isArray(state.scene.doodlePaths)) state.scene.doodlePaths = [];
      if (!Array.isArray(state.initiative.entries)) state.initiative.entries = [];
      Object.values(state.characters).forEach(normalizeCharacter);
      state.tokens.forEach(token => {
        if (token.kind !== 'pc' || token.characterName) return;
        const character = Object.values(state.characters).find(entry => entry.name.toLowerCase() === String(token.label || '').toLowerCase());
        if (character) {
          token.characterName = character.name;
          token.ownerUsername = character.ownerUsername || null;
          token.ownerId = character.ownerId || null;
        }
      });
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

function publicStateFor(socket) {
  return {
    ...state,
    characters: Object.fromEntries(Object.entries(state.characters).map(([name, character]) => [name, publicCharacter(socket, character)])),
    tokens: state.tokens.map(token => publicToken(socket, token))
  };
}

function emitCharacterUpdate(character) {
  for (const client of io.sockets.sockets.values()) {
    if (client.data.identified) client.emit('character:update', publicCharacter(client, character));
  }
}

function emitToken(event, token) {
  for (const client of io.sockets.sockets.values()) {
    if (client.data.identified) client.emit(event, publicToken(client, token));
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

  socket.on('scene:setGrid', ({ gridSize, gridVisible } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the grid.');
    if (gridSize !== undefined) state.scene.gridSize = Math.max(10, Math.min(300, Number(gridSize) || 50));
    if (gridVisible !== undefined) state.scene.gridVisible = !!gridVisible;
    persistState();
    io.emit('scene:update', state.scene);
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
        x: 40,
        y: 40,
        size: 56,
        hp: character.hp,
        maxHp: character.maxHp,
        tempHp: character.tempHp,
        visibleToPlayers: true
      };
      if (!character.ownerUsername) character.ownerUsername = socket.data.username;
      character.ownerId = null;
    } else {
      const linkedCharacter = state.characters[String(requested.characterName || requested.label || '')];
      if (requested.kind === 'pc' && linkedCharacter) normalizeCharacter(linkedCharacter);
      token = {
        id: 't' + Date.now() + Math.random().toString(36).slice(2, 6),
        label: String(requested.label || linkedCharacter?.name || 'Token').trim().slice(0, 100),
        kind: ['pc', 'npc', 'item'].includes(requested.kind) ? requested.kind : 'npc',
        imageUrl: String(requested.imageUrl || linkedCharacter?.portraitUrl || '').slice(0, 1000) || null,
        x: Number.isFinite(Number(requested.x)) ? Number(requested.x) : 40,
        y: Number.isFinite(Number(requested.y)) ? Number(requested.y) : 40,
        size: Math.max(28, Math.min(180, Number(requested.size) || 56)),
        hp: linkedCharacter ? linkedCharacter.hp : (requested.kind === 'item' ? null : Math.max(0, Number(requested.hp) || 10)),
        maxHp: linkedCharacter ? linkedCharacter.maxHp : (requested.kind === 'item' ? null : Math.max(0, Number(requested.maxHp) || 10)),
        tempHp: linkedCharacter ? linkedCharacter.tempHp : 0,
        visibleToPlayers: requested.visibleToPlayers !== false,
        characterName: linkedCharacter?.name || null,
        ownerUsername: linkedCharacter?.ownerUsername || null,
        ownerId: null
      };
    }
    state.tokens.push(token);
    persistState();
    emitToken('token:add', token);
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
    persistState();
    emitToken('token:update', token);
  });

  socket.on('token:remove', ({ id } = {}) => {
    const token = state.tokens.find(entry => entry.id === id);
    if (!controlsToken(socket, token)) return deny(socket, 'You can only remove your own character token.');
    state.tokens = state.tokens.filter(entry => entry.id !== id);
    persistState();
    io.emit('token:remove', { id });
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
    persistState();
    io.emit('character:remove', { name });
    removedTokenIds.forEach(id => io.emit('token:remove', { id }));
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
    if (payload.characterName && !ownsCharacter(socket, character)) return deny(socket, 'You cannot roll for another player’s character.');
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
      name: character && rollerName !== character.name ? `${rollerName} as ${character.name}` : (character?.name || rollerName),
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
    if (Number.isFinite(Number(payload.targetDc))) {
      entry.targetDc = Math.max(1, Math.min(1000, Number(payload.targetDc)));
      entry.success = total >= entry.targetDc;
    }
    state.rollLog.unshift(entry);
    state.rollLog = state.rollLog.slice(0, 50);
    if (payload.initiativeName && sides === 20 && (isDm(socket) || payload.initiativeName === character?.name)) {
      const token = state.tokens.find(entry => entry.characterName === payload.initiativeName);
      upsertInitiativeEntry({ name: payload.initiativeName, value: total, tokenId: token?.id || null });
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
