const socket = io();

let myRole = 'dm';
let myName = '';
let myUsername = '';
let myPassword = '';
let authMode = 'login';
let myDmPin = '';
let joined = false;
let state = null;
let selectedTool = 'move';
let draggingToken = null;
let dragOffset = { x: 0, y: 0 };
let pendingTrayToken = null; // token about to be dropped from tray
let mapScale = 1;
let mapPan = { x: 0, y: 0 };
let panStart = null;
let editingOriginalName = null;
let editingInventory = [];
let editingPortraitUrl = null;
let pendingPortraitFile = null;
let editingCanEdit = true;
let initiativeManuallyEdited = false;
let toastTimer = null;
let activeCombatName = null;
const pendingConcentrationChecks = new Map();

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const SKILL_ABILITIES = {
  acrobatics: 'dex', animal: 'wis', arcana: 'int', athletics: 'str', deception: 'cha', history: 'int',
  insight: 'wis', intimidation: 'cha', investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', sleight: 'dex', stealth: 'dex', survival: 'wis'
};
const SKILL_LABELS = {
  acrobatics: 'Acrobatics', animal: 'Animal Handling', arcana: 'Arcana', athletics: 'Athletics', deception: 'Deception',
  history: 'History', insight: 'Insight', intimidation: 'Intimidation', investigation: 'Investigation', medicine: 'Medicine',
  nature: 'Nature', perception: 'Perception', performance: 'Performance', persuasion: 'Persuasion', religion: 'Religion',
  sleight: 'Sleight of Hand', stealth: 'Stealth', survival: 'Survival'
};
const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated',
  'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
  'Stunned', 'Unconscious'
];

// ---------------- Join flow ----------------
document.getElementById('role-dm').onclick = () => setRole('dm');
document.getElementById('role-player').onclick = () => setRole('player');
document.getElementById('auth-login').onclick = () => setAuthMode('login');
document.getElementById('auth-register').onclick = () => setAuthMode('register');
function setRole(role) {
  myRole = role;
  document.getElementById('role-dm').classList.toggle('active', role === 'dm');
  document.getElementById('role-player').classList.toggle('active', role === 'player');
  document.getElementById('dm-pin-field').classList.toggle('hidden', role !== 'dm');
  document.getElementById('player-auth-fields').classList.toggle('hidden', role !== 'player');
  document.getElementById('name-field').classList.toggle('hidden', role === 'player' && authMode === 'login');
  document.getElementById('join-error').textContent = '';
}

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById('auth-login').classList.toggle('active', mode === 'login');
  document.getElementById('auth-register').classList.toggle('active', mode === 'register');
  document.getElementById('name-field').classList.toggle('hidden', myRole === 'player' && mode === 'login');
  document.getElementById('confirm-password-field').classList.toggle('hidden', mode !== 'register');
  document.getElementById('password-input').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  document.getElementById('auth-help').textContent = mode === 'register'
    ? 'Create one account, then use it anywhere you play.'
    : 'Sign in from any device. If you forget it, ask the DM to look up your username or reset the password.';
  document.getElementById('join-error').textContent = '';
}

document.getElementById('join-btn').onclick = () => {
  const nameInput = document.getElementById('name-input');
  myUsername = document.getElementById('username-input').value.trim();
  myPassword = document.getElementById('password-input').value;
  myName = nameInput.value.trim() || (myRole === 'dm' ? 'The DM' : myUsername);
  if (myRole === 'player' && authMode === 'register' && myPassword !== document.getElementById('confirm-password-input').value) {
    document.getElementById('join-error').textContent = 'Those passwords do not match.';
    return;
  }
  const joinButton = document.getElementById('join-btn');
  joinButton.disabled = true;
  joinButton.textContent = 'Entering…';
  document.getElementById('join-error').textContent = '';
  myDmPin = document.getElementById('dm-pin-input').value;
  sendIdentity();
};

function sendIdentity() {
  socket.emit('identify', {
    role: myRole,
    name: myName,
    username: myUsername,
    password: myPassword,
    authMode,
    dmPin: myDmPin
  });
}

document.getElementById('dm-pin-input').addEventListener('keydown', event => {
  if (event.key === 'Enter') document.getElementById('join-btn').click();
});
document.getElementById('password-input').addEventListener('keydown', event => {
  if (event.key === 'Enter') document.getElementById('join-btn').click();
});
document.getElementById('confirm-password-input').addEventListener('keydown', event => {
  if (event.key === 'Enter') document.getElementById('join-btn').click();
});

socket.on('identify:result', result => {
  const joinButton = document.getElementById('join-btn');
  joinButton.disabled = false;
  joinButton.textContent = 'Enter the Wood';
  if (!result.ok) {
    document.getElementById('join-error').textContent = result.message || 'Could not join the table.';
    return;
  }
  myRole = result.role;
  myName = result.name;
  myUsername = result.username || '';
  if (myRole === 'player') authMode = 'login';
  joined = true;
  document.getElementById('password-input').value = '';
  document.getElementById('confirm-password-input').value = '';
  document.getElementById('dm-pin-input').value = '';
  document.getElementById('join-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.body.setAttribute('data-role', myRole);
  document.getElementById('my-role-pill').textContent = myRole === 'dm' ? 'Dungeon Master' : `Player · ${myName}`;
  if (myRole === 'dm') socket.emit('accounts:list');
});

socket.on('connect', () => {
  if (joined) sendIdentity();
});

// ---------------- Tabs ----------------
document.querySelectorAll('.tab-btn').forEach(btn => { btn.onclick = () => switchView(btn.dataset.view); });
document.getElementById('topbar-roll-btn').onclick = () => switchView('dice');

function switchView(viewName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === 'view-' + viewName));
  if (viewName === 'dice') refreshCharacterRoller();
}

// ---------------- Socket state sync ----------------
socket.on('state:full', (s) => {
  state = s;
  renderMap();
  renderTokenTray();
  renderCharacters();
  renderJukebox();
  renderRollLog();
  renderInitiative();
  refreshCharacterRoller();
});

socket.on('scene:update', (scene) => { state.scene = scene; renderMap(); });
socket.on('scene:doodle:add', (path) => { state.scene.doodlePaths.push(path); drawDoodlePath(path); });
socket.on('scene:doodle:clear', () => { state.scene.doodlePaths = []; clearDoodleCanvas(); });
socket.on('scene:doodle:redrawAll', (paths) => { state.scene.doodlePaths = paths || []; redrawAllDoodles(); });

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
socket.on('character:update', (sheet) => {
  state.characters[sheet.name] = sheet;
  renderCharacters();
  renderInitiative();
  refreshCharacterRoller();
  if (activeCombatName === sheet.name) renderCombatManager();
});
socket.on('character:remove', ({ name }) => {
  delete state.characters[name];
  if (activeCombatName === name) closeCombatManager();
  renderCharacters();
  renderInitiative();
  refreshCharacterRoller();
});
socket.on('character:denied', ({ name }) => showToast(`You cannot edit ${name || 'that character'}.`));
socket.on('action:denied', ({ message }) => showToast(message || 'That action is not allowed.'));
socket.on('token:exists', token => {
  showToast(`${token.label} is already on the map.`);
  switchView('map');
});
socket.on('concentration:required', ({ name, damage, dc }) => {
  pendingConcentrationChecks.set(name, { damage, dc });
  showToast(`${name} must make a DC ${dc} Constitution save for concentration.`);
  if (activeCombatName === name) renderCombatManager();
});
socket.on('accounts:update', renderPlayerAccounts);
socket.on('account:passwordReset', ({ username }) => {
  document.getElementById('reset-account-password').value = '';
  showToast(`Password reset for ${username}.`);
});

