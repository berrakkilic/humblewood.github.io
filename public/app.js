const socket = io();

let myRole = 'dm';
let myName = '';
let state = null;
let selectedTool = 'move';
let draggingToken = null;
let dragOffset = { x: 0, y: 0 };
let pendingTrayToken = null; // token about to be dropped from tray

// ---------------- Join flow ----------------
document.getElementById('role-dm').onclick = () => setRole('dm');
document.getElementById('role-player').onclick = () => setRole('player');
function setRole(role) {
  myRole = role;
  document.getElementById('role-dm').classList.toggle('active', role === 'dm');
  document.getElementById('role-player').classList.toggle('active', role === 'player');
}

document.getElementById('join-btn').onclick = () => {
  const nameInput = document.getElementById('name-input');
  myName = nameInput.value.trim() || (myRole === 'dm' ? 'The DM' : 'A wanderer');
  document.getElementById('join-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.body.setAttribute('data-role', myRole);
  document.getElementById('my-role-pill').textContent = myRole === 'dm' ? 'Dungeon Master' : 'Player · ' + myName;
  socket.emit('identify', { role: myRole, name: myName });
};

// ---------------- Tabs ----------------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
  };
});

// ---------------- Socket state sync ----------------
socket.on('state:full', (s) => {
  state = s;
  renderMap();
  renderTokenTray();
  renderCharacters();
  renderJukebox();
  renderRollLog();
});

socket.on('scene:update', (scene) => { state.scene = scene; renderMap(); });
socket.on('scene:doodle:add', (path) => { state.scene.doodlePaths.push(path); drawDoodlePath(path); });
socket.on('scene:doodle:clear', () => { state.scene.doodlePaths = []; clearDoodleCanvas(); });

socket.on('token:add', (t) => { state.tokens.push(t); renderTokenTray(); renderMapTokens(); });
socket.on('token:move', ({ id, x, y }) => {
  const t = state.tokens.find(t => t.id === id);
  if (t) { t.x = x; t.y = y; }
  const el = document.querySelector(`.token-on-map[data-id="${id}"]`);
  if (el) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
});
socket.on('token:update', (updated) => {
  const idx = state.tokens.findIndex(t => t.id === updated.id);
  if (idx !== -1) state.tokens[idx] = { ...state.tokens[idx], ...updated };
  renderMapTokens(); renderTokenTray();
});
socket.on('token:remove', ({ id }) => {
  state.tokens = state.tokens.filter(t => t.id !== id);
  renderMapTokens(); renderTokenTray();
});

socket.on('jukebox:update', (j) => { state.jukebox = j; renderJukebox(); });
socket.on('character:update', (sheet) => { state.characters[sheet.name] = sheet; renderCharacters(); });
socket.on('character:remove', ({ name }) => { delete state.characters[name]; renderCharacters(); });

socket.on('presence', ({ role, name, connected }) => {
  const el = document.getElementById('presence-list');
  // lightweight ephemeral presence note
  el.textContent = `${name} ${connected ? 'joined' : 'left'} the wood`;
  setTimeout(() => { if (el.textContent.includes(name)) el.textContent = ''; }, 4000);
});

// ================= MAP =================
const mapUpload = document.getElementById('map-upload');
mapUpload.onchange = async () => {
  const file = mapUpload.files[0];
  if (!file) return;
  const url = await uploadFile(file);
  socket.emit('scene:setMap', { mapUrl: url, mapName: file.name });
};

