const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');

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
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
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

const localDir = path.join(__dirname, 'data');
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

const dbReady = db.execute('CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT)')
  .then(loadStateFromDb);

function broadcastState() {
  io.emit('state:full', state);
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
  socket.emit('state:full', state);

  socket.on('identify', ({ role, name }) => {
    socket.data.role = role;
    socket.data.name = name;
    io.emit('presence', { role, name, connected: true });
  });

  // --- Map / scene ---
  socket.on('scene:setMap', ({ mapUrl, mapName }) => {
    state.scene.mapUrl = mapUrl;
    state.scene.mapName = mapName || 'Map';
    state.scene.doodlePaths = [];
    persistState();
    io.emit('scene:update', state.scene);
  });

  socket.on('scene:setGrid', ({ gridSize, gridVisible }) => {
    if (gridSize !== undefined) state.scene.gridSize = Math.max(10, Math.min(300, Number(gridSize) || 50));
    if (gridVisible !== undefined) state.scene.gridVisible = !!gridVisible;
    persistState();
    io.emit('scene:update', state.scene);
  });

  socket.on('scene:doodle:add', (path) => {
    state.scene.doodlePaths.push(path);
    persistState();
    io.emit('scene:doodle:add', path);
  });

  socket.on('scene:doodle:undo', () => {
    state.scene.doodlePaths.pop();
    persistState();
    io.emit('scene:doodle:redrawAll', state.scene.doodlePaths);
  });

  socket.on('scene:doodle:clear', () => {
    state.scene.doodlePaths = [];
    persistState();
    io.emit('scene:doodle:clear');
  });

  // --- Tokens ---
  socket.on('token:add', (token) => {
    if (token.visibleToPlayers === undefined) token.visibleToPlayers = true;
    state.tokens.push(token);
    persistState();
    io.emit('token:add', token);
  });

  socket.on('token:move', ({ id, x, y }) => {
    const t = state.tokens.find(t => t.id === id);
    if (t) { t.x = x; t.y = y; }
    persistState();
    socket.broadcast.emit('token:move', { id, x, y });
  });

  socket.on('token:update', (updated) => {
    const idx = state.tokens.findIndex(t => t.id === updated.id);
    if (idx !== -1) state.tokens[idx] = { ...state.tokens[idx], ...updated };
    persistState();
    io.emit('token:update', updated);
  });

  socket.on('token:remove', ({ id }) => {
    state.tokens = state.tokens.filter(t => t.id !== id);
    persistState();
    io.emit('token:remove', { id });
  });

  // --- Jukebox ---
  socket.on('jukebox:setPlaylist', (playlist) => {
    state.jukebox.playlist = playlist;
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:play', ({ index }) => {
    state.jukebox.currentIndex = index;
    state.jukebox.isPlaying = true;
    state.jukebox.startedAt = Date.now();
    state.jukebox.seek = 0;
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:pause', () => {
    state.jukebox.isPlaying = false;
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:resume', () => {
    state.jukebox.isPlaying = true;
    state.jukebox.startedAt = Date.now();
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  // --- Character sheets ---
  // Lightweight ownership check: not full auth, but stops players from
  // accidentally (or deliberately) editing/deleting each other's sheets.
  // The DM can always edit/delete any sheet.
  socket.on('character:save', (sheet) => {
    if (!sheet || typeof sheet !== 'object') return;
    const name = String(sheet.name || '').trim().slice(0, 100);
    if (!name) return;
    const originalName = String(sheet._originalName || name).trim().slice(0, 100);
    const original = state.characters[originalName];
    const destination = state.characters[name];
    const ownedSheet = original || destination;
    const isDm = socket.data.role === 'dm';
    if (!isDm && ownedSheet && ownedSheet.owner && ownedSheet.owner !== socket.data.name) {
      socket.emit('character:denied', { name });
      return;
    }
    if (!isDm && originalName !== name && destination && destination !== original && destination.owner && destination.owner !== socket.data.name) {
      socket.emit('character:denied', { name });
      return;
    }
    const owner = original?.owner || destination?.owner || socket.data.name || 'Unknown';
    delete sheet._originalName;
    sheet.name = name;
    sheet.owner = owner;
    if (originalName !== name && original) {
      delete state.characters[originalName];
      io.emit('character:remove', { name: originalName });
    }
    state.characters[name] = sheet;
    persistState();
    io.emit('character:update', sheet);
  });

  socket.on('character:remove', ({ name }) => {
    const existing = state.characters[name];
    if (existing && socket.data.role !== 'dm' && existing.owner && existing.owner !== socket.data.name) {
      socket.emit('character:denied', { name });
      return;
    }
    delete state.characters[name];
    persistState();
    io.emit('character:remove', { name });
  });

  // --- Dice roller ---
  socket.on('roll:make', ({ name, count, sides, modifier, mode, label, initiativeName, tokenId }) => {
    count = Math.max(1, Math.min(20, Number(count) || 1));
    sides = Math.max(2, Math.min(1000, Number(sides) || 20));
    modifier = Number(modifier) || 0;
    mode = ['advantage', 'disadvantage'].includes(mode) && sides === 20 && count === 1 ? mode : 'normal';
    const actualCount = mode === 'normal' ? count : 2;
    const rolls = Array.from({ length: actualCount }, () => 1 + Math.floor(Math.random() * sides));
    const kept = mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : null;
    const diceTotal = kept ?? rolls.reduce((a, b) => a + b, 0);
    const total = diceTotal + modifier;
    const expression = mode === 'normal'
      ? `${count}d${sides}${modifier ? (modifier > 0 ? '+' + modifier : modifier) : ''}`
      : `2d20${mode === 'advantage' ? 'kh1' : 'kl1'}${modifier ? (modifier > 0 ? '+' + modifier : modifier) : ''}`;
    const entry = {
      id: 'r' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: String(name || 'Someone').slice(0, 140),
      label: String(label || '').slice(0, 140),
      expression,
      rolls, kept, mode, modifier, total,
      ts: Date.now()
    };
    state.rollLog.unshift(entry);
    state.rollLog = state.rollLog.slice(0, 50);
    if (initiativeName && sides === 20) {
      upsertInitiativeEntry({ name: initiativeName, value: total, tokenId });
      io.emit('initiative:update', state.initiative);
    }
    persistState();
    io.emit('roll:made', entry);
  });

  // --- Initiative tracker ---
  socket.on('initiative:add', ({ name, value, tokenId }) => {
    if (socket.data.role !== 'dm') return;
    upsertInitiativeEntry({ name, value, tokenId });
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:remove', ({ id }) => {
    if (socket.data.role !== 'dm') return;
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
    if (socket.data.role !== 'dm') return;
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
    if (socket.data.role !== 'dm') return;
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