function renderPlayerAccounts(accounts) {
  const list = document.getElementById('account-list');
  list.innerHTML = '';
  if (!accounts.length) {
    list.innerHTML = '<p class="empty-roll-options">No player accounts have been created yet.</p>';
    return;
  }
  accounts.forEach(account => {
    const row = document.createElement('div');
    row.className = 'account-list-item';
    row.innerHTML = `<strong>${escapeHtml(account.displayName)}</strong><span>@${escapeHtml(account.username)}</span>`;
    row.onclick = () => { document.getElementById('reset-account-username').value = account.username; };
    list.appendChild(row);
  });
}

document.getElementById('refresh-accounts-btn').onclick = () => socket.emit('accounts:list');
document.getElementById('reset-account-password-btn').onclick = () => {
  const username = document.getElementById('reset-account-username').value.trim();
  const password = document.getElementById('reset-account-password').value;
  if (!username) return showToast('Choose a player account first.');
  if (password.length < 8) return showToast('The new password needs at least 8 characters.');
  socket.emit('account:resetPassword', { username, password });
};
socket.on('initiative:update', (initiative) => {
  state.initiative = initiative;
  renderInitiative();
  renderMapTokens();
});

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
  const grid = document.getElementById('grid-overlay');
  const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
  grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  grid.classList.toggle('visible', !!state.scene.gridVisible);
  document.getElementById('grid-toggle').checked = !!state.scene.gridVisible;
  document.getElementById('grid-size').value = gridSize;
  applyMapTransform();
  if (state.scene.mapUrl) {
    const sizeMapStage = () => {
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
    img.onload = sizeMapStage;
    img.src = state.scene.mapUrl;
    img.style.display = 'block';
    empty.style.display = 'none';
    if (img.complete && img.naturalWidth) sizeMapStage();
  } else {
    img.style.display = 'none';
    empty.style.display = 'flex';
  }
}