function renderMap() {
  const img = document.getElementById('map-image');
  const empty = document.getElementById('empty-map');
  if (state.scene.mapUrl) {
    img.src = state.scene.mapUrl;
    img.style.display = 'block';
    empty.style.display = 'none';
    img.onload = () => {
      const stage = document.getElementById('map-stage');
      stage.style.width = img.naturalWidth + 'px';
      stage.style.height = img.naturalHeight + 'px';
      img.style.width = img.naturalWidth + 'px';
      img.style.height = img.naturalHeight + 'px';
      const canvas = document.getElementById('doodle-canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      redrawAllDoodles();
      renderMapTokens();
    };
  } else {
    img.style.display = 'none';
    empty.style.display = 'flex';
  }
}

function renderMapTokens() {
  document.querySelectorAll('.token-on-map').forEach(el => el.remove());
  const stage = document.getElementById('map-stage');
  state.tokens.forEach(t => {
    const el = document.createElement('div');
    el.className = 'token-on-map kind-' + t.kind;
    el.dataset.id = t.id;
    el.style.left = t.x + 'px';
    el.style.top = t.y + 'px';
    el.innerHTML = `
      <div class="label">${t.label}</div>
      ${t.imageUrl ? `<img src="${t.imageUrl}">` : emojiFor(t.kind)}
      ${t.maxHp ? `<div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, (t.hp / t.maxHp) * 100)}%"></div></div>` : ''}
    `;
    el.onmousedown = (e) => startDragToken(e, t.id);
    stage.appendChild(el);
  });
}

function emojiFor(kind) {
  return kind === 'pc' ? '🧝' : kind === 'npc' ? '🦊' : '🌸';
}

function startDragToken(e, id) {
  if (selectedTool !== 'move') return;
  e.preventDefault();
  draggingToken = id;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
}

document.addEventListener('mousemove', (e) => {
  if (!draggingToken) return;
  const stage = document.getElementById('map-stage');
  const rect = stage.getBoundingClientRect();
  let x = e.clientX - rect.left - dragOffset.x + 22;
  let y = e.clientY - rect.top - dragOffset.y + 22;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) { el.style.left = (x - 22) + 'px'; el.style.top = (y - 22) + 'px'; }
});

document.addEventListener('mouseup', (e) => {
  if (!draggingToken) return;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) {
    const x = parseFloat(el.style.left);
    const y = parseFloat(el.style.top);
    socket.emit('token:move', { id: draggingToken, x, y });
  }
  draggingToken = null;
});

// ---- Tool toggle ----
document.getElementById('tool-move').onclick = () => setTool('move');
document.getElementById('tool-doodle').onclick = () => setTool('doodle');
function setTool(tool) {
  selectedTool = tool;
  document.getElementById('tool-move').classList.toggle('active', tool === 'move');
  document.getElementById('tool-doodle').classList.toggle('active', tool === 'doodle');
  document.getElementById('map-stage').classList.toggle('doodling', tool === 'doodle');
}

document.getElementById('clear-doodles-btn').onclick = () => socket.emit('scene:doodle:clear');

// ---- Doodling ----
let isDrawing = false;
let currentPath = null;
const doodleCanvas = document.getElementById('doodle-canvas');
const doodleCtx = doodleCanvas.getContext('2d');

doodleCanvas.onmousedown = (e) => {
  if (selectedTool !== 'doodle') return;
  isDrawing = true;
  const pos = getCanvasPos(e);
  currentPath = { id: 'd' + Date.now(), color: document.getElementById('doodle-color').value, width: 3, points: [pos] };
};
doodleCanvas.onmousemove = (e) => {
  if (!isDrawing || !currentPath) return;
  const pos = getCanvasPos(e);
  currentPath.points.push(pos);
  drawDoodlePath(currentPath, true);
};
document.addEventListener('mouseup', () => {
  if (isDrawing && currentPath && currentPath.points.length > 1) {
    socket.emit('scene:doodle:add', currentPath);
  }
  isDrawing = false;
  currentPath = null;
});

function getCanvasPos(e) {
  const rect = doodleCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function drawDoodlePath(path, liveOnly) {
  doodleCtx.strokeStyle = path.color;
  doodleCtx.lineWidth = path.width;
  doodleCtx.lineCap = 'round';
  doodleCtx.lineJoin = 'round';
  doodleCtx.beginPath();
  path.points.forEach((p, i) => {
    if (i === 0) doodleCtx.moveTo(p.x, p.y); else doodleCtx.lineTo(p.x, p.y);
  });
  doodleCtx.stroke();
}

function clearDoodleCanvas() {
  doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
}
function redrawAllDoodles() {
  clearDoodleCanvas();
  state.scene.doodlePaths.forEach(p => drawDoodlePath(p));
}

// ---- Token tray ----
document.getElementById('add-token-btn').onclick = async () => {
  const name = document.getElementById('token-name').value.trim();
  if (!name) return alert('Give your token a name first.');
  const kind = document.getElementById('token-kind').value;
  const file = document.getElementById('token-image').files[0];
  let imageUrl = null;
  if (file) imageUrl = await uploadFile(file);
  const token = {
    id: 't' + Date.now(),
    label: name,
    kind,
    imageUrl,
    x: 40, y: 40,
    hp: kind !== 'item' ? 10 : null,
    maxHp: kind !== 'item' ? 10 : null
  };
  socket.emit('token:add', token);
  document.getElementById('token-name').value = '';
  document.getElementById('token-image').value = '';
};

function renderTokenTray() {
  const list = document.getElementById('token-list');
  list.innerHTML = '';
  state.tokens.forEach(t => {
    const chip = document.createElement('div');
    chip.className = 'token-chip kind-' + t.kind;
    chip.title = t.label + ' (drag onto map, or click to nudge into view)';
    chip.innerHTML = (t.imageUrl ? `<img src="${t.imageUrl}">` : emojiFor(t.kind)) +
      `<span class="del dm-only" title="Remove">×</span>`;
    chip.querySelector('.del').onclick = (e) => {
      e.stopPropagation();
      socket.emit('token:remove', { id: t.id });
    };
    chip.onclick = () => {
      // simple click-to-place: nudges the token to a visible spot near top-left of current view
      socket.emit('token:move', { id: t.id, x: t.x + 10, y: t.y + 10 });
    };
    list.appendChild(chip);
  });
}

// ================= CHARACTERS =================
function renderCharacters() {
  const grid = document.getElementById('char-grid');
  grid.innerHTML = '';
  Object.values(state.characters).forEach(c => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
      <h3>${c.name}</h3>
      <div class="meta">${c.race || ''} ${c.charClass || ''} · Level ${c.level || 1}</div>
      <div class="stat-row">
        <span class="stat-pill">HP ${c.hp}/${c.maxHp}</span>
        <span class="stat-pill">AC ${c.ac}</span>
        <span class="stat-pill">${c.speed || ''}</span>
      </div>
    `;
    card.onclick = () => openSheetEditor(c);
    grid.appendChild(card);
  });
}

