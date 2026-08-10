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
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/uploads/' + req.file.filename, name: req.file.originalname });
});

// ---- Persisted room state (single table: "Humblewood") ----
// Backed by libSQL — talks to a hosted Turso database over the network so
// state survives redeploys on hosts with an ephemeral filesystem (like
// Render's free tier). If TURSO_DATABASE_URL isn't set (e.g. local dev),
// it falls back to a local SQLite file instead, no cloud account needed.
const { createClient } = require('@libsql/client');

const defaultState = {
  scene: {
    mapUrl: null,
    mapName: 'No map loaded',
    gridSize: 50,
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
  fog: [] // reserved for future fog-of-war rects
};

let state = defaultState;

const usingTurso = !!process.env.TURSO_DATABASE_URL;
if (!usingTurso) {
  console.warn('TURSO_DATABASE_URL not set — falling back to a local file database (data/local.db). This is fine for local testing, but on a host with an ephemeral filesystem, data will NOT survive redeploys. See README for Turso setup.');
  const localDir = path.join(__dirname, 'data');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
}

const db = createClient(
  usingTurso
    ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: 'file:' + path.join(__dirname, 'data', 'local.db') }
);

async function loadStateFromDb() {
  const result = await db.execute('SELECT data FROM state WHERE id = 1');
  if (result.rows.length) {
    try {
      state = { ...defaultState, ...JSON.parse(result.rows[0].data) };
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

  socket.on('scene:doodle:add', (path) => {
    state.scene.doodlePaths.push(path);
    persistState();
    io.emit('scene:doodle:add', path);
  });

  socket.on('scene:doodle:clear', () => {
    state.scene.doodlePaths = [];
    persistState();
    io.emit('scene:doodle:clear');
  });

  // --- Tokens ---
  socket.on('token:add', (token) => {
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
  socket.on('character:save', (sheet) => {
    state.characters[sheet.name] = sheet;
    persistState();
    io.emit('character:update', sheet);
  });

  socket.on('character:remove', ({ name }) => {
    delete state.characters[name];
    persistState();
    io.emit('character:remove', { name });
  });

  // --- Dice roller ---
  socket.on('roll:make', ({ name, count, sides, modifier }) => {
    count = Math.max(1, Math.min(20, Number(count) || 1));
    sides = Math.max(2, Math.min(1000, Number(sides) || 20));
    modifier = Number(modifier) || 0;
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    const entry = {
      id: 'r' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: name || 'Someone',
      expression: `${count}d${sides}${modifier ? (modifier > 0 ? '+' + modifier : modifier) : ''}`,
      rolls, modifier, total,
      ts: Date.now()
    };
    state.rollLog.unshift(entry);
    state.rollLog = state.rollLog.slice(0, 50);
    persistState();
    io.emit('roll:made', entry);
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