function renderMapTokens() {
  document.querySelectorAll('.token-on-map').forEach(el => el.remove());
  const stage = document.getElementById('map-stage');
  const current = currentInitiativeEntry();
  state.tokens.forEach(t => {
    if (myRole === 'player' && t.visibleToPlayers === false) return;
    const el = document.createElement('div');
    el.className = 'token-on-map kind-' + t.kind;
    if (!t.canControl) el.classList.add('locked-token');
    if (current && current.tokenId === t.id) el.classList.add('current-turn');
    if (t.visibleToPlayers === false) el.classList.add('hidden-token');
    el.dataset.id = t.id;
    el.tabIndex = 0;
    el.setAttribute('aria-label', `${t.label}${t.canControl ? ', your token' : ', locked token'}`);
    el.style.left = t.x + 'px';
    el.style.top = t.y + 'px';
    const linkedCharacter = t.characterName ? state.characters[t.characterName] : null;
    const canManageCombat = !!linkedCharacter?.canManage;
    const controls = [
      canManageCombat ? '<button type="button" data-action="combat" title="Open combat controls">⚔</button>' : '',
      myRole === 'dm' && !linkedCharacter && t.maxHp ? '<button type="button" data-action="damage" title="Lose 1 HP">−</button><button type="button" data-action="heal" title="Heal 1 HP">+</button>' : '',
      myRole === 'dm' ? `<button type="button" data-action="visibility" title="Show or hide from players">${t.visibleToPlayers === false ? '🙈' : '👁'}</button>` : ''
    ].join('');
    el.innerHTML = `
      <div class="label">${escapeHtml(t.label)}</div>
      ${t.imageUrl ? `<img src="${escapeAttr(t.imageUrl)}" alt="">` : emojiFor(t.kind)}
      ${t.maxHp ? `<div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, (t.hp / t.maxHp) * 100)}%"></div></div>` : ''}
      ${controls ? `<div class="token-controls">${controls}</div>` : ''}
    `;
    el.onmousedown = (e) => startDragToken(e, t.id);
    el.onkeydown = event => {
      if ((event.key === 'Enter' || event.key === ' ') && canManageCombat) {
        event.preventDefault();
        openCombatManager(t.characterName);
      }
    };
    el.querySelectorAll('.token-controls button').forEach(button => {
      button.onmousedown = (e) => e.stopPropagation();
      button.onclick = (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        if (action === 'combat') openCombatManager(t.characterName);
        if (action === 'damage') socket.emit('token:update', { id: t.id, hp: Math.max(0, Number(t.hp) - 1) });
        if (action === 'heal') socket.emit('token:update', { id: t.id, hp: Math.min(Number(t.maxHp), Number(t.hp) + 1) });
        if (action === 'visibility') socket.emit('token:update', { id: t.id, visibleToPlayers: t.visibleToPlayers === false });
      };
    });
    stage.appendChild(el);
  });
}

function emojiFor(kind) {
  return kind === 'pc' ? '🧝' : kind === 'npc' ? '🦊' : '🌸';
}

function startDragToken(e, id) {
  if (selectedTool !== 'move') return;
  const token = state.tokens.find(entry => entry.id === id);
  if (!token?.canControl) return showToast('You can only move your own character token.');
  e.preventDefault();
  draggingToken = id;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  dragOffset.x = (e.clientX - rect.left) / mapScale;
  dragOffset.y = (e.clientY - rect.top) / mapScale;
}

document.addEventListener('mousemove', (e) => {
  if (!draggingToken) return;
  const stage = document.getElementById('map-stage');
  const rect = stage.getBoundingClientRect();
  const x = (e.clientX - rect.left) / mapScale - dragOffset.x;
  const y = (e.clientY - rect.top) / mapScale - dragOffset.y;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
});

document.addEventListener('mouseup', (e) => {
  if (!draggingToken) return;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) {
    let x = parseFloat(el.style.left);
    let y = parseFloat(el.style.top);
    if (document.getElementById('snap-toggle').checked) {
      const size = Math.max(10, Number(state.scene.gridSize) || 50);
      x = Math.round(x / size) * size;
      y = Math.round(y / size) * size;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    }
    socket.emit('token:move', { id: draggingToken, x, y });
  }
  draggingToken = null;
});

// ---- Tool toggle ----
document.getElementById('tool-move').onclick = () => setTool('move');
document.getElementById('tool-pan').onclick = () => setTool('pan');
document.getElementById('tool-doodle').onclick = () => setTool('doodle');
function setTool(tool) {
  selectedTool = tool;
  document.getElementById('tool-move').classList.toggle('active', tool === 'move');
  document.getElementById('tool-pan').classList.toggle('active', tool === 'pan');
  document.getElementById('tool-doodle').classList.toggle('active', tool === 'doodle');
  document.getElementById('map-stage').classList.toggle('doodling', tool === 'doodle');
  document.getElementById('map-stage').classList.toggle('panning', tool === 'pan');
}

document.getElementById('clear-doodles-btn').onclick = () => socket.emit('scene:doodle:clear');
document.getElementById('undo-doodle-btn').onclick = () => socket.emit('scene:doodle:undo');

const mapStageWrap = document.getElementById('map-stage-wrap');
mapStageWrap.addEventListener('mousedown', (e) => {
  if (selectedTool !== 'pan' || e.button !== 0) return;
  e.preventDefault();
  panStart = { clientX: e.clientX, clientY: e.clientY, x: mapPan.x, y: mapPan.y };
});
document.addEventListener('mousemove', (e) => {
  if (!panStart) return;
  mapPan.x = panStart.x + e.clientX - panStart.clientX;
  mapPan.y = panStart.y + e.clientY - panStart.clientY;
  applyMapTransform();
});
document.addEventListener('mouseup', () => { panStart = null; });

document.getElementById('grid-toggle').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked
  });
};
document.getElementById('grid-size').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked
  });
};

document.getElementById('zoom-in').onclick = () => setMapZoom(mapScale + 0.15);
document.getElementById('zoom-out').onclick = () => setMapZoom(mapScale - 0.15);
document.getElementById('zoom-reset').onclick = () => {
  mapScale = 1;
  mapPan = { x: 0, y: 0 };
  applyMapTransform();
};

document.getElementById('toggle-initiative-btn').onclick = () => {
  const mapView = document.getElementById('view-map');
  const collapsed = mapView.classList.toggle('initiative-collapsed');
  document.getElementById('toggle-initiative-btn').setAttribute('aria-expanded', String(!collapsed));
};

function setMapZoom(value) {
  mapScale = Math.max(0.35, Math.min(3, Math.round(value * 100) / 100));
  applyMapTransform();
}

function applyMapTransform() {
  const stage = document.getElementById('map-stage');
  if (!stage) return;
  stage.style.transform = `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapScale})`;
  document.getElementById('zoom-level').textContent = Math.round(mapScale * 100) + '%';
}

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
  return { x: (e.clientX - rect.left) / mapScale, y: (e.clientY - rect.top) / mapScale };
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
    if (myRole === 'player' && t.visibleToPlayers === false) return;
    const chip = document.createElement('div');
    chip.className = 'token-chip kind-' + t.kind;
    if (!t.canControl) chip.classList.add('locked-token');
    chip.title = t.canControl ? `${t.label} (click to nudge on the map)` : `${t.label} (controlled by another player)`;
    if (t.visibleToPlayers === false) chip.classList.add('hidden-token');
    chip.innerHTML = (t.imageUrl ? `<img src="${escapeAttr(t.imageUrl)}" alt="${escapeAttr(t.label)}">` : emojiFor(t.kind)) +
      (t.canControl ? '<span class="del" title="Remove from map">×</span>' : '');
    const remove = chip.querySelector('.del');
    if (remove) remove.onclick = (e) => {
        e.stopPropagation();
        socket.emit('token:remove', { id: t.id });
      };
    chip.onclick = () => {
      if (!t.canControl) return showToast('You can only move your own character token.');
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
    const canEdit = canEditCharacter(c);
    const mapToken = state.tokens.find(token => token.characterName === c.name);
    const combat = c.combat || {};
    const conditionSummary = [
      ...(combat.conditions || []),
      combat.concentration ? 'Concentrating' : '',
      combat.exhaustion ? `Exhaustion ${combat.exhaustion}` : ''
    ].filter(Boolean);
    const species = c.species || c.race || '';
    const charClass = c.charClass || c.className || '';
    card.innerHTML = `
      <div class="card-top">
        <div class="card-portrait">${c.portraitUrl ? `<img src="${escapeAttr(c.portraitUrl)}" alt="">` : '🍃'}</div>
        <div><h3>${escapeHtml(c.name)}</h3><div class="meta">${escapeHtml([species, charClass].filter(Boolean).join(' · '))} · Level ${Number(c.level) || 1}</div></div>
        ${canEdit ? '' : '<span class="locked-badge">View only</span>'}
      </div>
      <div class="stat-row">
        <span class="stat-pill">HP ${Number(c.hp) || 0}/${Number(c.maxHp) || 0}</span>
        ${Number(c.tempHp) ? `<span class="stat-pill temp-hp-pill">+${Number(c.tempHp)} temp</span>` : ''}
        <span class="stat-pill">AC ${Number(c.ac) || 0}</span>
        <span class="stat-pill">Init ${signed(characterInitiativeModifier(c))}</span>
      </div>
      ${conditionSummary.length ? `<div class="character-condition-summary">${conditionSummary.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
      <div class="char-card-actions">
        <button type="button" class="btn-ghost view-character-btn">${canEdit ? 'Open sheet' : 'View sheet'}</button>
        ${canEdit ? '<button type="button" class="btn-rose roll-character-btn">🎲 Roll</button>' : ''}
        ${canEdit ? '<button type="button" class="btn-ghost combat-character-btn">⚔ Combat</button>' : ''}
        ${canEdit ? `<button type="button" class="btn-ghost map-character-btn">${mapToken ? 'Remove from map' : 'Put on map'}</button>` : ''}
        ${myRole === 'player' && canEdit && !c.claimed ? '<button type="button" class="btn-ghost claim-character-btn">Claim character</button>' : ''}
        ${myRole === 'dm' && c.claimed ? '<button type="button" class="btn-ghost release-character-btn">Release owner</button>' : ''}
      </div>
    `;
    card.querySelector('.view-character-btn').onclick = () => openSheetEditor(c);
    card.querySelector('.roll-character-btn')?.addEventListener('click', () => openCharacterRoller(c.name));
    card.querySelector('.combat-character-btn')?.addEventListener('click', () => openCombatManager(c.name));
    card.querySelector('.map-character-btn')?.addEventListener('click', () => {
      if (mapToken) socket.emit('token:remove', { id: mapToken.id });
      else socket.emit('token:add', { characterName: c.name });
    });
    card.querySelector('.claim-character-btn')?.addEventListener('click', () => socket.emit('character:claim', { name: c.name }));
    card.querySelector('.release-character-btn')?.addEventListener('click', () => {
      if (confirm(`Release ${c.name} so their named player can claim them again?`)) socket.emit('character:ownership:release', { name: c.name });
    });
    grid.appendChild(card);
  });
}