document.getElementById('new-sheet-btn').onclick = () => openSheetEditor(null);
document.getElementById('close-sheet-btn').onclick = () => document.getElementById('sheet-editor').classList.add('hidden');

let editingOriginalName = null;
function openSheetEditor(c) {
  document.getElementById('sheet-editor').classList.remove('hidden');
  document.getElementById('sheet-editor-title').textContent = c ? 'Edit ' + c.name : 'New character';
  editingOriginalName = c ? c.name : null;
  const f = (id) => document.getElementById(id);
  f('sf-name').value = c?.name || '';
  f('sf-race').value = c?.race || '';
  f('sf-class').value = c?.charClass || '';
  f('sf-level').value = c?.level || 1;
  f('sf-hp').value = c?.hp ?? 10;
  f('sf-maxhp').value = c?.maxHp ?? 10;
  f('sf-ac').value = c?.ac ?? 10;
  f('sf-speed').value = c?.speed || '30 ft';
  f('sf-str').value = c?.abilities?.str ?? 10;
  f('sf-dex').value = c?.abilities?.dex ?? 10;
  f('sf-con').value = c?.abilities?.con ?? 10;
  f('sf-int').value = c?.abilities?.int ?? 10;
  f('sf-wis').value = c?.abilities?.wis ?? 10;
  f('sf-cha').value = c?.abilities?.cha ?? 10;
  f('sf-inventory').value = c?.inventory || '';
  f('sf-notes').value = c?.notes || '';
  document.getElementById('view-characters').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('save-sheet-btn').onclick = () => {
  const f = (id) => document.getElementById(id).value;
  const name = f('sf-name').trim();
  if (!name) return alert('Every character needs a name.');
  const sheet = {
    name,
    race: f('sf-race'),
    charClass: f('sf-class'),
    level: Number(f('sf-level')) || 1,
    hp: Number(f('sf-hp')) || 0,
    maxHp: Number(f('sf-maxhp')) || 0,
    ac: Number(f('sf-ac')) || 10,
    speed: f('sf-speed'),
    abilities: {
      str: Number(f('sf-str')), dex: Number(f('sf-dex')), con: Number(f('sf-con')),
      int: Number(f('sf-int')), wis: Number(f('sf-wis')), cha: Number(f('sf-cha'))
    },
    inventory: f('sf-inventory'),
    notes: f('sf-notes')
  };
  if (editingOriginalName && editingOriginalName !== name) {
    socket.emit('character:remove', { name: editingOriginalName });
  }
  socket.emit('character:save', sheet);
  document.getElementById('sheet-editor').classList.add('hidden');
};

document.getElementById('delete-sheet-btn').onclick = () => {
  if (editingOriginalName) socket.emit('character:remove', { name: editingOriginalName });
  document.getElementById('sheet-editor').classList.add('hidden');
};

// ================= JUKEBOX =================
const audioEl = document.getElementById('audio-el');

document.getElementById('add-track-btn').onclick = () => {
  const title = document.getElementById('track-title').value.trim();
  const url = document.getElementById('track-url').value.trim();
  if (!title || !url) return alert('Add both a track name and an audio URL.');
  const playlist = [...state.jukebox.playlist, { id: 'm' + Date.now(), title, url }];
  socket.emit('jukebox:setPlaylist', playlist);
  document.getElementById('track-title').value = '';
  document.getElementById('track-url').value = '';
};

document.getElementById('jb-playpause').onclick = () => {
  if (state.jukebox.isPlaying) {
    socket.emit('jukebox:pause');
  } else if (state.jukebox.currentIndex === -1 && state.jukebox.playlist.length) {
    socket.emit('jukebox:play', { index: 0 });
  } else {
    socket.emit('jukebox:resume');
  }
};
document.getElementById('jb-next').onclick = () => {
  const next = (state.jukebox.currentIndex + 1) % Math.max(1, state.jukebox.playlist.length);
  socket.emit('jukebox:play', { index: next });
};
document.getElementById('jb-prev').onclick = () => {
  const prev = (state.jukebox.currentIndex - 1 + state.jukebox.playlist.length) % Math.max(1, state.jukebox.playlist.length);
  socket.emit('jukebox:play', { index: prev });
};

function renderJukebox() {
  const j = state.jukebox;
  const list = document.getElementById('playlist');
  list.innerHTML = '';
  j.playlist.forEach((track, i) => {
    const row = document.createElement('div');
    row.className = 'playlist-item' + (i === j.currentIndex ? ' playing' : '');
    row.innerHTML = `<span>${i === j.currentIndex ? '🎶 ' : ''}${track.title}</span><span class="del dm-only">×</span>`;
    row.querySelector('span').onclick = () => socket.emit('jukebox:play', { index: i });
    row.querySelector('.del').onclick = (e) => {
      e.stopPropagation();
      const playlist = j.playlist.filter((_, idx) => idx !== i);
      socket.emit('jukebox:setPlaylist', playlist);
    };
    list.appendChild(row);
  });

  const current = j.playlist[j.currentIndex];
  document.getElementById('now-playing').textContent = current ? current.title : 'Nothing playing';
  document.getElementById('now-playing-sub').textContent = current ? 'from the Humblewood jukebox' : 'add a track below to begin';
  document.getElementById('jukebox-art').classList.toggle('spinning', j.isPlaying);
  document.getElementById('jb-playpause').textContent = j.isPlaying ? '⏸' : '▶';

  if (current) {
    if (audioEl.src !== location.origin + current.url && audioEl.src !== current.url) {
      audioEl.src = current.url;
    }
    const elapsed = j.isPlaying ? (Date.now() - j.startedAt) / 1000 : j.seek;
    if (Math.abs((audioEl.currentTime || 0) - elapsed) > 1.5) {
      audioEl.currentTime = elapsed;
    }
    if (j.isPlaying) audioEl.play().catch(() => {}); else audioEl.pause();
  } else {
    audioEl.pause();
    audioEl.removeAttribute('src');
  }
}

audioEl.onended = () => {
  if (state.jukebox.playlist.length > 1) {
    document.getElementById('jb-next').click();
  } else {
    socket.emit('jukebox:pause');
  }
};

// ================= DICE =================
document.querySelectorAll('.die-btn').forEach(btn => {
  btn.onclick = () => rollDice(1, Number(btn.dataset.sides), 0);
});
document.getElementById('roll-custom-btn').onclick = () => {
  rollDice(
    Number(document.getElementById('dice-count').value) || 1,
    Number(document.getElementById('dice-sides').value) || 20,
    Number(document.getElementById('dice-mod').value) || 0
  );
};

function rollDice(count, sides, modifier) {
  socket.emit('roll:make', { name: myName, count, sides, modifier });
}

socket.on('roll:made', (entry) => {
  if (!state.rollLog) state.rollLog = [];
  state.rollLog.unshift(entry);
  renderRollLog();
});

function renderRollLog() {
  const log = document.getElementById('roll-log');
  if (!log) return;
  log.innerHTML = '';
  (state.rollLog || []).forEach(entry => {
    const row = document.createElement('div');
    const isCrit = entry.rolls.length === 1 && entry.rolls[0] === Math.max(...entry.rolls) && entry.expression.includes('d20') && entry.rolls[0] === 20;
    const isFumble = entry.expression.includes('d20') && entry.rolls.length === 1 && entry.rolls[0] === 1;
    row.className = 'roll-entry' + (isCrit ? ' crit' : '') + (isFumble ? ' fumble' : '');
    row.innerHTML = `
      <div>
        <span class="who">${entry.name}</span>
        <span class="expr">rolled ${entry.expression}</span><br>
        <span class="breakdown">[${entry.rolls.join(', ')}]${entry.modifier ? (entry.modifier > 0 ? ' +' + entry.modifier : ' ' + entry.modifier) : ''}</span>
      </div>
      <div class="total">${entry.total}</div>
    `;
    log.appendChild(row);
  });
}

// ================= Shared helpers =================
async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await res.json();
  return data.url;
}
