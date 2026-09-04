const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { createClient } = require('@libsql/client');
const { createDefaultState } = require('./default-state');

const scryptAsync = promisify(crypto.scrypt);
const CONDITIONS = new Set([
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated',
  'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
  'Stunned', 'Unconscious'
]);

function createRoom({ dataDir, dmPin, io }) {
  const defaultState = createDefaultState();
  let state = createDefaultState();
  let saveTimer = null;
  let pendingSave = false;

  fs.mkdirSync(dataDir, { recursive: true });
  const db = createClient({ url: `file:${path.join(dataDir, 'local.db')}` });

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cleanPronouns(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  }

  function cleanAttacks(attacks) {
    if (!Array.isArray(attacks)) return [];
    return attacks.slice(0, 60).map(attack => ({
      id: String(attack?.id || '').slice(0, 140),
      name: String(attack?.name || '').trim().slice(0, 100),
      bonus: String(attack?.bonus || '').trim().slice(0, 30),
      damage: String(attack?.damage || '').trim().slice(0, 80),
      details: String(attack?.details || '').trim().slice(0, 1200),
      source: String(attack?.source || '').trim().slice(0, 80)
    })).filter(attack => attack.name);
  }

  function cleanSpells(spells) {
    if (!Array.isArray(spells)) return [];
    return spells.slice(0, 300).map((spell, index) => ({
      id: String(spell?.id || `spell-${index}`).slice(0, 140),
      name: String(spell?.name || '').trim().slice(0, 100),
      level: Math.max(0, Math.min(9, Number(spell?.level) || 0)),
      school: String(spell?.school || '').trim().slice(0, 80),
      range: String(spell?.range || '').trim().slice(0, 160),
      castingTime: String(spell?.castingTime || '').trim().slice(0, 160),
      duration: String(spell?.duration || '').trim().slice(0, 160),
      components: String(spell?.components || '').trim().slice(0, 500),
      attack: String(spell?.attack || '').trim().slice(0, 160),
      damage: String(spell?.damage || '').trim().slice(0, 160),
      effect: String(spell?.effect || '').trim().slice(0, 3000),
      source: String(spell?.source || '').trim().slice(0, 80)
    })).filter(spell => spell.name);
  }

  function cleanNpcSheet(sheet) {
    if (!sheet || typeof sheet !== 'object') return null;
    const fields = {};
    Object.entries(sheet.fields && typeof sheet.fields === 'object' ? sheet.fields : {}).slice(0, 500).forEach(([key, value]) => {
      const safeKey = String(key).slice(0, 100);
      const maximumLength = safeKey === 'spell-list' ? 250000 : 12000;
      fields[safeKey] = typeof value === 'boolean' ? value : String(value ?? '').slice(0, maximumLength);
    });
    return {
      name: String(sheet.name || fields.name || '').trim().slice(0, 100),
      pronouns: cleanPronouns(sheet.pronouns ?? fields.pronouns),
      portraitUrl: String(sheet.portraitUrl || '').slice(0, 1000) || null,
      challenge: String(sheet.challenge || '').trim().slice(0, 20),
      species: String(sheet.species || '').slice(0, 100),
      race: String(sheet.race || '').slice(0, 100),
      subrace: String(sheet.subrace || '').slice(0, 100),
      charClass: String(sheet.charClass || '').slice(0, 100),
      subclass: String(sheet.subclass || '').slice(0, 100),
      level: Math.max(1, Math.min(20, Number(sheet.level) || 1)),
      hp: Math.max(0, Math.min(9999, Number(sheet.hp) || 0)),
      maxHp: Math.max(1, Math.min(9999, Number(sheet.maxHp) || 1)),
      tempHp: Math.max(0, Math.min(9999, Number(sheet.tempHp) || 0)),
      ac: Math.max(0, Math.min(99, Number(sheet.ac) || 10)),
      initiativeModifier: Math.max(-99, Math.min(99, Number(sheet.initiativeModifier) || 0)),
      speed: String(sheet.speed || '').slice(0, 160),
      abilities: Object.fromEntries(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(ability => [
        ability, Math.max(1, Math.min(30, Number(sheet.abilities?.[ability]) || 10))
      ])),
      saves: sheet.saves && typeof sheet.saves === 'object' ? cloneJson(sheet.saves) : {},
      skills: sheet.skills && typeof sheet.skills === 'object' ? cloneJson(sheet.skills) : {},
      attacks: cleanAttacks(sheet.attacks),
      spells: cleanSpells(sheet.spells),
      spellcasting: {
        className: String(sheet.spellcasting?.className || '').slice(0, 100),
        ability: String(sheet.spellcasting?.ability || '').slice(0, 20),
        saveDc: Math.max(0, Math.min(99, Number(sheet.spellcasting?.saveDc) || 0)),
        attackBonus: Math.max(-99, Math.min(99, Number(sheet.spellcasting?.attackBonus) || 0))
      },
      inventory: Array.isArray(sheet.inventory) ? sheet.inventory.slice(0, 300).map((item, index) => ({
        id: String(item?.id || `item-${index}`).slice(0, 140),
        name: String(item?.name || '').trim().slice(0, 200),
        qty: Math.max(1, Math.min(9999, Number(item?.qty) || 1))
      })).filter(item => item.name) : [],
      notes: String(sheet.notes || '').slice(0, 12000),
      fields
    };
  }

  function normalizeNpc(npc) {
    if (!npc || typeof npc !== 'object') return null;
    npc.id = String(npc.id || (`npc_${Date.now()}${Math.random().toString(36).slice(2, 7)}`)).slice(0, 120);
    npc.name = String(npc.name || npc.label || 'Unnamed NPC').trim().slice(0, 100) || 'Unnamed NPC';
    npc.pronouns = cleanPronouns(npc.pronouns ?? npc.sheet?.pronouns ?? npc.sheet?.fields?.pronouns);
    npc.imageUrl = String(npc.imageUrl || '').slice(0, 1000) || null;
    npc.maxHp = Math.max(1, Math.min(9999, Number(npc.maxHp ?? npc.hp) || 10));
    npc.hp = Math.max(0, Math.min(npc.maxHp, Number(npc.hp) || 0));
    npc.tempHp = Math.max(0, Math.min(9999, Number(npc.tempHp) || 0));
    npc.ac = Math.max(0, Math.min(99, Number(npc.ac) || 10));
    npc.initiativeModifier = Math.max(-99, Math.min(99, Number(npc.initiativeModifier) || 0));
    npc.tokenScale = Math.max(0.35, Math.min(3, Number(npc.tokenScale ?? npc.sizeScale) || 1));
    npc.attacks = cleanAttacks(npc.attacks);
    npc.spells = cleanSpells(npc.spells || npc.sheet?.spells);
    const spellSaveDcRaw = npc.sheet?.fields?.['spell-dc'] ?? npc.spellcasting?.saveDc;
    const spellAttackRaw = npc.sheet?.fields?.['spell-attack'] ?? npc.spellcasting?.attackBonus;
    npc.spellcasting = {
      className: String(npc.spellcasting?.className || npc.sheet?.spellcasting?.className || '').slice(0, 100),
      ability: String(npc.spellcasting?.ability || npc.sheet?.spellcasting?.ability || '').slice(0, 20),
      saveDc: spellSaveDcRaw === '' || spellSaveDcRaw === undefined || spellSaveDcRaw === null
        ? null
        : Math.max(0, Math.min(99, Number(spellSaveDcRaw) || 0)),
      attackBonus: spellAttackRaw === '' || spellAttackRaw === undefined || spellAttackRaw === null
        ? null
        : Math.max(-99, Math.min(99, Number(spellAttackRaw) || 0))
    };
    npc.sheet = cleanNpcSheet(npc.sheet);
    if (npc.sheet) {
      npc.sheet.pronouns = npc.pronouns;
      npc.sheet.fields.pronouns = npc.pronouns;
    }
    npc.notes = String(npc.notes || '').slice(0, 4000);
    const combat = npc.combat && typeof npc.combat === 'object' ? npc.combat : {};
    const spellSlots = {};
    for (let level = 1; level <= 9; level += 1) {
      const stored = combat.spellSlots?.[level] || combat.spellSlots?.[String(level)] || {};
      const total = Math.max(0, Math.min(99, Number(stored.total ?? npc.sheet?.fields?.[`spell-slots-${level}`]) || 0));
      spellSlots[level] = {
        total,
        used: Math.max(0, Math.min(total, Number(stored.used ?? npc.sheet?.fields?.[`spell-used-${level}`]) || 0))
      };
    }
    npc.combat = {
      conditions: Array.isArray(combat.conditions) ? combat.conditions.filter(condition => CONDITIONS.has(condition)) : [],
      concentration: !!combat.concentration,
      exhaustion: Math.max(0, Math.min(6, Number(combat.exhaustion) || 0)),
      spellSlots
    };
    return npc;
  }

  function npcFromToken(token) {
    return normalizeNpc({
      id: token.npcId || (`npc_${token.id}`),
      name: token.label,
      pronouns: token.pronouns,
      imageUrl: token.imageUrl,
      hp: token.hp,
      maxHp: token.maxHp,
      tempHp: token.tempHp,
      ac: token.ac,
      initiativeModifier: token.initiativeModifier,
      tokenScale: token.sizeScale,
      attacks: token.attacks,
      spells: token.spells,
      spellcasting: token.spellcasting,
      notes: token.notes,
      combat: token.combat
    });
  }

  function normalizeToken(token) {
    if (!token || typeof token !== 'object') return null;
    token.id = String(token.id || (`t${Date.now()}${Math.random().toString(36).slice(2, 7)}`)).slice(0, 140);
    token.kind = ['pc', 'npc', 'item'].includes(token.kind) ? token.kind : 'npc';
    token.label = String(token.label || 'Token').trim().slice(0, 100) || 'Token';
    token.pronouns = token.kind === 'item' ? '' : cleanPronouns(token.pronouns);
    token.imageUrl = String(token.imageUrl || '').slice(0, 1000) || null;
    token.size = Math.max(18, Math.min(180, Number(token.size) || 44));
    token.sizeScale = Math.max(0.35, Math.min(3, Number(token.sizeScale) || 1));
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
      token.npcId = String(token.npcId || (`npc_${token.id}`)).slice(0, 120);
      const npc = normalizeNpc({ ...token, id: token.npcId, name: token.label });
      token.pronouns = npc.pronouns;
      token.ac = npc.ac;
      token.initiativeModifier = npc.initiativeModifier;
      token.attacks = npc.attacks;
      token.spells = npc.spells;
      token.spellcasting = npc.spellcasting;
      token.notes = npc.notes;
      token.combat = npc.combat;
    }
    return token;
  }

  function syncNpcRosterFromTokens(tokens, overwrite = false) {
    (tokens || []).filter(token => token.kind === 'npc').forEach(token => {
      normalizeToken(token);
      const fromToken = npcFromToken(token);
      const existing = state.npcs[fromToken.id];
      if (overwrite || !existing) state.npcs[fromToken.id] = normalizeNpc({ ...existing, ...fromToken, sheet: existing?.sheet || null });
    });
  }

  function syncNpcFromToken(token) {
    if (token?.kind === 'npc') {
      const existing = state.npcs[token.npcId];
      state.npcs[token.npcId] = normalizeNpc({ ...existing, ...npcFromToken(token), sheet: existing?.sheet || null });
    }
  }

  function applyNpcToToken(npc, token) {
    normalizeNpc(npc);
    token.npcId = npc.id;
    token.label = npc.name;
    token.pronouns = npc.pronouns;
    token.kind = 'npc';
    token.imageUrl = npc.imageUrl;
    token.sizeScale = Math.max(0.35, Math.min(3, Number(token.sizeScale ?? npc.tokenScale) || 1));
    token.hp = npc.hp;
    token.maxHp = npc.maxHp;
    token.tempHp = npc.tempHp;
    token.ac = npc.ac;
    token.initiativeModifier = npc.initiativeModifier;
    token.attacks = cloneJson(npc.attacks);
    token.spells = cloneJson(npc.spells);
    token.spellcasting = cloneJson(npc.spellcasting);
    token.notes = npc.notes;
    token.combat = cloneJson(npc.combat);
    return normalizeToken(token);
  }

  function normalizeCharacter(character) {
    if (!character.fields || typeof character.fields !== 'object') character.fields = {};
    character.pronouns = cleanPronouns(character.pronouns ?? character.fields.pronouns);
    character.fields.pronouns = character.pronouns;
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

  function normalizeSavedScenes() {
    const normalized = {};
    Object.entries(state.savedScenes || {}).forEach(([fallbackName, saved]) => {
      if (!saved || typeof saved !== 'object') return;
      const name = String(saved.name || fallbackName).trim().slice(0, 80);
      if (!name) return;
      const scene = { ...defaultState.scene, ...(saved.scene || {}) };
      if (!Array.isArray(scene.doodlePaths)) scene.doodlePaths = [];
      if (!Array.isArray(scene.fogShapes)) scene.fogShapes = [];
      const tokens = Array.isArray(saved.tokens) ? saved.tokens : [];
      tokens.forEach(normalizeToken);
      const initiative = { ...defaultState.initiative, ...(saved.initiative || {}) };
      if (!Array.isArray(initiative.entries)) initiative.entries = [];
      normalized[name] = { name, savedAt: Number(saved.savedAt) || Date.now(), scene, tokens, initiative };
      syncNpcRosterFromTokens(tokens);
    });
    state.savedScenes = normalized;
  }

  async function loadStateFromDb() {
    const result = await db.execute('SELECT data FROM state WHERE id = 1');
    if (!result.rows.length) return;
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
      // A deployment restarts the server. Restore these requested map defaults
      // even when an older persisted state had the toggles switched off.
      state.scene.fogEnabled = true;
      state.scene.snapToGrid = true;
      if (!/^#[0-9a-f]{6}$/i.test(String(state.scene.gridColor || ''))) {
        state.scene.gridColor = defaultState.scene.gridColor;
      }
      if (!Array.isArray(state.scene.doodlePaths)) state.scene.doodlePaths = [];
      if (!Array.isArray(state.scene.fogShapes)) state.scene.fogShapes = [];
      if (!Array.isArray(state.initiative.entries)) state.initiative.entries = [];
      Object.values(state.characters).forEach(normalizeCharacter);
      Object.values(state.npcs).forEach(normalizeNpc);
      state.tokens.forEach(token => {
        normalizeToken(token);
        if (token.kind !== 'pc' || token.characterName) return;
        const character = Object.values(state.characters).find(entry =>
          entry.name.toLowerCase() === String(token.label || '').toLowerCase()
        );
        if (character) {
          token.characterName = character.name;
          token.ownerUsername = character.ownerUsername || null;
          token.ownerId = character.ownerId || null;
        }
      });
      normalizeSavedScenes();
      syncNpcRosterFromTokens(state.tokens, true);
    } catch (error) {
      console.warn('Could not parse saved state, starting fresh.', error.message);
    }
  }

  const ready = Promise.all([
    db.execute('CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT)'),
    db.execute(`CREATE TABLE IF NOT EXISTS player_accounts (
      username TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`)
  ]).then(loadStateFromDb);

  async function writeState() {
    await db.execute({
      sql: 'INSERT INTO state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
      args: [JSON.stringify(state)]
    });
  }

  function persistState() {
    pendingSave = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      if (!pendingSave) return;
      pendingSave = false;
      try {
        await writeState();
      } catch (error) {
        console.error('Failed to save state:', error.message);
      }
    }, 300);
  }

  async function flush() {
    clearTimeout(saveTimer);
    if (!pendingSave) return;
    pendingSave = false;
    try {
      await writeState();
    } catch (error) {
      console.error('Failed to flush state on shutdown:', error.message);
    }
  }

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

  function publicCharacter(socket, character) {
    normalizeCharacter(character);
    const { ownerId, ownerUsername, ...safe } = character;
    return { ...safe, claimed: !!ownerUsername, legacyClaimed: !!ownerId, canManage: ownsCharacter(socket, character) };
  }

  function publicToken(socket, token) {
    const { ownerId, ownerUsername, ...safe } = token;
    if (token.characterName) {
      safe.pronouns = cleanPronouns(state.characters[token.characterName]?.pronouns || safe.pronouns);
    }
    if (!isDm(socket) && token.kind === 'npc') {
      delete safe.attacks;
      delete safe.spells;
      delete safe.spellcasting;
      delete safe.notes;
    }
    const characterCombat = token.characterName ? state.characters[token.characterName]?.combat : null;
    const conditionBadges = characterCombat ? {
      conditions: [...(characterCombat.conditions || [])],
      concentration: !!characterCombat.concentration,
      exhaustion: Number(characterCombat.exhaustion) || 0
    } : safe.conditionBadges;
    return { ...safe, conditionBadges, canControl: controlsToken(socket, token) };
  }

  function publicDoodlePath(doodlePath) {
    const { authorKey, ...safe } = doodlePath || {};
    return safe;
  }

  function publicScene() {
    return {
      ...state.scene,
      doodlePaths: (state.scene.doodlePaths || []).map(publicDoodlePath)
    };
  }

  function publicNpc(npc) {
    return cloneJson(normalizeNpc(npc));
  }

  function publicStateFor(socket) {
    const visibleCharacters = Object.entries(state.characters)
      .filter(([, character]) => isDm(socket) || ownsCharacter(socket, character));
    return {
      ...state,
      scene: publicScene(),
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

  function broadcastState() {
    for (const client of io.sockets.sockets.values()) {
      if (client.data.identified) client.emit('state:full', publicStateFor(client));
    }
  }

  function emitCharacterUpdate(character) {
    for (const client of io.sockets.sockets.values()) {
      if (!client.data.identified) continue;
      if (isDm(client) || ownsCharacter(client, character)) {
        client.emit('character:update', publicCharacter(client, character));
      } else {
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

  function emitSceneUpdate() {
    io.emit('scene:update', publicScene());
  }

  function setSceneDirty(dirty) {
    const next = !!dirty;
    if (state.sceneDirty === next) return;
    state.sceneDirty = next;
    io.emit('scene:dirty', { dirty: next });
  }

  function markSceneDirty() {
    setSceneDirty(true);
  }

  function syncCharacterTokens(character) {
    const linkedTokens = state.tokens.filter(token => token.characterName === character.name);
    linkedTokens.forEach(token => {
      token.label = character.name;
      token.pronouns = character.pronouns;
      token.imageUrl = character.portraitUrl || token.imageUrl || null;
      token.hp = character.hp;
      token.maxHp = character.maxHp;
      token.tempHp = character.tempHp;
      token.conditionBadges = {
        conditions: [...(character.combat?.conditions || [])],
        concentration: !!character.combat?.concentration,
        exhaustion: Number(character.combat?.exhaustion) || 0
      };
      token.ownerUsername = character.ownerUsername || token.ownerUsername || null;
      token.ownerId = null;
      emitToken('token:update', token);
    });
    if (linkedTokens.length) markSceneDirty();
  }

  function snapCoordinateToCell(value, gridSize, gridOffset = 0) {
    const v = Number(value) - gridOffset;
    return Math.floor(v / gridSize) * gridSize + gridSize / 2 + gridOffset;
  }

  function uniqueTokenLabel(baseLabel) {
    const base = String(baseLabel || 'Token').trim().slice(0, 90) || 'Token';
    const used = new Set(state.tokens.map(token => String(token.label || '').toLowerCase()));
    if (!used.has(base.toLowerCase())) return base;
    let number = 2;
    while (used.has(`${base} ${number}`.toLowerCase())) number += 1;
    return `${base} ${number}`.slice(0, 100);
  }

  function pointerColor(name) {
    let hash = 0;
    for (const char of String(name || 'Player')) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return `hsl(${Math.abs(hash) % 360} 68% 50%)`;
  }

  function doodleAuthorKey(socket) {
    return isDm(socket) ? `dm:${socket.id}` : `player:${socket.data.username}`;
  }

  function cleanDoodlePath(requested, socket) {
    if (!requested || !Array.isArray(requested.points)) return null;
    const points = requested.points.slice(0, 8000).map(point => ({
      x: Math.max(-5000, Math.min(50000, Number(point?.x) || 0)),
      y: Math.max(-5000, Math.min(50000, Number(point?.y) || 0))
    }));
    if (points.length < 2) return null;
    return {
      id: `d${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      color: /^#[0-9a-f]{6}$/i.test(String(requested.color || '')) ? requested.color : '#d98a9e',
      width: Math.max(1, Math.min(20, Number(requested.width) || 3)),
      points,
      authorKey: doodleAuthorKey(socket)
    };
  }

  function cleanFogShape(requested) {
    if (!requested || !['reveal', 'hide'].includes(requested.mode)) return null;
    return {
      id: `f${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      mode: requested.mode,
      x: Math.max(-5000, Math.min(50000, Number(requested.x) || 0)),
      y: Math.max(-5000, Math.min(50000, Number(requested.y) || 0)),
      width: Math.max(1, Math.min(50000, Number(requested.width) || 0)),
      height: Math.max(1, Math.min(50000, Number(requested.height) || 0))
    };
  }

  function removeInitiativeForTokenIds(tokenIds, initiative = state.initiative) {
    const ids = new Set(tokenIds);
    const currentId = initiative.entries[initiative.currentIndex]?.id || null;
    initiative.entries = initiative.entries.filter(entry => !ids.has(entry.tokenId));
    initiative.currentIndex = currentId ? initiative.entries.findIndex(entry => entry.id === currentId) : -1;
    if (initiative.currentIndex < 0 && initiative.entries.length) initiative.currentIndex = 0;
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
        id: `i${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
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

  return {
    io,
    db,
    dmPin,
    defaultState,
    CONDITIONS,
    ready,
    flush,
    get state() { return state; },
    applyNpcToToken,
    broadcastState,
    cleanDoodlePath,
    cleanFogShape,
    cloneJson,
    controlsToken,
    deny,
    doodleAuthorKey,
    emitCharacterUpdate,
    emitNpcRoster,
    emitSavedScenes,
    emitSceneUpdate,
    emitToken,
    isDm,
    makePasswordRecord,
    markSceneDirty,
    normalizeCharacter,
    normalizeNpc,
    normalizeToken,
    normalizeUsername,
    npcFromToken,
    ownsCharacter,
    persistState,
    pointerColor,
    publicDoodlePath,
    publicStateFor,
    publicToken,
    removeInitiativeForTokenIds,
    setSceneDirty,
    snapCoordinateToCell,
    syncCharacterTokens,
    syncCombatFields,
    syncNpcFromToken,
    syncNpcRosterFromTokens,
    uniqueTokenLabel,
    upsertInitiativeEntry,
    validPassword,
    validUsername,
    verifyPassword
  };
}

module.exports = { CONDITIONS, createRoom };