document.getElementById('new-sheet-btn').onclick = () => openSheetEditor(null);
document.getElementById('close-sheet-btn').onclick = () => document.getElementById('sheet-editor').classList.add('hidden');

function openSheetEditor(c) {
  const form = document.getElementById('sheet-form');
  form.reset();
  document.getElementById('sheet-editor').classList.remove('hidden');
  document.getElementById('sheet-editor-title').textContent = c ? 'Edit ' + c.name : 'New character';
  editingOriginalName = c ? c.name : null;
  editingCanEdit = canEditCharacter(c);
  pendingPortraitFile = null;
  editingPortraitUrl = c?.portraitUrl || null;
  const fields = c?.fields || legacyCharacterFields(c);
  initiativeManuallyEdited = !!c && fields.initiative !== '' && fields.initiative !== undefined;
  form.querySelectorAll('[id^="sf-"]').forEach(input => {
    if (input.type === 'file') return;
    const key = input.id.slice(3);
    if (!Object.prototype.hasOwnProperty.call(fields, key)) return;
    if (input.type === 'checkbox') input.checked = !!fields[key];
    else input.value = fields[key] ?? '';
  });
  editingInventory = normalizeInventory(c?.inventory);
  renderInventoryEditor();
  renderPortraitPreview(editingPortraitUrl);
  refreshCharacterCalculations(!c);
  setSheetEditable(editingCanEdit, !!c);
  document.getElementById('view-characters').scrollIntoView({ behavior: 'smooth' });
}

function legacyCharacterFields(c) {
  if (!c) return {};
  const fields = {
    name: c.name || '', species: c.species || c.race || '', class: c.charClass || '', level: c.level ?? 1,
    hp: c.hp ?? 10, maxhp: c.maxHp ?? 10, ac: c.ac ?? 10, speed: c.speed || '30 ft', notes: c.notes || ''
  };
  ABILITIES.forEach(ability => { fields[ability] = c.abilities?.[ability] ?? 10; });
  return fields;
}

function canEditCharacter(c) {
  return !c || !!c.canManage;
}

function setSheetEditable(canEdit, hasCharacter) {
  document.querySelectorAll('#sheet-form input, #sheet-form select, #sheet-form textarea, #sheet-form button').forEach(control => {
    control.disabled = !canEdit;
  });
  document.getElementById('save-sheet-btn').classList.toggle('hidden', !canEdit);
  document.getElementById('delete-sheet-btn').classList.toggle('hidden', !canEdit || !hasCharacter);
  const ownerNote = document.getElementById('sheet-owner-note');
  ownerNote.textContent = canEdit ? '' : 'Only this character’s owner or the Dungeon Master can edit it.';
}

function normalizeInventory(inventory) {
  if (Array.isArray(inventory)) {
    return inventory.map((item, index) => ({ id: item.id || `item-${Date.now()}-${index}`, name: String(item.name || ''), qty: Math.max(1, Number(item.qty) || 1) }));
  }
  if (typeof inventory === 'string' && inventory.trim()) {
    return inventory.split(/\n|,/).map((name, index) => ({ id: `legacy-${index}`, name: name.trim(), qty: 1 })).filter(item => item.name);
  }
  return [];
}

function renderInventoryEditor() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = '';
  editingInventory.forEach(item => {
    const row = document.createElement('div');
    row.className = 'inventory-item';
    const description = document.createElement('span');
    description.textContent = item.name;
    const qty = document.createElement('span');
    qty.className = 'qty';
    qty.textContent = `×${item.qty}`;
    description.appendChild(qty);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'del';
    remove.textContent = '×';
    remove.title = 'Remove item';
    remove.disabled = !editingCanEdit;
    remove.onclick = () => {
      editingInventory = editingInventory.filter(entry => entry.id !== item.id);
      renderInventoryEditor();
    };
    row.append(description, remove);
    list.appendChild(row);
  });
}

document.getElementById('inv-add-btn').onclick = () => {
  const nameInput = document.getElementById('inv-item-name');
  const qtyInput = document.getElementById('inv-item-qty');
  const name = nameInput.value.trim();
  if (!name) return;
  editingInventory.push({ id: `item-${Date.now()}`, name, qty: Math.max(1, Number(qtyInput.value) || 1) });
  nameInput.value = '';
  qtyInput.value = 1;
  renderInventoryEditor();
};

document.getElementById('sf-portrait').onchange = (event) => {
  pendingPortraitFile = event.target.files[0] || null;
  if (!pendingPortraitFile) return renderPortraitPreview(editingPortraitUrl);
  const reader = new FileReader();
  reader.onload = () => renderPortraitPreview(reader.result);
  reader.readAsDataURL(pendingPortraitFile);
};

function renderPortraitPreview(url) {
  const preview = document.getElementById('portrait-preview');
  preview.innerHTML = '';
  if (!url) {
    preview.textContent = '🍃';
    return;
  }
  const image = document.createElement('img');
  image.src = url;
  image.alt = 'Character portrait';
  preview.appendChild(image);
}

function collectCharacterFields() {
  const fields = {};
  document.querySelectorAll('#sheet-form [id^="sf-"]').forEach(input => {
    if (input.type === 'file') return;
    const key = input.id.slice(3);
    fields[key] = input.type === 'checkbox' ? input.checked : input.value;
  });
  return fields;
}

document.getElementById('save-sheet-btn').onclick = async () => {
  if (!editingCanEdit) return;
  refreshCharacterCalculations(false);
  const fields = collectCharacterFields();
  const name = String(fields.name || '').trim();
  if (!name) return alert('Every character needs a name.');
  const saveButton = document.getElementById('save-sheet-btn');
  saveButton.disabled = true;
  saveButton.textContent = 'Saving…';
  try {
    if (pendingPortraitFile) editingPortraitUrl = await uploadFile(pendingPortraitFile);
  } catch (error) {
    showToast('The portrait could not be uploaded. Please try again.');
    saveButton.disabled = false;
    saveButton.textContent = 'Save character';
    return;
  }

  const num = (key, fallback = 0) => Number(fields[key]) || fallback;
  const sheet = {
    name,
    _originalName: editingOriginalName,
    portraitUrl: editingPortraitUrl,
    species: fields.species || '',
    race: fields.species || '',
    subrace: fields.subrace || '',
    charClass: fields.class || '',
    subclass: fields.subclass || '',
    level: Math.max(1, Math.min(20, num('level', 1))),
    hp: num('hp'), maxHp: num('maxhp'), tempHp: num('temphp'), ac: num('ac', 10),
    initiativeModifier: num('initiative'), speed: fields.speed || '',
    abilities: Object.fromEntries(ABILITIES.map(ability => [ability, num(ability, 10)])),
    saves: Object.fromEntries(ABILITIES.map(ability => [ability, {
      proficient: !!fields[`save-${ability}-prof`], modifier: num(`save-${ability}`)
    }])),
    skills: Object.fromEntries(Object.keys(SKILL_ABILITIES).map(skill => [skill, {
      proficient: !!fields[`skill-${skill}-prof`], modifier: num(`skill-${skill}`)
    }])),
    attacks: [1, 2, 3].map(index => ({
      name: fields[`attack-${index}-name`] || '', bonus: fields[`attack-${index}-bonus`] || '', damage: fields[`attack-${index}-damage`] || ''
    })).filter(attack => attack.name || attack.bonus || attack.damage),
    spellcasting: {
      className: fields['spell-class'] || '', ability: fields['spell-ability'] || '',
      saveDc: num('spell-dc'), attackBonus: num('spell-attack')
    },
    inventory: editingInventory.map(item => ({ ...item })),
    notes: fields.notes || '',
    fields
  };
  socket.emit('character:save', sheet);
  document.getElementById('sheet-editor').classList.add('hidden');
  saveButton.disabled = false;
  saveButton.textContent = 'Save character';
  showToast(`${name} saved.`);
};

document.getElementById('delete-sheet-btn').onclick = () => {
  if (editingOriginalName && confirm(`Delete ${editingOriginalName}?`)) {
    socket.emit('character:remove', { name: editingOriginalName });
  } else if (editingOriginalName) {
    return;
  }
  document.getElementById('sheet-editor').classList.add('hidden');
};

function abilityModifier(score) {
  return Math.floor(((Number(score) || 10) - 10) / 2);
}

function proficiencyBonus(level) {
  return 2 + Math.floor((Math.max(1, Math.min(20, Number(level) || 1)) - 1) / 4);
}

function refreshCharacterCalculations(force) {
  const level = document.getElementById('sf-level');
  const bonus = proficiencyBonus(level.value);
  document.getElementById('sf-prof-bonus').value = bonus;
  ABILITIES.forEach(ability => {
    const modifier = abilityModifier(document.getElementById(`sf-${ability}`).value);
    document.getElementById(`mod-${ability}`).textContent = signed(modifier);
    const saveInput = document.getElementById(`sf-save-${ability}`);
    const saveValue = modifier + (document.getElementById(`sf-save-${ability}-prof`).checked ? bonus : 0);
    if (force || saveInput.value === '') saveInput.value = saveValue;
  });
  Object.entries(SKILL_ABILITIES).forEach(([skill, ability]) => {
    const input = document.getElementById(`sf-skill-${skill}`);
    const value = abilityModifier(document.getElementById(`sf-${ability}`).value) +
      (document.getElementById(`sf-skill-${skill}-prof`).checked ? bonus : 0);
    if (force || input.value === '') input.value = value;
  });
  const initiativeInput = document.getElementById('sf-initiative');
  if (!initiativeManuallyEdited && (force || initiativeInput.value === '')) {
    initiativeInput.value = abilityModifier(document.getElementById('sf-dex').value);
  }
  const passive = document.getElementById('sf-passive-perception');
  if (force || passive.value === '') passive.value = 10 + Number(document.getElementById('sf-skill-perception').value || 0);
  const spellAbility = document.getElementById('sf-spell-ability').value.toLowerCase();
  if (ABILITIES.includes(spellAbility)) {
    const spellMod = abilityModifier(document.getElementById(`sf-${spellAbility}`).value);
    const spellDc = document.getElementById('sf-spell-dc');
    const spellAttack = document.getElementById('sf-spell-attack');
    if (spellDc.value === '') spellDc.value = 8 + bonus + spellMod;
    if (spellAttack.value === '') spellAttack.value = bonus + spellMod;
  }
}

ABILITIES.forEach(ability => document.getElementById(`sf-${ability}`).addEventListener('input', () => refreshCharacterCalculations(true)));
document.getElementById('sf-level').addEventListener('input', () => refreshCharacterCalculations(true));
document.getElementById('sf-initiative').addEventListener('input', () => { initiativeManuallyEdited = true; });
ABILITIES.forEach(ability => document.getElementById(`sf-save-${ability}-prof`).addEventListener('change', () => refreshCharacterCalculations(true)));
Object.keys(SKILL_ABILITIES).forEach(skill => document.getElementById(`sf-skill-${skill}-prof`).addEventListener('change', () => refreshCharacterCalculations(true)));
document.getElementById('sf-spell-ability').addEventListener('change', () => refreshCharacterCalculations(false));

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
    row.innerHTML = `<span>${i === j.currentIndex ? '🎶 ' : ''}${escapeHtml(track.title)}</span><span class="del dm-only">×</span>`;
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
  btn.onclick = () => rollDice(1, Number(btn.dataset.sides), 0, { label: `Quick d${btn.dataset.sides}` });
});
document.getElementById('roll-custom-btn').onclick = () => {
  rollDice(
    Number(document.getElementById('dice-count').value) || 1,
    Number(document.getElementById('dice-sides').value) || 20,
    Number(document.getElementById('dice-mod').value) || 0,
    { label: 'Custom roll' }
  );
};

function rollDice(count, sides, modifier, options = {}) {
  socket.emit('roll:make', {
    name: options.name || myName,
    count,
    sides,
    modifier,
    mode: options.mode || 'normal',
    label: options.label || '',
    characterName: options.characterName || null,
    initiativeName: options.initiativeName || null,
    tokenId: options.tokenId || null,
    targetDc: options.targetDc || null,
    concentrationFor: options.concentrationFor || null
  });
}

socket.on('roll:made', (entry) => {
  if (!state.rollLog) state.rollLog = [];
  state.rollLog.unshift(entry);
  if (entry.characterName && entry.targetDc) pendingConcentrationChecks.delete(entry.characterName);
  renderRollLog();
  const outcome = entry.targetDc ? (entry.success ? ' — success' : ' — failed') : '';
  showToast(`${entry.label || entry.expression}: ${entry.total}${outcome}`);
});

function renderRollLog() {
  const log = document.getElementById('roll-log');
  if (!log) return;
  log.innerHTML = '';
  (state.rollLog || []).forEach(entry => {
    const row = document.createElement('div');
    const kept = Number.isFinite(Number(entry.kept)) ? Number(entry.kept) : (entry.rolls.length === 1 ? entry.rolls[0] : null);
    const isCrit = entry.expression.includes('d20') && kept === 20;
    const isFumble = entry.expression.includes('d20') && kept === 1;
    row.className = 'roll-entry' + (isCrit ? ' crit' : '') + (isFumble ? ' fumble' : '');
    row.innerHTML = `
      <div>
        <span class="who">${escapeHtml(entry.name)}</span>
        <span class="expr">${entry.label ? escapeHtml(entry.label) + ' · ' : ''}${escapeHtml(entry.expression)}</span><br>
        <span class="breakdown">[${entry.rolls.join(', ')}]${entry.mode && entry.mode !== 'normal' ? ` → kept ${kept}` : ''}${entry.modifier ? (entry.modifier > 0 ? ' +' + entry.modifier : ' ' + entry.modifier) : ''}</span>
        ${entry.targetDc ? `<span class="roll-outcome ${entry.success ? 'success' : 'failure'}">DC ${entry.targetDc} · ${entry.success ? 'Success' : 'Failure'}</span>` : ''}
      </div>
      <div class="total">${entry.total}</div>
    `;
    log.appendChild(row);
  });
}

document.getElementById('dice-character').onchange = renderCharacterRollOptions;

function rollableCharacters() {
  const all = Object.values(state?.characters || {}).sort((a, b) => a.name.localeCompare(b.name));
  if (myRole === 'dm') return all;
  return all.filter(character => character.canManage);
}

function openCharacterRoller(name) {
  switchView('dice');
  refreshCharacterRoller(name);
  document.getElementById('character-roller-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function refreshCharacterRoller(preferredName) {
  if (!state) return;
  const select = document.getElementById('dice-character');
  const characters = rollableCharacters();
  const previous = preferredName || select.value;
  select.innerHTML = '';
  characters.forEach(character => {
    const option = document.createElement('option');
    option.value = character.name;
    option.textContent = `${character.name} · Level ${character.level || 1} ${character.charClass || ''}`.trim();
    select.appendChild(option);
  });
  if (characters.some(character => character.name === previous)) select.value = previous;
  renderCharacterRollOptions();
}

function renderCharacterRollOptions() {
  const container = document.getElementById('character-roll-options');
  container.innerHTML = '';
  const character = state?.characters?.[document.getElementById('dice-character').value];
  if (!character) {
    container.innerHTML = '<p class="empty-roll-options">Create or claim a character sheet to use automatic modifiers.</p>';
    return;
  }

  const combatButtons = createRollGroup('Combat');
  appendRollButton(combatButtons, 'Initiative', characterInitiativeModifier(character), () => rollCharacterInitiative(character));
  const spellAttack = character.spellcasting?.attackBonus ?? character.fields?.['spell-attack'];
  if (spellAttack !== '' && spellAttack !== undefined && spellAttack !== null) {
    appendRollButton(combatButtons, 'Spell attack', Number(spellAttack) || 0, () => rollCharacterD20(character, 'Spell attack', Number(spellAttack) || 0));
  }
  (character.attacks || []).forEach(attack => {
    const bonusMatch = String(attack.bonus || '').match(/[+-]?\d+/);
    if (attack.name && bonusMatch) {
      appendRollButton(combatButtons, `${attack.name} to hit`, Number(bonusMatch[0]), () => rollCharacterD20(character, `${attack.name} attack`, Number(bonusMatch[0])));
    }
    const damage = parseDiceExpression(attack.damage);
    if (attack.name && damage) {
      appendRollButton(combatButtons, `${attack.name} damage`, damage.modifier, () => {
        rollDice(damage.count, damage.sides, damage.modifier, {
          name: characterRollName(character),
          characterName: character.name,
          label: `${attack.name} damage`
        });
      }, true, damage.expression);
    }
  });

  const abilityButtons = createRollGroup('Ability checks');
  ABILITIES.forEach(ability => {
    const modifier = abilityModifier(character.abilities?.[ability]);
    appendRollButton(abilityButtons, ABILITY_LABELS[ability], modifier, () => rollCharacterD20(character, `${ABILITY_LABELS[ability]} check`, modifier));
  });

  const saveButtons = createRollGroup('Saving throws');
  ABILITIES.forEach(ability => {
    const modifier = characterSaveModifier(character, ability);
    appendRollButton(saveButtons, ABILITY_LABELS[ability], modifier, () => rollCharacterD20(character, `${ABILITY_LABELS[ability]} save`, modifier));
  });

  const skillButtons = createRollGroup('Skills');
  Object.keys(SKILL_ABILITIES).forEach(skill => {
    const modifier = characterSkillModifier(character, skill);
    appendRollButton(skillButtons, SKILL_LABELS[skill], modifier, () => rollCharacterD20(character, `${SKILL_LABELS[skill]} check`, modifier));
  });

  function createRollGroup(title) {
    const group = document.createElement('section');
    group.className = 'roll-group';
    const heading = document.createElement('h4');
    heading.textContent = title;
    const buttons = document.createElement('div');
    buttons.className = 'modifier-buttons';
    group.append(heading, buttons);
    container.appendChild(group);
    return buttons;
  }
}

function appendRollButton(container, label, modifier, onclick, damage = false, valueLabel = null) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'modifier-roll-btn' + (damage ? ' damage' : '');
  button.innerHTML = `${escapeHtml(label)} <strong>${escapeHtml(valueLabel || signed(Number(modifier) || 0))}</strong>`;
  button.onclick = onclick;
  container.appendChild(button);
}

function characterRollName(character) {
  return myName === character.name ? character.name : `${myName} as ${character.name}`;
}

function rollCharacterD20(character, label, modifier, extra = {}) {
  rollDice(1, 20, modifier, {
    name: characterRollName(character),
    characterName: character.name,
    label,
    mode: document.getElementById('dice-roll-mode').value,
    ...extra
  });
}

function rollCharacterInitiative(character, forcedMode) {
  const token = state.tokens.find(entry => entry.label.toLowerCase() === character.name.toLowerCase());
  rollDice(1, 20, characterInitiativeModifier(character), {
    name: characterRollName(character),
    characterName: character.name,
    label: `${character.name} initiative`,
    mode: forcedMode || document.getElementById('dice-roll-mode').value,
    initiativeName: character.name,
    tokenId: token?.id || null
  });
}

function characterInitiativeModifier(character) {
  const stored = character.initiativeModifier ?? character.fields?.initiative;
  if (stored !== '' && stored !== undefined && stored !== null) return Number(stored) || 0;
  return abilityModifier(character.abilities?.dex);
}

function characterSaveModifier(character, ability) {
  const saved = character.saves?.[ability]?.modifier ?? character.fields?.[`save-${ability}`];
  if (saved !== '' && saved !== undefined && saved !== null) return Number(saved) || 0;
  return abilityModifier(character.abilities?.[ability]) + (character.saves?.[ability]?.proficient ? proficiencyBonus(character.level) : 0);
}

function characterSkillModifier(character, skill) {
  const saved = character.skills?.[skill]?.modifier ?? character.fields?.[`skill-${skill}`];
  if (saved !== '' && saved !== undefined && saved !== null) return Number(saved) || 0;
  return abilityModifier(character.abilities?.[SKILL_ABILITIES[skill]]) + (character.skills?.[skill]?.proficient ? proficiencyBonus(character.level) : 0);
}

function parseDiceExpression(value) {
  const match = String(value || '').replace(/\s+/g, '').match(/(\d*)d(\d+)([+-]\d+)?/i);
  if (!match) return null;
  const count = Math.max(1, Number(match[1]) || 1);
  const sides = Math.max(2, Number(match[2]) || 20);
  const modifier = Number(match[3]) || 0;
  return { count, sides, modifier, expression: `${count}d${sides}${modifier ? signed(modifier) : ''}` };
}

// ================= QUICK COMBAT =================
function openCombatManager(name) {
  const character = state?.characters?.[name];
  if (!character?.canManage) return showToast('You can only manage combat for your own character.');
  activeCombatName = name;
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  renderCombatManager();
}

function closeCombatManager() {
  activeCombatName = null;
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function combatAction(action, extra = {}) {
  if (!activeCombatName) return;
  socket.emit('character:combat:update', { name: activeCombatName, action, ...extra });
}

function renderCombatManager() {
  const character = state?.characters?.[activeCombatName];
  if (!character) return closeCombatManager();
  const combat = character.combat || { conditions: [], concentration: false, exhaustion: 0, deathSaves: {}, spellSlots: {} };
  document.getElementById('combat-title').textContent = character.name;
  const portrait = document.getElementById('combat-portrait');
  portrait.innerHTML = character.portraitUrl ? `<img src="${escapeAttr(character.portraitUrl)}" alt="">` : '🍃';
  document.getElementById('combat-hp').textContent = `${Number(character.hp) || 0} / ${Number(character.maxHp) || 0}`;
  document.getElementById('combat-temp-hp').textContent = Number(character.tempHp) || 0;
  document.getElementById('combat-life-status').textContent = combat.dead ? 'Dead' : combat.stable ? 'Stable' : character.hp <= 0 ? 'Unconscious' : 'Ready';
  renderCombatRolls(character);
  document.getElementById('combat-concentration').checked = !!combat.concentration;
  document.getElementById('combat-exhaustion').textContent = Number(combat.exhaustion) || 0;
  document.getElementById('combat-death-successes').textContent = `${Number(combat.deathSaves?.successes) || 0} / 3`;
  document.getElementById('combat-death-failures').textContent = `${Number(combat.deathSaves?.failures) || 0} / 3`;

  const conditions = document.getElementById('combat-conditions');
  conditions.innerHTML = '';
  CONDITIONS.forEach(condition => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'condition-chip' + ((combat.conditions || []).includes(condition) ? ' active' : '');
    button.textContent = condition;
    button.onclick = () => combatAction('condition:toggle', { condition });
    conditions.appendChild(button);
  });

  const slots = document.getElementById('combat-spell-slots');
  slots.innerHTML = '';
  Object.entries(combat.spellSlots || {}).filter(([, slot]) => Number(slot.total) > 0).forEach(([level, slot]) => {
    const row = document.createElement('div');
    row.className = 'combat-slot-row';
    row.innerHTML = `
      <span class="slot-level">Level ${level}</span>
      <button class="counter-btn recover-slot" type="button" title="Recover one slot">−</button>
      <strong>${Number(slot.total) - Number(slot.used)} / ${Number(slot.total)} available</strong>
      <button class="counter-btn use-slot" type="button" title="Use one slot">+</button>
    `;
    row.querySelector('.recover-slot').onclick = () => combatAction('spellSlot', { level: Number(level), delta: -1 });
    row.querySelector('.use-slot').onclick = () => combatAction('spellSlot', { level: Number(level), delta: 1 });
    slots.appendChild(row);
  });
  if (!slots.children.length) slots.innerHTML = '<p class="empty-roll-options">No spell slots are configured on this sheet.</p>';

  const check = pendingConcentrationChecks.get(character.name);
  const checkButton = document.getElementById('combat-concentration-roll');
  checkButton.classList.toggle('hidden', !check);
  if (check) checkButton.textContent = `Roll Constitution save · DC ${check.dc}`;
}

function renderCombatRolls(character) {
  const mode = () => document.getElementById('combat-roll-mode').value;
  const initiativeButton = document.getElementById('combat-initiative-roll');
  initiativeButton.textContent = `Initiative ${signed(characterInitiativeModifier(character))}`;
  initiativeButton.onclick = () => rollCharacterInitiative(character, mode());

  const spellAttackValue = character.spellcasting?.attackBonus ?? character.fields?.['spell-attack'];
  const hasSpellAttack = spellAttackValue !== '' && spellAttackValue !== undefined && spellAttackValue !== null;
  const spellAttackButton = document.getElementById('combat-spell-attack-roll');
  spellAttackButton.classList.toggle('hidden', !hasSpellAttack);
  if (hasSpellAttack) {
    const spellModifier = Number(spellAttackValue) || 0;
    spellAttackButton.textContent = `Spell attack ${signed(spellModifier)}`;
    spellAttackButton.onclick = () => rollCharacterD20(character, 'Spell attack', spellModifier, { mode: mode() });
  }

  const spellDcValue = character.spellcasting?.saveDc ?? character.fields?.['spell-dc'];
  const spellDc = document.getElementById('combat-spell-dc');
  const hasSpellDc = spellDcValue !== '' && spellDcValue !== undefined && spellDcValue !== null;
  spellDc.classList.toggle('hidden', !hasSpellDc);
  if (hasSpellDc) spellDc.textContent = `Spell save DC ${Number(spellDcValue) || 0}`;

  const attacks = document.getElementById('combat-attacks');
  attacks.innerHTML = '';
  (character.attacks || []).filter(attack => attack.name).forEach(attack => {
    const row = document.createElement('div');
    row.className = 'combat-roll-row';
    const name = document.createElement('span');
    name.className = 'combat-roll-name';
    name.textContent = attack.name;
    row.appendChild(name);
    const bonusMatch = String(attack.bonus || '').match(/[+-]?\d+/);
    if (bonusMatch) {
      const modifier = Number(bonusMatch[0]);
      row.appendChild(makeCombatRollButton(`Hit ${signed(modifier)}`, () => rollCharacterD20(character, `${attack.name} attack`, modifier, { mode: mode() })));
    }
    const damage = parseDiceExpression(attack.damage);
    if (damage) {
      row.appendChild(makeCombatRollButton(damage.expression, () => rollDice(damage.count, damage.sides, damage.modifier, {
        characterName: character.name,
        label: `${attack.name} damage`
      }), true));
    }
    attacks.appendChild(row);
  });
  if (!attacks.children.length) attacks.innerHTML = '<p class="empty-roll-options">No attacks are configured.</p>';

  const spells = document.getElementById('combat-spells');
  spells.innerHTML = '';
  characterSpellEntries(character).forEach(spell => {
    const row = document.createElement('div');
    row.className = 'combat-roll-row';
    const name = document.createElement('span');
    name.className = 'combat-roll-name';
    name.textContent = spell.name;
    const level = document.createElement('small');
    level.textContent = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
    name.appendChild(level);
    row.appendChild(name);
    if (hasSpellAttack) {
      const modifier = Number(spellAttackValue) || 0;
      row.appendChild(makeCombatRollButton(`Attack ${signed(modifier)}`, () => rollCharacterD20(character, `${spell.name} spell attack`, modifier, { mode: mode() })));
    }
    const damage = parseDiceExpression(spell.name);
    if (damage) {
      row.appendChild(makeCombatRollButton(damage.expression, () => rollDice(damage.count, damage.sides, damage.modifier, {
        characterName: character.name,
        label: `${spell.name} damage`
      }), true));
    }
    spells.appendChild(row);
  });
  if (!spells.children.length) spells.innerHTML = '<p class="empty-roll-options">No spells are listed on the sheet.</p>';
}

function makeCombatRollButton(label, onclick, damage = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `combat-roll-button${damage ? ' damage' : ''}`;
  button.textContent = label;
  button.onclick = onclick;
  return button;
}

function characterSpellEntries(character) {
  const entries = [];
  for (let level = 0; level <= 9; level += 1) {
    const text = String(character.fields?.[`spells-${level}`] || '').trim();
    if (!text) continue;
    text.split(/\n|;/).flatMap(line => {
      const trimmed = line.trim();
      return trimmed.includes(',') && !/\d+d\d+/i.test(trimmed) ? trimmed.split(',') : [trimmed];
    }).map(name => name.trim()).filter(Boolean).forEach(name => entries.push({ level, name }));
  }
  return entries;
}

document.getElementById('combat-close-btn').onclick = closeCombatManager;
document.getElementById('combat-overlay').addEventListener('mousedown', event => {
  if (event.target.id === 'combat-overlay') closeCombatManager();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeCombatName) closeCombatManager();
});
document.getElementById('combat-damage-btn').onclick = () => combatAction('damage', { amount: Number(document.getElementById('combat-amount').value) || 0 });
document.getElementById('combat-heal-btn').onclick = () => combatAction('heal', { amount: Number(document.getElementById('combat-amount').value) || 0 });
document.getElementById('combat-temp-btn').onclick = () => combatAction('tempHp', { amount: Number(document.getElementById('combat-amount').value) || 0 });
document.getElementById('combat-concentration').onchange = event => combatAction('concentration:set', { value: event.target.checked });
document.querySelectorAll('[data-combat-action]').forEach(button => {
  button.onclick = () => {
    const actions = {
      'exhaustion-down': ['exhaustion', { delta: -1 }],
      'exhaustion-up': ['exhaustion', { delta: 1 }],
      'success-down': ['deathSave', { kind: 'successes', delta: -1 }],
      'success-up': ['deathSave', { kind: 'successes', delta: 1 }],
      'failure-down': ['deathSave', { kind: 'failures', delta: -1 }],
      'failure-up': ['deathSave', { kind: 'failures', delta: 1 }]
    };
    const [action, extra] = actions[button.dataset.combatAction];
    combatAction(action, extra);
  };
});
document.getElementById('combat-restore-slots-btn').onclick = () => combatAction('restoreAllSlots');
document.getElementById('combat-long-rest-btn').onclick = () => {
  if (confirm(`Give ${activeCombatName} a long rest? This restores HP and all spell slots.`)) combatAction('longRest');
};
document.getElementById('combat-concentration-roll').onclick = () => {
  const character = state?.characters?.[activeCombatName];
  const check = pendingConcentrationChecks.get(activeCombatName);
  if (!character || !check) return;
  rollCharacterD20(character, `Concentration save (DC ${check.dc})`, characterSaveModifier(character, 'con'), {
    targetDc: check.dc,
    concentrationFor: character.name,
    mode: 'normal'
  });
};

// ================= INITIATIVE (MAP PANEL) =================
document.getElementById('init-add-btn').onclick = () => {
  const name = document.getElementById('init-name').value.trim();
  const value = Number(document.getElementById('init-value').value);
  if (!name || !Number.isFinite(value)) return showToast('Add a name and initiative value.');
  const token = state.tokens.find(entry => entry.label.toLowerCase() === name.toLowerCase());
  socket.emit('initiative:add', { name, value, tokenId: token?.id || null });
  document.getElementById('init-name').value = '';
  document.getElementById('init-value').value = '';
};
document.getElementById('init-next-btn').onclick = () => socket.emit('initiative:next');
document.getElementById('init-reset-btn').onclick = () => {
  if (confirm('Clear the turn order and return to round 1?')) socket.emit('initiative:reset');
};

function currentInitiativeEntry() {
  const initiative = state?.initiative;
  if (!initiative || initiative.currentIndex < 0) return null;
  return initiative.entries[initiative.currentIndex] || null;
}

function renderInitiative() {
  if (!state) return;
  const initiative = state.initiative || { entries: [], round: 1, currentIndex: -1 };
  document.getElementById('init-round').textContent = initiative.round || 1;
  document.getElementById('initiative-count').textContent = initiative.entries.length;
  const list = document.getElementById('initiative-list');
  list.innerHTML = '';
  if (!initiative.entries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-roll-options';
    empty.textContent = 'No combatants yet. Roll initiative from the Dice tab or add one here.';
    list.appendChild(empty);
  }
  initiative.entries.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'initiative-item' + (index === initiative.currentIndex ? ' current-turn' : '');
    const value = document.createElement('div');
    value.className = 'init-value';
    value.textContent = entry.value;
    const name = document.createElement('div');
    name.className = 'init-name';
    name.textContent = entry.name;
    if (index === initiative.currentIndex) {
      const meta = document.createElement('span');
      meta.className = 'init-meta';
      meta.textContent = 'Current turn';
      name.appendChild(meta);
    }
    row.append(value, name);
    const character = state.characters[entry.name];
    if (character?.canManage) {
      const combatButton = document.createElement('button');
      combatButton.type = 'button';
      combatButton.className = 'initiative-combat-btn';
      combatButton.textContent = '⚔';
      combatButton.title = `Open combat controls for ${entry.name}`;
      combatButton.onclick = () => openCombatManager(entry.name);
      row.appendChild(combatButton);
    }
    if (myRole === 'dm') {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'del';
      remove.textContent = '×';
      remove.title = `Remove ${entry.name}`;
      remove.onclick = () => socket.emit('initiative:remove', { id: entry.id });
      row.appendChild(remove);
    }
    list.appendChild(row);
  });
  renderInitiativeQuickAdd();
}

function renderInitiativeQuickAdd() {
  const container = document.getElementById('init-quick-add');
  container.innerHTML = '';
  if (myRole !== 'dm') return;
  const label = document.createElement('span');
  label.className = 'quick-add-label';
  label.textContent = 'Roll:';
  container.appendChild(label);
  Object.values(state.characters).forEach(character => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-ghost quick-add-chip';
    button.textContent = character.name;
    button.onclick = () => rollCharacterInitiative(character, 'normal');
    container.appendChild(button);
  });
  state.tokens.filter(token => token.kind !== 'item' && !state.characters[token.label]).forEach(token => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-ghost quick-add-chip';
    button.textContent = token.label;
    button.onclick = () => {
      document.getElementById('init-name').value = token.label;
      document.getElementById('init-value').focus();
    };
    container.appendChild(button);
  });
}

// ================= Shared helpers =================
function signed(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}
