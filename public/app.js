const socket = io();
const {
  clampScale,
  fitStageInViewport,
  gridMeasurement,
  positionStagePoint,
  snapCoordinateToCell,
  zoomAroundPoint
} = window.HumblewoodMapGeometry;
const combatState = window.HumblewoodCombatState;
const characterRules = window.HumblewoodCharacterRules;
const HUMBLEWOOD_FEAT_PRESETS = (window.HumblewoodAlmanacData || [])
  .find(category => category.id === 'feats')?.entries || [];

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
let draggingTokenTouchId = null;
let dragOffset = { x: 0, y: 0 };
let pendingTrayToken = null; // token about to be dropped from tray
let mapScale = 1;
let mapPan = { x: 0, y: 0 };
let panStart = null;
let gridMoveStart = null;
let touchGesture = null;
let spacePanPressed = false;
let lastFittedMapUrl = null;
let editingOriginalName = null;
let editingInventory = [];
let editingSpells = [];
let editingSpellId = null;
let editingPortraitUrl = null;
let pendingPortraitFile = null;
let editingCanEdit = true;
let initiativeManuallyEdited = false;
let toastTimer = null;
let activeCombatTarget = null;
let editingNpcId = null;
let rulerStartPoint = null;
let rulerAnchorPoint = null;
let mapAreaDrag = null;
let lastPointerSentAt = 0;
let draggedInitiativeId = null;
const pendingConcentrationChecks = new Map();
const pointerFadeTimers = new Map();

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

initializeCharacterRuleControls();
initializeFeatPresetControls();

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

// ---------------- Frontend routes ----------------
const router = window.HumblewoodRouter.createRouter({
  routes: {
    map: { path: '/map', title: 'Map' },
    characters: { path: '/characters', title: 'Characters' },
    almanac: { path: '/almanac', title: 'Humble Almanac' },
    jukebox: { path: '/jukebox', title: 'Jukebox' },
    dice: { path: '/dice', title: 'Dice' }
  },
  onRoute: renderRoute
});

window.HumblewoodAlmanac.mount(window.HumblewoodAlmanacData);

document.getElementById('topbar-roll-btn').onclick = () => switchView('dice');

function renderRoute(viewName, route) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.view === viewName) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === 'view-' + viewName));
  document.title = `${route.title} · The Humblewood Table`;
  if (viewName === 'dice') refreshCharacterRoller();
}

function switchView(viewName) {
  router.navigate(viewName);
}

router.start();

// ---------------- Socket state sync ----------------
socket.on('state:full', (s) => {
  state = s;
  renderMap();
  renderTokenTray();
  renderNpcRoster();
  renderSavedScenes();
  renderPlayerSidebar();
  renderDmSidebarSummary();
  renderCharacters();
  renderJukebox();
  renderRollLog();
  renderInitiative();
  refreshCharacterRoller();
  if (activeCombatTarget) renderCombatManager();
});

socket.on('scene:update', (scene) => {
  if (!state) return;
  state.scene = scene;
  renderMap();
  renderTokenTray();
  renderSavedScenes();
  renderDmSidebarSummary();
});
socket.on('scene:doodle:add', (path) => { if (state) { state.scene.doodlePaths.push(path); drawDoodlePath(path); } });
socket.on('scene:doodle:clear', () => { if (state) { state.scene.doodlePaths = []; clearDoodleCanvas(); } });
socket.on('scene:doodle:redrawAll', (paths) => { if (state) { state.scene.doodlePaths = paths || []; redrawAllDoodles(); } });
socket.on('scene:fog:update', ({ enabled, shapes }) => {
  if (!state) return;
  state.scene.fogEnabled = !!enabled;
  state.scene.fogShapes = Array.isArray(shapes) ? shapes : [];
  updateMapPermissionControls();
  renderFog();
});
socket.on('scene:dirty', ({ dirty }) => {
  if (!state) return;
  state.sceneDirty = !!dirty;
  renderSavedScenes();
});

socket.on('token:add', (t) => {
  state.tokens.push(t);
  renderTokenTray();
  renderMapTokens();
  renderNpcRoster();
  renderDmSidebarSummary();
  renderCharacters();
});
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
  renderNpcRoster();
  renderDmSidebarSummary();
  if (activeCombatTarget?.type === 'npc' && activeCombatTarget.id === updated.id) renderCombatManager();
});
socket.on('token:remove', ({ id }) => {
  state.tokens = state.tokens.filter(t => t.id !== id);
  if (activeCombatTarget?.type === 'npc' && activeCombatTarget.id === id) closeCombatManager();
  renderMapTokens(); renderTokenTray();
  renderNpcRoster();
  renderDmSidebarSummary();
  renderCharacters();
});

socket.on('npcs:update', npcs => { state.npcs = npcs || {}; renderNpcRoster(); renderDmSidebarSummary(); });
socket.on('scenes:update', scenes => { state.savedScenes = scenes || []; renderSavedScenes(); });
socket.on('scene:active', ({ name }) => { state.activeSceneName = name || null; renderSavedScenes(); renderDmSidebarSummary(); });
socket.on('scene:saved', ({ name }) => showToast(`Saved scene “${name}”.`));
socket.on('scene:loaded', ({ name }) => showToast(`Loaded scene “${name}”.`));
socket.on('scene:deleted', ({ name }) => showToast(`Deleted saved scene “${name}”.`));
socket.on('npc:saved', ({ name }) => { resetNpcEditor(); showToast(`Saved ${name}.`); });
socket.on('npc:deleted', ({ id, name }) => {
  if (editingNpcId === id) resetNpcEditor();
  showToast(`Deleted ${name}.`);
});

socket.on('jukebox:update', (j) => { state.jukebox = j; renderJukebox(); });
socket.on('character:update', (sheet) => {
  state.characters[sheet.name] = sheet;
  renderCharacters();
  renderPlayerSidebar();
  renderInitiative();
  refreshCharacterRoller();
  if (activeCombatTarget?.type === 'character' && activeCombatTarget.id === sheet.name) renderCombatManager();
});
socket.on('character:remove', ({ name }) => {
  delete state.characters[name];
  if (activeCombatTarget?.type === 'character' && activeCombatTarget.id === name) closeCombatManager();
  renderCharacters();
  renderPlayerSidebar();
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
  if (activeCombatTarget?.type === 'character' && activeCombatTarget.id === name) renderCombatManager();
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

socket.on('pointer:move', renderSharedPointer);
socket.on('pointer:hide', ({ id }) => removeSharedPointer(id));
socket.on('pointer:ping', renderSharedPing);

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
  const gridOffsetX = Number(state.scene.gridOffsetX) || 0;
  const gridOffsetY = Number(state.scene.gridOffsetY) || 0;
  grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  grid.style.backgroundPosition = `${gridOffsetX}px ${gridOffsetY}px`;
  grid.classList.toggle('visible', !!state.scene.gridVisible);
  document.getElementById('grid-toggle').checked = !!state.scene.gridVisible;
  document.getElementById('grid-size').value = gridSize;
  document.getElementById('fit-token-toggle').checked = state.scene.fitTokensToGrid !== false;
  if (!Array.isArray(state.scene.doodlePaths)) state.scene.doodlePaths = [];
  if (!Array.isArray(state.scene.fogShapes)) state.scene.fogShapes = [];
  updateMapPermissionControls();
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
      const fogCanvas = document.getElementById('fog-canvas');
      fogCanvas.width = img.naturalWidth;
      fogCanvas.height = img.naturalHeight;
      redrawAllDoodles();
      renderFog();
      renderMapTokens();
      if (lastFittedMapUrl !== state.scene.mapUrl) {
        lastFittedMapUrl = state.scene.mapUrl;
        fitMapToViewport();
      }
    };
    img.onload = sizeMapStage;
    img.src = state.scene.mapUrl;
    img.style.display = 'block';
    empty.style.display = 'none';
    if (img.complete && img.naturalWidth) sizeMapStage();
  } else {
    lastFittedMapUrl = null;
    img.style.display = 'none';
    empty.style.display = 'flex';
    renderFog();
    renderMapTokens();
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
    const displayLabel = visibleTokenLabel(t);
    el.setAttribute('aria-label', `${displayLabel || t.kind + ' token'}${t.canControl ? ', your token' : ', locked token'}`);
    el.style.left = t.x + 'px';
    el.style.top = t.y + 'px';
    const renderSize = tokenRenderSize(t);
    el.style.width = renderSize + 'px';
    el.style.height = renderSize + 'px';
    el.style.fontSize = Math.max(12, Math.round(renderSize * 0.45)) + 'px';
    const linkedCharacter = t.characterName ? state.characters[t.characterName] : null;
    const canManageCombat = !!linkedCharacter?.canManage || (myRole === 'dm' && t.kind === 'npc');
    const controls = [
      canManageCombat ? '<button type="button" data-action="combat" title="Open combat controls">⚔</button>' : '',
      myRole === 'dm' && !linkedCharacter && t.maxHp ? '<button type="button" data-action="damage" title="Lose 1 HP">−</button><button type="button" data-action="heal" title="Heal 1 HP">+</button>' : '',
      myRole === 'dm' ? '<button type="button" data-action="size-down" title="Make token smaller">↙</button><button type="button" data-action="size-up" title="Make token larger">↗</button>' : '',
      myRole === 'dm' ? '<button type="button" data-action="duplicate" title="Duplicate token">⧉</button>' : '',
      myRole === 'dm' ? `<button type="button" data-action="visibility" title="Show or hide from players">${t.visibleToPlayers === false ? '🙈' : '👁'}</button>` : '',
      myRole === 'dm' ? `<button type="button" data-action="remove" title="Remove ${t.kind === 'item' ? 'item token' : 'token'} from this scene">×</button>` : ''
    ].join('');
    el.innerHTML = `
      ${displayLabel ? `<div class="label">${escapeHtml(displayLabel)}</div>` : ''}
      ${t.imageUrl ? `<img src="${escapeAttr(t.imageUrl)}" alt="">` : emojiFor(t.kind)}
      ${t.maxHp ? `<div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, (t.hp / t.maxHp) * 100)}%"></div></div>` : ''}
      ${renderTokenConditionBadges(t, linkedCharacter)}
      ${controls ? `<div class="token-controls">${controls}</div>` : ''}
    `;
    el.onmousedown = (e) => startDragToken(e, t.id);
    el.addEventListener('touchstart', event => {
      if (event.target.closest?.('.token-controls') || selectedTool !== 'move') return;
      if (event.touches.length !== 1) {
        cancelDraggedToken();
        return;
      }
      const touch = event.touches[0];
      event.preventDefault();
      event.stopPropagation();
      el.focus({ preventScroll: true });
      if (startDragTokenAt(touch.clientX, touch.clientY, el, t.id)) {
        draggingTokenTouchId = touch.identifier;
      }
    }, { passive: false });
    el.onkeydown = event => {
      if ((event.key === 'Enter' || event.key === ' ') && canManageCombat) {
        event.preventDefault();
        if (linkedCharacter) openCombatManager(t.characterName);
        else openNpcCombatManager(t.id);
      }
    };
    el.querySelectorAll('.token-controls button').forEach(button => {
      button.onmousedown = (e) => e.stopPropagation();
      button.ontouchstart = (e) => e.stopPropagation();
      button.onclick = (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        if (action === 'combat') {
          if (linkedCharacter) openCombatManager(t.characterName);
          else openNpcCombatManager(t.id);
        }
        if (action === 'damage') socket.emit('token:update', { id: t.id, hp: Math.max(0, Number(t.hp) - 1) });
        if (action === 'heal') socket.emit('token:update', { id: t.id, hp: Math.min(Number(t.maxHp), Number(t.hp) + 1) });
        if (action === 'size-down') adjustTokenScale(t, -0.15);
        if (action === 'size-up') adjustTokenScale(t, 0.15);
        if (action === 'duplicate') socket.emit('token:duplicate', { id: t.id });
        if (action === 'visibility') socket.emit('token:update', { id: t.id, visibleToPlayers: t.visibleToPlayers === false });
        if (action === 'remove') socket.emit('token:remove', { id: t.id });
      };
    });
    stage.appendChild(el);
  });
}

function visibleTokenLabel(token) {
  if (myRole === 'dm' || state.scene.showTokenLabelsToPlayers !== false || token.kind === 'pc') return token.label;
  return '';
}

function renderTokenConditionBadges(token, linkedCharacter) {
  const combat = linkedCharacter?.combat || token.combat || token.conditionBadges || {};
  const badges = (combat.conditions || []).slice(0, 4).map(condition => ({
    text: condition.slice(0, 2).toUpperCase(), title: condition
  }));
  if (combat.concentration) badges.push({ text: '◎', title: 'Concentrating' });
  if (Number(combat.exhaustion)) badges.push({ text: `E${Number(combat.exhaustion)}`, title: `Exhaustion ${Number(combat.exhaustion)}` });
  if (!badges.length) return '';
  return `<div class="token-condition-badges">${badges.map(badge => `<span title="${escapeAttr(badge.title)}">${escapeHtml(badge.text)}</span>`).join('')}</div>`;
}

function tokenRenderSize(token) {
  const scale = Math.max(0.35, Math.min(3, Number(token.sizeScale) || 1));
  if (state.scene.fitTokensToGrid === false) return Math.max(12, Math.min(360, Math.round((Number(token.size) || 44) * scale)));
  const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
  const ratio = token.kind === 'item' ? 0.62 : 0.84;
  return Math.max(12, Math.min(360, Math.round(gridSize * ratio * scale)));
}

function adjustTokenScale(token, delta) {
  const current = Math.max(0.35, Math.min(3, Number(token.sizeScale) || 1));
  const next = Math.max(0.35, Math.min(3, Math.round((current + delta) * 100) / 100));
  socket.emit('token:update', { id: token.id, sizeScale: next });
}

function emojiFor(kind) {
  return kind === 'pc' ? '🧝' : kind === 'npc' ? '🦊' : '🌸';
}

function startDragToken(e, id) {
  if (e.button !== 0) return;
  if (!startDragTokenAt(e.clientX, e.clientY, e.currentTarget, id)) return;
  e.preventDefault();
}

function startDragTokenAt(clientX, clientY, element, id) {
  if (selectedTool !== 'move') return false;
  const token = state.tokens.find(entry => entry.id === id);
  if (!token?.canControl) {
    showToast('You can only move your own character token.');
    return false;
  }
  draggingToken = id;
  const rect = element.getBoundingClientRect();
  dragOffset.x = (clientX - (rect.left + rect.width / 2)) / mapScale;
  dragOffset.y = (clientY - (rect.top + rect.height / 2)) / mapScale;
  return true;
}

function moveDraggedToken(clientX, clientY) {
  if (!draggingToken) return;
  const stage = document.getElementById('map-stage');
  const rect = stage.getBoundingClientRect();
  const x = (clientX - rect.left) / mapScale - dragOffset.x;
  const y = (clientY - rect.top) / mapScale - dragOffset.y;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) {
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
}

function finishDraggedToken() {
  if (!draggingToken) return;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) {
    let x = parseFloat(el.style.left);
    let y = parseFloat(el.style.top);
    if (document.getElementById('snap-toggle').checked) {
      const size = Math.max(10, Number(state.scene.gridSize) || 50);
      x = snapCoordinateToCell(x, size, state.scene.gridOffsetX);
      y = snapCoordinateToCell(y, size, state.scene.gridOffsetY);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    }
    socket.emit('token:move', { id: draggingToken, x, y });
  }
  draggingToken = null;
  draggingTokenTouchId = null;
}

function cancelDraggedToken() {
  if (!draggingToken) return;
  const token = state?.tokens?.find(entry => entry.id === draggingToken);
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (token && el) {
    el.style.left = token.x + 'px';
    el.style.top = token.y + 'px';
  }
  draggingToken = null;
  draggingTokenTouchId = null;
}

document.addEventListener('mousemove', (e) => {
  moveDraggedToken(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => finishDraggedToken());
document.addEventListener('touchmove', event => {
  if (!draggingToken || draggingTokenTouchId === null) return;
  const touch = Array.from(event.touches).find(entry => entry.identifier === draggingTokenTouchId);
  if (!touch) return;
  event.preventDefault();
  moveDraggedToken(touch.clientX, touch.clientY);
}, { passive: false });
document.addEventListener('touchend', event => {
  if (!draggingToken || draggingTokenTouchId === null) return;
  const ended = Array.from(event.changedTouches).some(entry => entry.identifier === draggingTokenTouchId);
  if (!ended) return;
  event.preventDefault();
  finishDraggedToken();
}, { passive: false });
document.addEventListener('touchcancel', event => {
  if (!draggingToken || draggingTokenTouchId === null) return;
  const cancelled = Array.from(event.changedTouches).some(entry => entry.identifier === draggingTokenTouchId);
  if (cancelled) cancelDraggedToken();
}, { passive: false });

// ---- Tool toggle ----
document.getElementById('tool-move').onclick = () => setTool('move');
document.getElementById('tool-pan').onclick = () => setTool('pan');
document.getElementById('tool-grid-move').onclick = () => setTool('grid-move');
document.getElementById('tool-ruler').onclick = () => setTool('ruler');
document.getElementById('tool-ping').onclick = () => setTool('ping');
document.getElementById('tool-doodle').onclick = () => setTool('doodle');
document.getElementById('tool-fog-reveal').onclick = () => setTool('fog-reveal');
document.getElementById('tool-fog-hide').onclick = () => setTool('fog-hide');
function setTool(tool) {
  if (tool === 'doodle' && !canDoodle()) return showToast('Player doodling is not enabled for this scene.');
  if (tool.startsWith('fog-') && (myRole !== 'dm' || !state.scene.fogEnabled)) return showToast('Enable fog of war first.');
  if (tool === 'grid-move' && myRole !== 'dm') return;
  const previousTool = selectedTool;
  selectedTool = tool;
  if (previousTool === 'doodle' && tool !== 'doodle') cancelDoodle();
  ['move', 'pan', 'grid-move', 'ruler', 'ping', 'doodle', 'fog-reveal', 'fog-hide'].forEach(name => {
    document.getElementById(`tool-${name}`)?.classList.toggle('active', tool === name);
  });
  const stage = document.getElementById('map-stage');
  stage.classList.toggle('doodling', tool === 'doodle');
  stage.classList.toggle('panning', tool === 'pan');
  stage.classList.toggle('grid-moving', tool === 'grid-move');
  stage.classList.toggle('measuring', tool === 'ruler');
  stage.classList.toggle('pinging', tool === 'ping');
  stage.classList.toggle('fog-editing', tool.startsWith('fog-'));
  if (previousTool === 'ping' && tool !== 'ping') socket.emit('pointer:hide');
  if (tool !== 'ruler') clearRuler();
  if (tool === 'ruler' && previousTool !== 'ruler') showToast('Drag to measure, or tap a start square and then an end square.');
  clearMapAreaSelection();
}

function canDoodle() {
  return myRole === 'dm' || !!state?.scene?.playerDoodlingEnabled;
}

function updateMapPermissionControls() {
  if (!state) return;
  document.getElementById('player-doodling-toggle').checked = !!state.scene.playerDoodlingEnabled;
  document.getElementById('token-labels-toggle').checked = state.scene.showTokenLabelsToPlayers !== false;
  document.getElementById('fog-enabled-toggle').checked = !!state.scene.fogEnabled;
  document.querySelectorAll('.doodle-control').forEach(element => element.classList.toggle('hidden', !canDoodle()));
  document.querySelectorAll('.fog-tool').forEach(element => element.classList.toggle('hidden', myRole !== 'dm' || !state.scene.fogEnabled));
  if (selectedTool === 'doodle' && !canDoodle()) setTool('move');
  if (selectedTool.startsWith('fog-') && !state.scene.fogEnabled) setTool('move');
}

document.getElementById('clear-doodles-btn').onclick = () => socket.emit('scene:doodle:clear');
document.getElementById('undo-doodle-btn').onclick = () => socket.emit('scene:doodle:undo');
document.getElementById('player-doodling-toggle').onchange = event => socket.emit('scene:setPlayerDoodling', { enabled: event.target.checked });
document.getElementById('token-labels-toggle').onchange = event => socket.emit('scene:setTokenLabels', { visible: event.target.checked });
document.getElementById('fog-enabled-toggle').onchange = event => socket.emit('scene:setFog', { enabled: event.target.checked });
document.getElementById('undo-fog-btn').onclick = () => socket.emit('scene:fog:undo');
document.getElementById('reset-fog-btn').onclick = () => {
  if (confirm('Reset fog to fully covered?')) socket.emit('scene:fog:reset');
};

const mapStageWrap = document.getElementById('map-stage-wrap');
mapStageWrap.addEventListener('mousedown', (e) => {
  const canStartPan = (selectedTool === 'pan' && e.button === 0) || e.button === 1 || (spacePanPressed && e.button === 0);
  if (selectedTool === 'grid-move' && e.button === 0 && myRole === 'dm' && isMapGestureTarget(e.target)) {
    e.preventDefault();
    gridMoveStart = {
      clientX: e.clientX, clientY: e.clientY,
      offsetX: Number(state.scene.gridOffsetX) || 0,
      offsetY: Number(state.scene.gridOffsetY) || 0
    };
    return;
  }
  if (!canStartPan || !isMapGestureTarget(e.target)) return;
  e.preventDefault();
  panStart = { clientX: e.clientX, clientY: e.clientY, x: mapPan.x, y: mapPan.y };
  mapStageWrap.classList.add('is-panning');
});
document.addEventListener('mousemove', (e) => {
  if (gridMoveStart) {
    const grid = document.getElementById('grid-overlay');
    const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
    const dx = (e.clientX - gridMoveStart.clientX) / mapScale;
    const dy = (e.clientY - gridMoveStart.clientY) / mapScale;
    const previewX = (((gridMoveStart.offsetX + dx) % gridSize) + gridSize) % gridSize;
    const previewY = (((gridMoveStart.offsetY + dy) % gridSize) + gridSize) % gridSize;
    grid.style.backgroundPosition = `${previewX}px ${previewY}px`;
    gridMoveStart.currentX = previewX;
    gridMoveStart.currentY = previewY;
    return;
  }
  if (!panStart) return;
  mapPan.x = panStart.x + e.clientX - panStart.clientX;
  mapPan.y = panStart.y + e.clientY - panStart.clientY;
  applyMapTransform();
});
document.addEventListener('mouseup', () => {
  if (gridMoveStart) {
    if (gridMoveStart.currentX !== undefined) {
      socket.emit('scene:setGrid', {
        gridSize: Number(document.getElementById('grid-size').value) || 50,
        gridVisible: document.getElementById('grid-toggle').checked,
        fitTokensToGrid: document.getElementById('fit-token-toggle').checked,
        gridOffsetX: gridMoveStart.currentX,
        gridOffsetY: gridMoveStart.currentY
      });
    }
    gridMoveStart = null;
  }
  panStart = null;
  mapStageWrap.classList.remove('is-panning');
});

document.addEventListener('keydown', event => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (event.code !== 'Space' || typing) return;
  spacePanPressed = true;
  mapStageWrap.classList.add('space-pan-ready');
  if (document.getElementById('view-map').classList.contains('active')) event.preventDefault();
});
document.addEventListener('keyup', event => {
  if (event.code !== 'Space') return;
  spacePanPressed = false;
  mapStageWrap.classList.remove('space-pan-ready');
});

mapStageWrap.addEventListener('wheel', event => {
  if (!isMapGestureTarget(event.target)) return;
  event.preventDefault();
  const sensitivity = event.ctrlKey ? 0.006 : 0.0015;
  const nextScale = mapScale * Math.exp(-event.deltaY * sensitivity);
  setMapZoom(nextScale, { clientX: event.clientX, clientY: event.clientY });
}, { passive: false });

mapStageWrap.addEventListener('touchstart', event => {
  if (!isMapGestureTarget(event.target)) return;
  if (event.touches.length >= 2) {
    event.preventDefault();
    cancelDraggedToken();
    cancelDoodle();
    if (touchGesture?.type === 'ruler' || rulerAnchorPoint) clearRuler();
    touchGesture = createPinchGesture(event.touches);
  } else if (event.touches.length === 1 && selectedTool === 'ruler') {
    event.preventDefault();
    const touch = event.touches[0];
    const point = getCanvasPos(touch);
    const completingTap = !!rulerAnchorPoint;
    touchGesture = {
      type: 'ruler',
      start: completingTap ? rulerAnchorPoint : point,
      startClientX: touch.clientX,
      startClientY: touch.clientY,
      moved: false,
      completingTap
    };
    updateRuler(touchGesture.start, point);
  } else if (event.touches.length === 1 && selectedTool === 'pan') {
    event.preventDefault();
    const touch = event.touches[0];
    touchGesture = {
      type: 'pan',
      clientX: touch.clientX,
      clientY: touch.clientY,
      pan: { ...mapPan }
    };
    mapStageWrap.classList.add('is-panning');
  }
}, { passive: false });

mapStageWrap.addEventListener('touchmove', event => {
  if (event.touches.length >= 2) {
    event.preventDefault();
    cancelDraggedToken();
    cancelDoodle();
    if (touchGesture?.type === 'ruler' || rulerAnchorPoint) clearRuler();
    if (touchGesture?.type !== 'pinch') touchGesture = createPinchGesture(event.touches);
    const current = touchMetrics(event.touches);
    const wrapperRect = mapStageWrap.getBoundingClientRect();
    const anchor = {
      x: current.center.x - wrapperRect.left,
      y: current.center.y - wrapperRect.top
    };
    const next = positionStagePoint({
      stagePoint: touchGesture.stagePoint,
      anchor,
      nextScale: touchGesture.scale * (current.distance / Math.max(1, touchGesture.distance))
    });
    mapScale = next.scale;
    mapPan = next.pan;
    applyMapTransform();
  } else if (event.touches.length === 1 && touchGesture?.type === 'ruler') {
    event.preventDefault();
    const touch = event.touches[0];
    if (Math.hypot(touch.clientX - touchGesture.startClientX, touch.clientY - touchGesture.startClientY) >= 8) {
      touchGesture.moved = true;
    }
    updateRuler(touchGesture.start, getCanvasPos(touch));
  } else if (event.touches.length === 1 && touchGesture?.type === 'pan') {
    event.preventDefault();
    const touch = event.touches[0];
    mapPan.x = touchGesture.pan.x + touch.clientX - touchGesture.clientX;
    mapPan.y = touchGesture.pan.y + touch.clientY - touchGesture.clientY;
    applyMapTransform();
  }
}, { passive: false });

mapStageWrap.addEventListener('touchend', event => {
  if (touchGesture?.type === 'ruler') {
    event.preventDefault();
    const touch = event.changedTouches[0];
    const end = touch ? getCanvasPos(touch) : touchGesture.start;
    if (!touchGesture.moved && !touchGesture.completingTap) {
      rulerAnchorPoint = touchGesture.start;
      updateRuler(rulerAnchorPoint, rulerAnchorPoint);
      showToast('Start placed. Tap the ending square.');
    } else {
      updateRuler(touchGesture.start, end);
      rulerAnchorPoint = null;
    }
    touchGesture = null;
  } else if (event.touches.length === 1 && selectedTool === 'pan') {
    const touch = event.touches[0];
    touchGesture = {
      type: 'pan',
      clientX: touch.clientX,
      clientY: touch.clientY,
      pan: { ...mapPan }
    };
  } else if (event.touches.length < 2) {
    touchGesture = null;
    mapStageWrap.classList.remove('is-panning');
  }
}, { passive: false });
mapStageWrap.addEventListener('touchcancel', () => {
  if (touchGesture?.type === 'ruler') {
    if (rulerAnchorPoint) updateRuler(rulerAnchorPoint, rulerAnchorPoint);
    else clearRuler();
  }
  touchGesture = null;
  mapStageWrap.classList.remove('is-panning');
});

function isMapGestureTarget(target) {
  return !!target.closest?.('#map-stage, #empty-map') && !target.closest('button, input, select, textarea, label');
}

function touchMetrics(touches) {
  const first = touches[0];
  const second = touches[1];
  return {
    center: {
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2
    },
    distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
  };
}

function createPinchGesture(touches) {
  const metrics = touchMetrics(touches);
  const wrapperRect = mapStageWrap.getBoundingClientRect();
  const anchor = {
    x: metrics.center.x - wrapperRect.left,
    y: metrics.center.y - wrapperRect.top
  };
  mapStageWrap.classList.add('is-panning');
  return {
    type: 'pinch',
    distance: metrics.distance,
    scale: mapScale,
    stagePoint: {
      x: (anchor.x - mapPan.x) / mapScale,
      y: (anchor.y - mapPan.y) / mapScale
    }
  };
}

const mapStage = document.getElementById('map-stage');
mapStage.addEventListener('mousedown', event => {
  if (event.button !== 0) return;
  const point = getCanvasPos(event);
  if (selectedTool === 'ruler') {
    event.preventDefault();
    rulerAnchorPoint = null;
    rulerStartPoint = point;
    updateRuler(point, point);
  } else if (selectedTool === 'ping') {
    event.preventDefault();
    socket.emit('pointer:ping', point);
  } else if (selectedTool === 'fog-reveal' || selectedTool === 'fog-hide') {
    event.preventDefault();
    mapAreaDrag = { start: point, current: point, mode: selectedTool === 'fog-reveal' ? 'reveal' : 'hide' };
    updateMapAreaSelection(mapAreaDrag);
  }
});

mapStage.addEventListener('mousemove', event => {
  if (selectedTool !== 'ping') return;
  const now = Date.now();
  if (now - lastPointerSentAt < 45) return;
  lastPointerSentAt = now;
  socket.emit('pointer:move', getCanvasPos(event));
});

mapStage.addEventListener('mouseleave', () => {
  if (selectedTool === 'ping') socket.emit('pointer:hide');
});

document.addEventListener('mousemove', event => {
  if (rulerStartPoint) updateRuler(rulerStartPoint, getCanvasPos(event));
  if (mapAreaDrag) {
    mapAreaDrag.current = getCanvasPos(event);
    updateMapAreaSelection(mapAreaDrag);
  }
});

document.addEventListener('mouseup', event => {
  if (rulerStartPoint) {
    updateRuler(rulerStartPoint, getCanvasPos(event));
    rulerStartPoint = null;
  }
  if (mapAreaDrag) {
    const current = getCanvasPos(event);
    const x = Math.min(mapAreaDrag.start.x, current.x);
    const y = Math.min(mapAreaDrag.start.y, current.y);
    const width = Math.abs(current.x - mapAreaDrag.start.x);
    const height = Math.abs(current.y - mapAreaDrag.start.y);
    if (width >= 3 && height >= 3) socket.emit('scene:fog:add', { mode: mapAreaDrag.mode, x, y, width, height });
    mapAreaDrag = null;
    clearMapAreaSelection();
  }
});

function updateRuler(start, end) {
  const overlay = document.getElementById('ruler-overlay');
  const line = document.getElementById('ruler-line');
  const startDot = document.getElementById('ruler-start');
  const endDot = document.getElementById('ruler-end');
  const label = document.getElementById('ruler-label');
  const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
  const measurement = gridMeasurement(
    start,
    end,
    gridSize,
    state.scene.gridOffsetX,
    state.scene.gridOffsetY
  );
  overlay.classList.add('visible');
  line.setAttribute('x1', measurement.start.x); line.setAttribute('y1', measurement.start.y);
  line.setAttribute('x2', measurement.end.x); line.setAttribute('y2', measurement.end.y);
  startDot.setAttribute('cx', measurement.start.x); startDot.setAttribute('cy', measurement.start.y);
  endDot.setAttribute('cx', measurement.end.x); endDot.setAttribute('cy', measurement.end.y);
  label.setAttribute('x', (measurement.start.x + measurement.end.x) / 2);
  label.setAttribute('y', (measurement.start.y + measurement.end.y) / 2 - 10);
  const squareLabel = measurement.squares === 1 ? 'square' : 'squares';
  label.textContent = `${measurement.squares} ${squareLabel} · ${measurement.feet} ft`;
}

function clearRuler() {
  rulerStartPoint = null;
  rulerAnchorPoint = null;
  document.getElementById('ruler-overlay').classList.remove('visible');
}

function updateMapAreaSelection(drag) {
  const selection = document.getElementById('map-area-selection');
  const x = Math.min(drag.start.x, drag.current.x);
  const y = Math.min(drag.start.y, drag.current.y);
  selection.style.left = `${x}px`;
  selection.style.top = `${y}px`;
  selection.style.width = `${Math.abs(drag.current.x - drag.start.x)}px`;
  selection.style.height = `${Math.abs(drag.current.y - drag.start.y)}px`;
  selection.className = `visible ${drag.mode}`;
}

function clearMapAreaSelection() {
  mapAreaDrag = null;
  const selection = document.getElementById('map-area-selection');
  selection.className = '';
  selection.style.width = '0';
  selection.style.height = '0';
}

document.getElementById('grid-toggle').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('grid-size').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('fit-token-toggle').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('grid-offset-reset').onclick = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked,
    gridOffsetX: 0,
    gridOffsetY: 0
  });
};

document.getElementById('zoom-in').onclick = () => setMapZoom(mapScale * 1.2, viewportCenter());
document.getElementById('zoom-out').onclick = () => setMapZoom(mapScale / 1.2, viewportCenter());
document.getElementById('zoom-reset').onclick = () => {
  mapScale = 1;
  mapPan = { x: 0, y: 0 };
  applyMapTransform();
};
document.getElementById('zoom-fit').onclick = fitMapToViewport;

document.getElementById('toggle-initiative-btn').onclick = () => {
  const mapView = document.getElementById('view-map');
  const collapsed = mapView.classList.toggle('initiative-collapsed');
  document.getElementById('toggle-initiative-btn').setAttribute('aria-expanded', String(!collapsed));
};

function setMapZoom(value, clientPoint = viewportCenter()) {
  const wrapperRect = mapStageWrap.getBoundingClientRect();
  const anchor = {
    x: clientPoint.clientX - wrapperRect.left,
    y: clientPoint.clientY - wrapperRect.top
  };
  const next = zoomAroundPoint({
    pan: mapPan,
    scale: mapScale,
    nextScale: clampScale(Math.round(value * 1000) / 1000),
    anchor
  });
  mapScale = next.scale;
  mapPan = next.pan;
  applyMapTransform();
}

function viewportCenter() {
  const rect = mapStageWrap.getBoundingClientRect();
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
}

function fitMapToViewport() {
  const stage = document.getElementById('map-stage');
  const stageWidth = stage.offsetWidth;
  const stageHeight = stage.offsetHeight;
  if (!stageWidth || !stageHeight) return;
  const fitted = fitStageInViewport({
    stageWidth,
    stageHeight,
    viewportWidth: mapStageWrap.clientWidth,
    viewportHeight: mapStageWrap.clientHeight,
    padding: 24
  });
  mapScale = fitted.scale;
  mapPan = fitted.pan;
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
let doodleTouchId = null;
const doodleCanvas = document.getElementById('doodle-canvas');
const doodleCtx = doodleCanvas.getContext('2d');

doodleCanvas.onmousedown = (e) => {
  if (e.button !== 0) return;
  startDoodle(getCanvasPos(e));
};
doodleCanvas.onmousemove = (e) => {
  continueDoodle(getCanvasPos(e));
};
document.addEventListener('mouseup', () => finishDoodle());

doodleCanvas.addEventListener('touchstart', event => {
  if (selectedTool !== 'doodle') return;
  if (event.touches.length !== 1) {
    cancelDoodle();
    return;
  }
  const touch = event.touches[0];
  event.preventDefault();
  if (startDoodle(getCanvasPos(touch))) doodleTouchId = touch.identifier;
}, { passive: false });
doodleCanvas.addEventListener('touchmove', event => {
  if (!isDrawing || doodleTouchId === null) return;
  if (event.touches.length !== 1) {
    cancelDoodle();
    return;
  }
  const touch = Array.from(event.touches).find(entry => entry.identifier === doodleTouchId);
  if (!touch) return;
  event.preventDefault();
  continueDoodle(getCanvasPos(touch));
}, { passive: false });
doodleCanvas.addEventListener('touchend', event => {
  if (!isDrawing || doodleTouchId === null) return;
  const touch = Array.from(event.changedTouches).find(entry => entry.identifier === doodleTouchId);
  if (!touch) return;
  event.preventDefault();
  continueDoodle(getCanvasPos(touch));
  finishDoodle();
}, { passive: false });
doodleCanvas.addEventListener('touchcancel', event => {
  if (doodleTouchId === null) return;
  const cancelled = Array.from(event.changedTouches).some(entry => entry.identifier === doodleTouchId);
  if (cancelled) cancelDoodle();
}, { passive: false });

function startDoodle(point) {
  if (selectedTool !== 'doodle' || !canDoodle()) return false;
  isDrawing = true;
  currentPath = {
    id: 'd' + Date.now(),
    color: document.getElementById('doodle-color').value,
    width: 3,
    points: [point]
  };
  return true;
}

function continueDoodle(point) {
  if (!isDrawing || !currentPath) return;
  const previous = currentPath.points[currentPath.points.length - 1];
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.25) return;
  currentPath.points.push(point);
  drawDoodlePath(currentPath, true);
}

function finishDoodle() {
  if (isDrawing && currentPath && currentPath.points.length > 1) {
    socket.emit('scene:doodle:add', currentPath);
  }
  isDrawing = false;
  currentPath = null;
  doodleTouchId = null;
}

function cancelDoodle() {
  if (!isDrawing && doodleTouchId === null) return;
  isDrawing = false;
  currentPath = null;
  doodleTouchId = null;
  if (state?.scene) redrawAllDoodles();
}

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

function renderFog() {
  const canvas = document.getElementById('fog-canvas');
  if (!canvas || !state) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.classList.toggle('active', !!state.scene.fogEnabled);
  if (!state.scene.fogEnabled || !canvas.width || !canvas.height) return;
  const fogColor = myRole === 'dm' ? 'rgba(25, 32, 25, .52)' : 'rgb(18, 23, 19)';
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = fogColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  (state.scene.fogShapes || []).forEach(shape => {
    if (shape.mode === 'reveal') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = fogColor;
    }
    ctx.fillRect(Number(shape.x) || 0, Number(shape.y) || 0, Number(shape.width) || 0, Number(shape.height) || 0);
  });
  ctx.globalCompositeOperation = 'source-over';
}

function renderSharedPointer({ id, name, color, x, y } = {}) {
  if (!id || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
  let pointer = findSharedPointer(id);
  if (!pointer) {
    pointer = document.createElement('div');
    pointer.className = 'shared-pointer';
    pointer.dataset.pointerId = id;
    const dot = document.createElement('span');
    dot.className = 'shared-pointer-dot';
    const label = document.createElement('span');
    label.className = 'shared-pointer-label';
    pointer.append(dot, label);
    document.getElementById('map-stage').appendChild(pointer);
  }
  pointer.style.left = `${Number(x)}px`;
  pointer.style.top = `${Number(y)}px`;
  pointer.style.setProperty('--pointer-color', color || '#d98a9e');
  pointer.querySelector('.shared-pointer-label').textContent = name || 'Player';
  pointer.classList.remove('fading');
  clearTimeout(pointerFadeTimers.get(id));
  pointerFadeTimers.set(id, setTimeout(() => pointer.classList.add('fading'), 1200));
}

function removeSharedPointer(id) {
  if (!id) return;
  const pointer = findSharedPointer(id);
  if (pointer) pointer.remove();
  clearTimeout(pointerFadeTimers.get(id));
  pointerFadeTimers.delete(id);
}

function findSharedPointer(id) {
  return [...document.querySelectorAll('.shared-pointer')]
    .find(pointer => pointer.dataset.pointerId === String(id));
}

function renderSharedPing({ name, color, x, y } = {}) {
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
  const ping = document.createElement('div');
  ping.className = 'shared-ping';
  ping.style.left = `${Number(x)}px`;
  ping.style.top = `${Number(y)}px`;
  ping.style.setProperty('--pointer-color', color || '#d98a9e');
  const label = document.createElement('span');
  label.textContent = name || 'Player';
  ping.appendChild(label);
  document.getElementById('map-stage').appendChild(ping);
  setTimeout(() => ping.remove(), 1500);
}

// ---- Named scene library ----
function savedSceneList() {
  return Array.isArray(state?.savedScenes) ? state.savedScenes : [];
}

function renderSavedScenes() {
  if (!state) return;
  document.getElementById('current-scene-name').textContent = state.activeSceneName || 'Unsaved scene';
  const dirtyIndicator = document.getElementById('scene-dirty-indicator');
  dirtyIndicator.classList.toggle('hidden', !state.sceneDirty);
  dirtyIndicator.textContent = state.activeSceneName ? 'Unsaved changes' : 'Not saved yet';
  const select = document.getElementById('saved-scene-select');
  const previous = select.value;
  select.innerHTML = '<option value="">Choose a saved scene…</option>';
  savedSceneList().forEach(scene => {
    const option = document.createElement('option');
    option.value = scene.name;
    option.textContent = `${scene.name} · ${scene.tokenCount} token${scene.tokenCount === 1 ? '' : 's'}`;
    select.appendChild(option);
  });
  if (savedSceneList().some(scene => scene.name === previous)) select.value = previous;
  updateSelectedSceneSummary();
}

function updateSelectedSceneSummary() {
  const selected = savedSceneList().find(scene => scene.name === document.getElementById('saved-scene-select').value);
  const summary = document.getElementById('scene-summary');
  if (!selected) {
    summary.textContent = 'Maps, drawings, tokens and initiative are saved together.';
    return;
  }
  summary.textContent = `${selected.mapName} · ${selected.tokenCount} token${selected.tokenCount === 1 ? '' : 's'} · saved ${new Date(selected.savedAt).toLocaleString()}`;
}

document.getElementById('saved-scene-select').onchange = () => {
  const selected = document.getElementById('saved-scene-select').value;
  if (selected) document.getElementById('scene-name-input').value = selected;
  updateSelectedSceneSummary();
};
document.getElementById('save-scene-btn').onclick = () => {
  const name = document.getElementById('scene-name-input').value.trim();
  if (!name) return showToast('Give the scene a name first.');
  const exists = savedSceneList().some(scene => scene.name.toLowerCase() === name.toLowerCase());
  if (exists && !confirm(`Overwrite the saved scene “${name}” with the current setup?`)) return;
  socket.emit('scene:save', { name });
};
document.getElementById('load-scene-btn').onclick = () => {
  const name = document.getElementById('saved-scene-select').value;
  if (!name) return showToast('Choose a saved scene first.');
  if (confirm(`Load “${name}”? Unsaved changes to the current scene will be replaced.`)) socket.emit('scene:load', { name });
};
document.getElementById('delete-scene-btn').onclick = () => {
  const name = document.getElementById('saved-scene-select').value;
  if (!name) return showToast('Choose a saved scene first.');
  if (confirm(`Delete the saved scene “${name}”?`)) socket.emit('scene:delete', { name });
};

// ---- Token and NPC creation ----
document.getElementById('token-kind').onchange = updateTokenCreateForm;
document.getElementById('cancel-npc-edit-btn').onclick = resetNpcEditor;

function updateTokenCreateForm() {
  const kind = document.getElementById('token-kind').value;
  document.getElementById('npc-create-fields').classList.toggle('hidden', kind !== 'npc');
  if (!editingNpcId) document.getElementById('add-token-btn').textContent = kind === 'npc' ? 'Create NPC & place' : 'Add to map';
}

function parseNpcAttacks(text) {
  return String(text || '').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [name = '', bonus = '', damage = ''] = line.split('|').map(part => part.trim());
    return { name, bonus, damage };
  }).filter(attack => attack.name);
}

function npcAttacksText(attacks) {
  return (attacks || []).map(attack => [attack.name, attack.bonus, attack.damage].join(' | ')).join('\n');
}

document.getElementById('add-token-btn').onclick = async () => {
  const name = document.getElementById('token-name').value.trim();
  if (!name) return showToast('Give the token a name first.');
  const kind = document.getElementById('token-kind').value;
  const file = document.getElementById('token-image').files[0];
  let imageUrl;
  if (file) imageUrl = await uploadFile(file);

  if (editingNpcId) {
    socket.emit('npc:update', {
      id: editingNpcId,
      name,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      hp: Number(document.getElementById('npc-hp').value) || 1,
      maxHp: Number(document.getElementById('npc-hp').value) || 1,
      ac: Number(document.getElementById('npc-ac').value) || 0,
      initiativeModifier: Number(document.getElementById('npc-initiative').value) || 0,
      attacks: parseNpcAttacks(document.getElementById('npc-attacks').value),
      notes: document.getElementById('npc-notes').value.trim()
    });
    return;
  }

  socket.emit('token:add', {
    label: name,
    kind,
    imageUrl: imageUrl || null,
    hp: kind === 'npc' ? Number(document.getElementById('npc-hp').value) || 1 : undefined,
    maxHp: kind === 'npc' ? Number(document.getElementById('npc-hp').value) || 1 : undefined,
    ac: Number(document.getElementById('npc-ac').value) || 0,
    initiativeModifier: Number(document.getElementById('npc-initiative').value) || 0,
    attacks: parseNpcAttacks(document.getElementById('npc-attacks').value),
    notes: document.getElementById('npc-notes').value.trim()
  });
  resetNpcEditor();
};

function editNpc(npcId) {
  const npc = state.npcs?.[npcId];
  if (!npc) return;
  editingNpcId = npcId;
  document.getElementById('token-kind').value = 'npc';
  document.getElementById('token-kind').disabled = true;
  document.getElementById('token-name').value = npc.name;
  document.getElementById('npc-hp').value = Number(npc.maxHp) || 1;
  document.getElementById('npc-ac').value = Number(npc.ac) || 0;
  document.getElementById('npc-initiative').value = Number(npc.initiativeModifier) || 0;
  document.getElementById('npc-attacks').value = npcAttacksText(npc.attacks);
  document.getElementById('npc-notes').value = npc.notes || '';
  document.getElementById('add-token-btn').textContent = 'Save NPC changes';
  document.getElementById('cancel-npc-edit-btn').classList.remove('hidden');
  updateTokenCreateForm();
  document.getElementById('token-name').focus();
}

function resetNpcEditor() {
  editingNpcId = null;
  document.getElementById('token-kind').disabled = false;
  document.getElementById('token-name').value = '';
  document.getElementById('token-image').value = '';
  document.getElementById('npc-hp').value = 10;
  document.getElementById('npc-ac').value = 10;
  document.getElementById('npc-initiative').value = 0;
  document.getElementById('npc-attacks').value = '';
  document.getElementById('npc-notes').value = '';
  document.getElementById('cancel-npc-edit-btn').classList.add('hidden');
  updateTokenCreateForm();
}

function renderTokenTray() {
  const list = document.getElementById('token-list');
  list.innerHTML = '';
  state.tokens.forEach(t => {
    if (myRole === 'player' && t.visibleToPlayers === false) return;
    const entry = document.createElement('article');
    entry.className = 'token-list-entry';
    const chip = document.createElement('div');
    chip.className = 'token-chip kind-' + t.kind;
    if (!t.canControl) chip.classList.add('locked-token');
    const displayLabel = visibleTokenLabel(t) || `${t.kind} token`;
    chip.title = t.canControl ? `${displayLabel} (click to nudge on the map)` : `${displayLabel} (controlled by another player)`;
    if (t.visibleToPlayers === false) chip.classList.add('hidden-token');
    chip.innerHTML = (t.imageUrl ? `<img src="${escapeAttr(t.imageUrl)}" alt="${escapeAttr(displayLabel)}">` : emojiFor(t.kind)) +
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
    const details = document.createElement('div');
    details.className = 'token-list-details dm-only';
    const scalePercent = Math.round((Number(t.sizeScale) || 1) * 100);
    details.innerHTML = `
      <div class="token-list-heading"><strong>${escapeHtml(t.label)}</strong><span>${escapeHtml(t.kind)}</span></div>
      <label class="token-size-control">Size <input type="range" min="35" max="300" step="5" value="${scalePercent}"><output>${scalePercent}%</output></label>
      <div class="token-list-actions">
        <button class="btn-ghost token-reset-size" type="button">Reset size</button>
        <button class="btn-ghost token-visibility" type="button">${t.visibleToPlayers === false ? 'Show' : 'Hide'}</button>
        <button class="btn-ghost token-duplicate" type="button">Duplicate</button>
        <button class="btn-danger-soft token-remove" type="button">Remove</button>
      </div>
    `;
    const sizeInput = details.querySelector('input[type="range"]');
    const sizeOutput = details.querySelector('output');
    sizeInput.oninput = () => { sizeOutput.textContent = `${sizeInput.value}%`; };
    sizeInput.onchange = () => socket.emit('token:update', { id: t.id, sizeScale: Number(sizeInput.value) / 100 });
    details.querySelector('.token-reset-size').onclick = () => socket.emit('token:update', { id: t.id, sizeScale: 1 });
    details.querySelector('.token-visibility').onclick = () => socket.emit('token:update', { id: t.id, visibleToPlayers: t.visibleToPlayers === false });
    details.querySelector('.token-duplicate').onclick = () => socket.emit('token:duplicate', { id: t.id });
    details.querySelector('.token-remove').onclick = () => socket.emit('token:remove', { id: t.id });
    entry.append(chip, details);
    list.appendChild(entry);
  });
  renderDmSidebarSummary();
}

document.getElementById('toggle-dm-sidebar-btn').onclick = () => {
  const sidebar = document.getElementById('map-sidebar');
  const expanded = sidebar.classList.toggle('dm-detailed');
  const button = document.getElementById('toggle-dm-sidebar-btn');
  button.textContent = expanded ? 'Compact' : 'Details';
  button.setAttribute('aria-expanded', String(expanded));
};

// ---- Sidebar accordion state (remembered per-browser) ----
document.querySelectorAll('.sidebar-accordion').forEach(details => {
  const key = `humblewood:accordion:${details.id}`;
  const saved = localStorage.getItem(key);
  if (saved !== null) details.open = saved === '1';
  details.addEventListener('toggle', () => {
    localStorage.setItem(key, details.open ? '1' : '0');
  });
});

function renderDmSidebarSummary() {
  const summary = document.getElementById('dm-sidebar-summary');
  if (!summary || !state) return;
  const tokens = state.tokens || [];
  const counts = { pc: 0, npc: 0, item: 0 };
  tokens.forEach(token => { if (counts[token.kind] !== undefined) counts[token.kind] += 1; });
  if (!tokens.length) {
    summary.textContent = 'No tokens on the map.';
    return;
  }
  const parts = [
    counts.pc ? `${counts.pc} player${counts.pc === 1 ? '' : 's'}` : '',
    counts.npc ? `${counts.npc} NPC${counts.npc === 1 ? '' : 's'}` : '',
    counts.item ? `${counts.item} item${counts.item === 1 ? '' : 's'}` : ''
  ].filter(Boolean);
  summary.textContent = parts.join(' · ');
}

function renderNpcRoster() {
  const roster = document.getElementById('npc-roster');
  if (!roster || !state) return;
  roster.innerHTML = '';
  const npcs = Object.values(state.npcs || {}).sort((a, b) => a.name.localeCompare(b.name));
  if (!npcs.length) {
    roster.innerHTML = '<p class="player-sidebar-empty">No NPCs created yet.</p>';
    return;
  }
  npcs.forEach(npc => {
    const token = state.tokens.find(entry => entry.npcId === npc.id);
    const card = document.createElement('article');
    card.className = 'npc-roster-card';
    card.innerHTML = `
      <div class="npc-roster-top">
        <span class="npc-roster-name">${escapeHtml(npc.name)}</span>
        <span class="npc-map-status ${token ? 'on-map' : ''}">${token ? 'On map' : 'Off map'}</span>
      </div>
      <div class="npc-roster-stats">HP ${Number(token?.hp ?? npc.hp) || 0}/${Number(npc.maxHp) || 0} · AC ${Number(npc.ac) || 0} · Init ${signed(npc.initiativeModifier)}</div>
      <div class="npc-roster-actions">
        <button class="btn-ghost npc-map-btn" type="button">${token ? 'Remove' : 'Place'}</button>
        <button class="btn-ghost npc-combat-btn" type="button" ${token ? '' : 'disabled'}>⚔ Combat</button>
        <button class="btn-ghost npc-edit-btn" type="button">Edit</button>
        <button class="btn-danger-soft npc-delete-btn" type="button">Delete</button>
      </div>
    `;
    card.querySelector('.npc-map-btn').onclick = () => {
      if (token) socket.emit('token:remove', { id: token.id });
      else socket.emit('npc:place', { id: npc.id });
    };
    card.querySelector('.npc-combat-btn').onclick = () => token && openNpcCombatManager(token.id);
    card.querySelector('.npc-edit-btn').onclick = () => editNpc(npc.id);
    card.querySelector('.npc-delete-btn').onclick = () => {
      if (confirm(`Permanently delete ${npc.name}? It will also be removed from every saved scene.`)) socket.emit('npc:delete', { id: npc.id });
    };
    roster.appendChild(card);
  });
}

function renderPlayerSidebar() {
  const container = document.getElementById('player-character-summary');
  if (!container || !state) return;
  container.innerHTML = '';
  const characters = Object.values(state.characters || {}).filter(character => character.canManage);
  if (!characters.length) {
    container.innerHTML = '<p class="player-sidebar-empty">No character is linked to your account yet. Ask the DM to set your player name or claim your character from the Characters tab.</p>';
    return;
  }
  characters.forEach(character => {
    const species = character.species || character.race || '';
    const charClass = character.charClass || character.className || '';
    const skilled = Object.keys(SKILL_ABILITIES)
      .filter(skill => character.skills?.[skill]?.proficient || character.fields?.[`skill-${skill}-prof`])
      .slice(0, 5)
      .map(skill => `${SKILL_LABELS[skill]} ${signed(characterSkillModifier(character, skill))}`);
    const card = document.createElement('article');
    card.className = 'player-sidebar-card';
    card.innerHTML = `
      <div class="player-sidebar-head">
        <div class="player-sidebar-portrait">${character.portraitUrl ? `<img src="${escapeAttr(character.portraitUrl)}" alt="">` : '🍃'}</div>
        <div><strong>${escapeHtml(character.name)}</strong><div class="player-sidebar-meta">${escapeHtml([species, charClass].filter(Boolean).join(' · '))} · Level ${Number(character.level) || 1}</div></div>
      </div>
      <div class="player-sidebar-vitals">
        <span>HP ${Number(character.hp) || 0}/${Number(character.maxHp) || 0}</span>
        <span>AC ${Number(character.ac) || 0}</span>
      </div>
      <div class="player-sidebar-skills"><strong>Best skills:</strong> ${skilled.length ? escapeHtml(skilled.join(' · ')) : 'No proficiencies marked yet'}</div>
      <div class="player-sidebar-actions">
        <button class="btn-ghost open-sheet" type="button">Sheet</button>
        <button class="btn-ghost open-rolls" type="button">🎲 Roll</button>
        <button class="btn-ghost open-combat" type="button">⚔ Fight</button>
      </div>
    `;
    card.querySelector('.open-sheet').onclick = () => { switchView('characters'); openSheetEditor(character); };
    card.querySelector('.open-rolls').onclick = () => openCharacterRoller(character.name);
    card.querySelector('.open-combat').onclick = () => openCombatManager(character.name);
    container.appendChild(card);
  });
}

// ================= CHARACTERS =================
function replaceSelectOptions(select, options, placeholder, selected = '') {
  select.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = placeholder;
  select.appendChild(empty);
  options.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  const canonicalSelected = options.find(value => value.toLowerCase() === String(selected || '').trim().toLowerCase()) || '';
  select.value = canonicalSelected;
}

function updateSubraceOptions(selected = '') {
  const species = characterRules.canonicalSpecies(document.getElementById('sf-species').value);
  const select = document.getElementById('sf-subrace');
  const options = characterRules.subracesFor(species);
  const placeholder = !species ? 'Choose a species first...' : options.length ? 'Choose a subrace...' : 'This species has no subrace';
  replaceSelectOptions(select, options, placeholder, selected);
  select.disabled = !species || !options.length || !editingCanEdit;
}

function updateSubclassOptions(selected = '') {
  const className = characterRules.canonicalClass(document.getElementById('sf-class').value);
  const select = document.getElementById('sf-subclass');
  const options = characterRules.subclassesFor(className);
  replaceSelectOptions(select, options, className ? 'Choose a subclass...' : 'Choose a class first...', selected);
  select.disabled = !className || !options.length || !editingCanEdit;
}

function setCharacterRuleSelections(fields = {}) {
  document.getElementById('sf-species').value = characterRules.canonicalSpecies(fields.species) || '';
  updateSubraceOptions(fields.subrace);
  document.getElementById('sf-class').value = characterRules.canonicalClass(fields.class) || '';
  updateSubclassOptions(fields.subclass);
}

function initializeCharacterRuleControls() {
  replaceSelectOptions(document.getElementById('sf-species'), Object.keys(characterRules.SPECIES_SUBRACES), 'Choose a species...');
  replaceSelectOptions(document.getElementById('sf-class'), Object.keys(characterRules.CLASS_SUBCLASSES), 'Choose a class...');
  updateSubraceOptions();
  updateSubclassOptions();
  document.getElementById('sf-species').addEventListener('change', () => updateSubraceOptions());
  document.getElementById('sf-class').addEventListener('change', () => updateSubclassOptions());
}

function initializeFeatPresetControls() {
  const select = document.getElementById('feat-preset-select');
  HUMBLEWOOD_FEAT_PRESETS.forEach(feat => {
    const option = document.createElement('option');
    option.value = feat.title;
    const prerequisite = feat.facts?.find(([label]) => label === 'Prerequisite')?.[1];
    option.textContent = prerequisite ? `${feat.title} · requires ${prerequisite}` : feat.title;
    select.appendChild(option);
  });
  document.getElementById('feat-preset-add').addEventListener('click', addFeatPresetToSheet);
}

function addFeatPresetToSheet() {
  const select = document.getElementById('feat-preset-select');
  const feat = HUMBLEWOOD_FEAT_PRESETS.find(entry => entry.title === select.value);
  if (!feat) return showToast('Choose a Humblewood feat first.');
  const prerequisite = feat.facts?.find(([label]) => label === 'Prerequisite')?.[1] || '';
  const species = characterRules.canonicalSpecies(document.getElementById('sf-species').value);
  if (/glide trait/i.test(prerequisite) && !/\(birdfolk\)$/i.test(species)) {
    return showToast(`${feat.title} requires the Glide trait. Choose a birdfolk species first.`);
  }

  const textarea = document.getElementById('sf-feats');
  if (new RegExp(`(^|\\n)${feat.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\n|$)`, 'i').test(textarea.value.trim())) {
    return showToast(`${feat.title} is already on this character.`);
  }

  const details = [];
  (feat.facts || []).forEach(([label, value]) => details.push(`${label}: ${value}`));
  (feat.sections || []).forEach(section => {
    if (section.text) details.push(`${section.heading}: ${section.text}`);
    (section.items || []).forEach(item => details.push(`• ${item}`));
  });
  const block = [feat.title, ...details].join('\n');
  textarea.value = [textarea.value.trim(), block].filter(Boolean).join('\n\n');
  select.value = '';
  textarea.focus();
  showToast(`${feat.title} added.`);
}

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
        ${myRole === 'dm' ? '<button type="button" class="btn-ghost initiative-character-btn">🎲 Initiative</button>' : ''}
        ${canEdit ? '<button type="button" class="btn-ghost combat-character-btn">⚔ Combat</button>' : ''}
        ${canEdit ? `<button type="button" class="btn-ghost map-character-btn">${mapToken ? 'Remove from map' : 'Put on map'}</button>` : ''}
        ${myRole === 'player' && canEdit && !c.claimed ? '<button type="button" class="btn-ghost claim-character-btn">Claim character</button>' : ''}
        ${myRole === 'dm' && c.claimed ? '<button type="button" class="btn-ghost release-character-btn">Release owner</button>' : ''}
      </div>
    `;
    card.querySelector('.view-character-btn').onclick = () => openSheetEditor(c);
    card.querySelector('.roll-character-btn')?.addEventListener('click', () => openCharacterRoller(c.name));
    card.querySelector('.initiative-character-btn')?.addEventListener('click', () => rollCharacterInitiative(c, 'normal'));
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
  setCharacterRuleSelections(fields);
  editingInventory = normalizeInventory(c?.inventory);
  renderInventoryEditor();
  editingSpells = normalizeSpellList(fields['spell-list']);
  if (!editingSpells.length) editingSpells = migrateLegacySpellText(fields);
  editingSpellId = null;
  document.getElementById('spell-add-form').classList.add('hidden');
  renderSpellListEditor();
  renderPortraitPreview(editingPortraitUrl);
  refreshCharacterCalculations(!c, !c);
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
  updateSubraceOptions(document.getElementById('sf-subrace').value);
  updateSubclassOptions(document.getElementById('sf-subclass').value);
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

// ---- Spell list editor ----
const SPELL_LEVEL_NAMES = ['Cantrip', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Level 9'];
const HUMBLEWOOD_SPELL_PRESETS = [
  {
    name: 'Ambush Prey', level: 2, school: 'Illusion', range: 'Self', castingTime: '1 action',
    duration: '1 hour', components: 'S, M (a broken twig)', attack: 'First attack against an unaware target',
    damage: '+1d6', source: 'Humblewood',
    effect: 'Become invisible while you remain within 5 feet of where you cast the spell. Your first attack against a target unaware of you deals extra damage and ends the spell. The bonus damage rises by 1d6 per slot level above 2nd.'
  },
  {
    name: 'Elevated Sight', level: 1, school: 'Divination', range: 'Self', castingTime: '1 action',
    duration: 'Concentration, up to 1 minute', components: 'V, S', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'See through a movable invisible sensor up to 120 feet above you with a 360-degree view. You are blind while looking through the sensor.'
  },
  {
    name: 'Feathered Reach', level: 3, school: 'Transmutation', range: 'Self', castingTime: '1 action',
    duration: '1 minute', components: 'S, M (a small feather)', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'Your arms become wings. You gain bonus-action flight up to twice your speed but must land, an upward boost, reaction gliding, and improved jumping. Your hands must be free of shields and heavy weapons, and you cannot be encumbered.'
  },
  {
    name: 'Globe of Twilight', level: 3, school: 'Conjuration', range: 'Self (15-foot radius, 15 feet high)', castingTime: '1 action',
    duration: 'Concentration, up to 10 minutes', components: 'V, S, M (pitch and glittering sand)', attack: 'Wisdom save', damage: '', source: 'Humblewood',
    effect: 'Create a lightly obscured twilight sphere. Chosen creatures can hide and have advantage on Stealth. Other creatures have disadvantage on Perception and can be blinded until the end of their turn on a failed save.'
  },
  {
    name: 'Gust Barrier', level: 0, school: 'Evocation', range: 'Self', castingTime: '1 action',
    duration: '1 round', components: 'S', attack: 'Constitution save after a melee hit', damage: '', source: 'Humblewood',
    effect: 'Ranged attacks against you have disadvantage until the end of your next turn. A melee attacker that hits must save or be pushed up to 10 feet away and knocked prone.'
  },
  {
    name: 'Invoke the Amaranthine', level: 3, school: 'Divination', range: 'Self; affects a visible creature within 60 feet', castingTime: '10 minutes',
    duration: '24 hours', components: 'V, S, M (a holy symbol of the Amaranthine)', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'Roll and record two d20s, assigning each to attacks, checks, or saves. For 24 hours, use a reaction to replace a matching roll made by a visible ally or enemy within 60 feet before the outcome is known.'
  },
  {
    name: 'Shape Plants', level: 4, school: 'Transmutation', range: 'Touch', castingTime: '1 action',
    duration: 'Instantaneous; shaped form normally lasts 1 hour', components: 'V, S', attack: 'None', damage: '2d4 piercing per 5 feet moved', source: 'Humblewood',
    effect: 'Reshape plant life in a 5-foot cube. Brambles or thorny plants can become damaging difficult terrain. A plant may agree to keep the new form; the affected cube grows by 5 feet per slot level above 4th.'
  },
  {
    name: 'Spiny Shield', level: 1, school: 'Abjuration', range: 'Self', castingTime: '1 reaction',
    duration: '1 round', components: 'V, S, M (a small quill)', attack: 'Triggers when hit by a melee attack', damage: '2d4 piercing', source: 'Humblewood',
    effect: 'Reduce the triggering melee damage by 2d4 and deal the same amount to the attacker. The barrier also grants +2 AC against ranged attacks. Both dice effects rise by 1d4 per slot level above 1st.'
  },
  {
    name: 'Stellar Bodies', level: 4, school: 'Evocation', range: 'Special; star attack reaches 120 feet', castingTime: '1 action',
    duration: '1 minute', components: 'V, S', attack: 'Ranged spell attack; Wisdom and Constitution saves', damage: '4d8 radiant', source: 'Humblewood',
    effect: 'Create two orbiting stars. Nearby melee attackers can take 1d8 radiant damage per star on a failed Wisdom save. Once per round, expend a star as a ranged spell attack; on a hit the target takes damage and can be blinded on a failed Constitution save.'
  },
  {
    name: 'Veil of Dusk', level: 1, school: 'Abjuration', range: '60 feet', castingTime: '1 bonus action',
    duration: 'Concentration, up to 10 minutes', components: 'V, S, M (a pinch of soot)', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'Cloak one creature in shadow and silence. The target gains +1 AC and has advantage on Stealth checks for the duration.'
  }
];

function normalizeSpell(spell, index = 0) {
  if (!spell || typeof spell !== 'object') return null;
  const name = String(spell.name || '').trim();
  if (!name) return null;
  return {
    id: String(spell.id || `spell-normalized-${index}`),
    name,
    level: Math.max(0, Math.min(9, Number(spell.level) || 0)),
    school: String(spell.school || '').trim(),
    range: String(spell.range || '').trim(),
    castingTime: String(spell.castingTime || '').trim(),
    duration: String(spell.duration || '').trim(),
    components: String(spell.components || '').trim(),
    attack: String(spell.attack || '').trim(),
    damage: String(spell.damage || '').trim(),
    effect: String(spell.effect ?? spell.description ?? '').trim(),
    source: String(spell.source || '').trim()
  };
}

function normalizeSpellList(raw) {
  let list = Array.isArray(raw) ? raw : null;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch (err) { /* not JSON, treated as empty — legacy text lives in spells-N fields */ }
  }
  return (list || []).map(normalizeSpell).filter(Boolean);
}

function migrateLegacySpellText(fields) {
  const migrated = [];
  for (let level = 0; level <= 9; level += 1) {
    const text = String(fields?.[`spells-${level}`] || '').trim();
    if (!text) continue;
    text.split(/\n|;/).flatMap(line => {
      const trimmed = line.trim();
      return trimmed.includes(',') && !/\d+d\d+/i.test(trimmed) ? trimmed.split(',') : [trimmed];
    }).map(name => name.trim()).filter(Boolean).forEach(name => {
      migrated.push(normalizeSpell({ id: `spell-migrated-${level}-${migrated.length}`, name, level }, migrated.length));
    });
  }
  return migrated;
}

function syncSpellListField() {
  document.getElementById('sf-spell-list').value = JSON.stringify(editingSpells);
}

function renderSpellListEditor() {
  const container = document.getElementById('spell-list');
  container.innerHTML = '';
  if (!editingSpells.length) {
    container.innerHTML = '<p class="sidebar-help">No spells added yet.</p>';
    syncSpellListField();
    return;
  }
  const byLevel = new Map();
  editingSpells.forEach(spell => {
    const level = Math.max(0, Math.min(9, Number(spell.level) || 0));
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push(spell);
  });
  [...byLevel.keys()].sort((a, b) => a - b).forEach(level => {
    const group = document.createElement('div');
    group.className = 'spell-level-group';
    const title = document.createElement('div');
    title.className = 'spell-level-group-title';
    title.textContent = SPELL_LEVEL_NAMES[level];
    group.appendChild(title);
    byLevel.get(level).forEach(spell => {
      const row = document.createElement('div');
      row.className = 'spell-list-item';
      const main = document.createElement('div');
      main.className = 'spell-list-item-main';
      const name = document.createElement('div');
      name.className = 'spell-list-item-name';
      name.textContent = spell.name;
      if (spell.source) {
        const source = document.createElement('span');
        source.className = 'spell-source-badge';
        source.textContent = spell.source;
        name.appendChild(source);
      }
      main.appendChild(name);
      const metadata = [
        spell.school,
        spell.range ? `Range: ${spell.range}` : '',
        spell.attack && !/^none$/i.test(spell.attack) ? `Attack/save: ${spell.attack}` : '',
        spell.damage ? `Damage: ${spell.damage}` : ''
      ].filter(Boolean);
      if (metadata.length) {
        const meta = document.createElement('div');
        meta.className = 'spell-list-item-meta';
        metadata.forEach(value => {
          const item = document.createElement('span');
          item.textContent = value;
          meta.appendChild(item);
        });
        main.appendChild(meta);
      }
      if (spell.effect) {
        const desc = document.createElement('div');
        desc.className = 'spell-list-item-desc';
        desc.textContent = spell.effect;
        main.appendChild(desc);
      }
      row.appendChild(main);
      const actions = document.createElement('div');
      actions.className = 'spell-list-item-actions';
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'edit'; edit.textContent = '✎'; edit.title = 'Edit spell';
      edit.disabled = !editingCanEdit;
      edit.onclick = () => openSpellForm(spell);
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'del'; del.textContent = '×'; del.title = 'Remove spell';
      del.disabled = !editingCanEdit;
      del.onclick = () => {
        editingSpells = editingSpells.filter(entry => entry.id !== spell.id);
        renderSpellListEditor();
      };
      actions.append(edit, del);
      row.appendChild(actions);
      group.appendChild(row);
    });
    container.appendChild(group);
  });
  syncSpellListField();
}

function populateSpellForm(spell = {}) {
  const form = document.getElementById('spell-add-form');
  const normalized = normalizeSpell({ name: spell.name || ' ', ...spell }) || {};
  form.dataset.spellSource = normalized.source || '';
  document.getElementById('spell-form-name').value = spell.name || '';
  document.getElementById('spell-form-level').value = normalized.level ?? '0';
  document.getElementById('spell-form-school').value = normalized.school || '';
  document.getElementById('spell-form-range').value = normalized.range || '';
  document.getElementById('spell-form-casting-time').value = normalized.castingTime || '';
  document.getElementById('spell-form-duration').value = normalized.duration || '';
  document.getElementById('spell-form-components').value = normalized.components || '';
  document.getElementById('spell-form-attack').value = normalized.attack || '';
  document.getElementById('spell-form-damage').value = normalized.damage || '';
  document.getElementById('spell-form-effect').value = normalized.effect || '';
}

function openSpellForm(spell) {
  const form = document.getElementById('spell-add-form');
  form.classList.remove('hidden');
  editingSpellId = spell ? spell.id : null;
  document.getElementById('spell-preset-select').value = '';
  populateSpellForm(spell || {});
  document.getElementById('spell-form-name').focus();
}

const spellPresetSelect = document.getElementById('spell-preset-select');
HUMBLEWOOD_SPELL_PRESETS
  .slice()
  .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  .forEach(spell => {
    const option = document.createElement('option');
    option.value = spell.name;
    option.textContent = `${SPELL_LEVEL_NAMES[spell.level]} · ${spell.name}`;
    spellPresetSelect.appendChild(option);
  });

document.getElementById('spell-preset-load').onclick = () => {
  const preset = HUMBLEWOOD_SPELL_PRESETS.find(spell => spell.name === spellPresetSelect.value);
  if (!preset) return showToast('Choose a Humblewood spell first.');
  populateSpellForm(preset);
};

document.getElementById('spell-add-btn').onclick = () => openSpellForm(null);
document.getElementById('spell-form-cancel').onclick = () => {
  document.getElementById('spell-add-form').classList.add('hidden');
  editingSpellId = null;
};
document.getElementById('spell-form-save').onclick = () => {
  const name = document.getElementById('spell-form-name').value.trim();
  if (!name) return alert('Give the spell a name first.');
  const spell = normalizeSpell({
    id: editingSpellId || `spell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    level: document.getElementById('spell-form-level').value,
    school: document.getElementById('spell-form-school').value,
    range: document.getElementById('spell-form-range').value,
    castingTime: document.getElementById('spell-form-casting-time').value,
    duration: document.getElementById('spell-form-duration').value,
    components: document.getElementById('spell-form-components').value,
    attack: document.getElementById('spell-form-attack').value,
    damage: document.getElementById('spell-form-damage').value,
    effect: document.getElementById('spell-form-effect').value,
    source: document.getElementById('spell-add-form').dataset.spellSource || ''
  });
  if (editingSpellId) {
    const index = editingSpells.findIndex(entry => entry.id === editingSpellId);
    if (index !== -1) editingSpells[index] = spell;
  } else {
    editingSpells.push(spell);
  }
  editingSpellId = null;
  document.getElementById('spell-add-form').classList.add('hidden');
  renderSpellListEditor();
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
  let fields = collectCharacterFields();
  const name = String(fields.name || '').trim();
  if (!name) return alert('Every character needs a name.');
  const constrainedCharacter = { fields };
  const validationError = characterRules.validatePlayerCharacter(constrainedCharacter);
  if (validationError) return alert(validationError);
  characterRules.applyPlayerCharacterConstraints(constrainedCharacter);
  fields = constrainedCharacter.fields;
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

function refreshCharacterCalculations(force, recalculateSpell = false) {
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
    const calculated = characterRules.spellcastingValues(
      document.getElementById(`sf-${spellAbility}`).value,
      level.value
    );
    const spellDc = document.getElementById('sf-spell-dc');
    const spellAttack = document.getElementById('sf-spell-attack');
    if (recalculateSpell || spellDc.value === '') spellDc.value = calculated.saveDc;
    if (recalculateSpell || spellAttack.value === '') spellAttack.value = calculated.attackBonus;
  }
}

ABILITIES.forEach(ability => document.getElementById(`sf-${ability}`).addEventListener('input', () => {
  const spellAbility = document.getElementById('sf-spell-ability').value.toLowerCase();
  refreshCharacterCalculations(true, ability === spellAbility);
}));
document.getElementById('sf-level').addEventListener('input', () => refreshCharacterCalculations(true, true));
document.getElementById('sf-initiative').addEventListener('input', () => { initiativeManuallyEdited = true; });
ABILITIES.forEach(ability => document.getElementById(`sf-save-${ability}-prof`).addEventListener('change', () => refreshCharacterCalculations(true)));
Object.keys(SKILL_ABILITIES).forEach(skill => document.getElementById(`sf-skill-${skill}-prof`).addEventListener('change', () => refreshCharacterCalculations(true)));
document.getElementById('sf-spell-ability').addEventListener('change', () => refreshCharacterCalculations(false, true));

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
  const showOutcome = entry.targetDc && !/\b(?:attack|damage)\b/i.test(entry.label || '');
  const outcome = showOutcome ? (entry.success ? ' — success' : ' — failed') : '';
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
        ${entry.targetDc && !/\b(?:attack|damage)\b/i.test(entry.label || '') ? `<span class="roll-outcome ${entry.success ? 'success' : 'failure'}">DC ${entry.targetDc} · ${entry.success ? 'Success' : 'Failure'}</span>` : ''}
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

function rollNpcD20(token, label, modifier, mode = 'normal', extra = {}) {
  rollDice(1, 20, modifier, {
    name: `${myName} as ${token.label}`,
    tokenId: token.id,
    label,
    mode,
    ...extra
  });
}

function rollNpcInitiative(token, mode = 'normal') {
  const modifier = Number(token.initiativeModifier) || 0;
  rollNpcD20(token, `${token.label} initiative`, modifier, mode, {
    initiativeName: token.label
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
  activeCombatTarget = { type: 'character', id: name };
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  renderCombatManager();
}

function openNpcCombatManager(id) {
  const token = state?.tokens?.find(entry => entry.id === id && entry.kind === 'npc');
  if (myRole !== 'dm' || !token) return showToast('Only the DM can manage NPC combat.');
  activeCombatTarget = { type: 'npc', id };
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  renderCombatManager();
}

function closeCombatManager() {
  activeCombatTarget = null;
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function combatAction(action, extra = {}) {
  if (!activeCombatTarget) return;
  if (action === 'condition:toggle') applyOptimisticConditionToggle(extra.condition);
  if (activeCombatTarget.type === 'npc') socket.emit('token:combat:update', { id: activeCombatTarget.id, action, ...extra });
  else socket.emit('character:combat:update', { name: activeCombatTarget.id, action, ...extra });
}

function activeCombatEntity() {
  if (!activeCombatTarget) return null;
  if (activeCombatTarget.type === 'npc') {
    const token = state?.tokens?.find(entry => entry.id === activeCombatTarget.id && entry.kind === 'npc');
    return token ? { type: 'npc', entity: token } : null;
  }
  const character = state?.characters?.[activeCombatTarget.id];
  return character ? { type: 'character', entity: character } : null;
}

function applyOptimisticConditionToggle(condition) {
  const target = activeCombatEntity();
  if (!target || !CONDITIONS.includes(condition)) return;
  const nextConditions = combatState.toggleCondition(target.entity, condition);

  if (target.type === 'npc') {
    const npc = state?.npcs?.[target.entity.npcId];
    if (npc) combatState.setConditions(npc, nextConditions);
  } else {
    state.tokens
      .filter(token => token.characterName === target.entity.name)
      .forEach(token => combatState.setConditionBadges(token, nextConditions));
  }

  renderCombatManager();
  renderMapTokens();
  renderTokenTray();
  renderCharacters();
  renderPlayerSidebar();
  renderNpcRoster();
  renderDmSidebarSummary();
}

function renderCombatManager() {
  const target = activeCombatEntity();
  if (!target) return closeCombatManager();
  const { type, entity } = target;
  const isNpc = type === 'npc';
  const name = isNpc ? entity.label : entity.name;
  const combat = entity.combat || { conditions: [], concentration: false, exhaustion: 0, deathSaves: {}, spellSlots: {} };
  document.getElementById('combat-kicker').textContent = isNpc ? 'NPC combat controls' : 'Character combat controls';
  document.getElementById('combat-title').textContent = name;
  const portrait = document.getElementById('combat-portrait');
  const portraitUrl = isNpc ? entity.imageUrl : entity.portraitUrl;
  portrait.innerHTML = portraitUrl ? `<img src="${escapeAttr(portraitUrl)}" alt="">` : (isNpc ? '🦊' : '🍃');
  document.getElementById('combat-hp').textContent = `${Number(entity.hp) || 0} / ${Number(entity.maxHp) || 0}`;
  document.getElementById('combat-temp-hp').textContent = Number(entity.tempHp) || 0;
  document.getElementById('combat-ac').textContent = Number(entity.ac) || 0;
  document.getElementById('combat-life-status').textContent = combat.dead ? 'Dead' : combat.stable ? 'Stable' : entity.hp <= 0 ? 'Down' : 'Ready';
  const notes = document.getElementById('combat-notes');
  notes.classList.toggle('hidden', !isNpc || !entity.notes);
  notes.textContent = isNpc ? (entity.notes || '') : '';
  document.getElementById('combat-death-section').classList.toggle('hidden', isNpc);
  document.getElementById('combat-spell-slots-section').classList.toggle('hidden', isNpc);
  document.getElementById('combat-long-rest-btn').textContent = isNpc ? 'Restore NPC' : 'Complete long rest';
  renderCombatRolls(entity, isNpc);
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

  const check = isNpc ? null : pendingConcentrationChecks.get(entity.name);
  const checkButton = document.getElementById('combat-concentration-roll');
  checkButton.classList.toggle('hidden', !check);
  if (check) checkButton.textContent = `Roll Constitution save · DC ${check.dc}`;
}

function renderCombatRolls(character, isNpc = false) {
  const mode = () => document.getElementById('combat-roll-mode').value;
  const initiativeButton = document.getElementById('combat-initiative-roll');
  const initiativeModifier = isNpc ? (Number(character.initiativeModifier) || 0) : characterInitiativeModifier(character);
  initiativeButton.textContent = `Initiative ${signed(initiativeModifier)}`;
  initiativeButton.onclick = () => isNpc ? rollNpcInitiative(character, mode()) : rollCharacterInitiative(character, mode());

  const spellAttackValue = isNpc ? null : (character.spellcasting?.attackBonus ?? character.fields?.['spell-attack']);
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
      row.appendChild(makeCombatRollButton(`Hit ${signed(modifier)}`, () => {
        if (isNpc) rollNpcD20(character, `${attack.name} attack`, modifier, mode());
        else rollCharacterD20(character, `${attack.name} attack`, modifier, { mode: mode() });
      }));
    }
    const damage = parseDiceExpression(attack.damage);
    if (damage) {
      row.appendChild(makeCombatRollButton(damage.expression, () => rollDice(damage.count, damage.sides, damage.modifier, {
        characterName: isNpc ? null : character.name,
        tokenId: isNpc ? character.id : null,
        label: `${attack.name} damage`
      }), true));
    }
    attacks.appendChild(row);
  });
  if (!attacks.children.length) attacks.innerHTML = '<p class="empty-roll-options">No attacks are configured.</p>';

  const spells = document.getElementById('combat-spells');
  spells.innerHTML = '';
  (isNpc ? [] : characterSpellEntries(character)).forEach(spell => {
    const row = document.createElement('div');
    row.className = 'combat-roll-row combat-spell-card';
    const info = document.createElement('div');
    info.className = 'combat-spell-info';
    const heading = document.createElement('div');
    heading.className = 'combat-spell-heading';
    const name = document.createElement('span');
    name.className = 'combat-roll-name';
    name.textContent = spell.name;
    const level = document.createElement('small');
    level.textContent = [spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`, spell.school, spell.source].filter(Boolean).join(' · ');
    heading.append(name, level);
    info.appendChild(heading);

    const metadata = [
      spell.castingTime ? `Cast: ${spell.castingTime}` : '',
      spell.range ? `Range: ${spell.range}` : '',
      spell.duration ? `Duration: ${spell.duration}` : '',
      spell.attack && !/^none$/i.test(spell.attack) ? `Attack/save: ${spell.attack}` : '',
      spell.damage ? `Damage: ${spell.damage}` : ''
    ].filter(Boolean);
    if (metadata.length) {
      const meta = document.createElement('div');
      meta.className = 'combat-spell-meta';
      metadata.forEach(value => {
        const detail = document.createElement('span');
        detail.textContent = value;
        meta.appendChild(detail);
      });
      info.appendChild(meta);
    }
    if (spell.effect) {
      const effect = document.createElement('p');
      effect.className = 'combat-spell-effect';
      effect.textContent = spell.effect;
      info.appendChild(effect);
    }
    row.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'combat-spell-actions';
    if (hasSpellAttack && /\bspell attack\b/i.test(spell.attack)) {
      const modifier = Number(spellAttackValue) || 0;
      actions.appendChild(makeCombatRollButton(`Attack ${signed(modifier)}`, () => rollCharacterD20(character, `${spell.name} spell attack`, modifier, { mode: mode() })));
    }
    const damage = parseDiceExpression(spell.damage || spell.effect || spell.name);
    if (damage) {
      actions.appendChild(makeCombatRollButton(`Roll ${damage.expression}`, () => rollDice(damage.count, damage.sides, damage.modifier, {
        characterName: character.name,
        label: `${spell.name} damage`
      }), true));
    }
    if (actions.children.length) row.appendChild(actions);
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
  const structured = normalizeSpellList(character.fields?.['spell-list']);
  if (structured.length) {
    return structured
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }
  const entries = [];
  for (let level = 0; level <= 9; level += 1) {
    const text = String(character.fields?.[`spells-${level}`] || '').trim();
    if (!text) continue;
    text.split(/\n|;/).flatMap(line => {
      const trimmed = line.trim();
      return trimmed.includes(',') && !/\d+d\d+/i.test(trimmed) ? trimmed.split(',') : [trimmed];
    }).map(name => name.trim()).filter(Boolean).forEach(name => entries.push(normalizeSpell({ level, name }, entries.length)));
  }
  return entries;
}

document.getElementById('combat-close-btn').onclick = closeCombatManager;
document.getElementById('combat-overlay').addEventListener('mousedown', event => {
  if (event.target.id === 'combat-overlay') closeCombatManager();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeCombatTarget) closeCombatManager();
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
  const target = activeCombatEntity();
  if (!target) return;
  const name = target.type === 'npc' ? target.entity.label : target.entity.name;
  const message = target.type === 'npc'
    ? `Restore ${name} to full HP?`
    : `Give ${name} a long rest? This restores HP and all spell slots.`;
  if (confirm(message)) combatAction('longRest');
};
document.getElementById('combat-concentration-roll').onclick = () => {
  if (activeCombatTarget?.type !== 'character') return;
  const character = state?.characters?.[activeCombatTarget.id];
  const check = pendingConcentrationChecks.get(activeCombatTarget.id);
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
    row.dataset.initiativeId = entry.id;
    if (myRole === 'dm') {
      const dragHandle = document.createElement('span');
      dragHandle.className = 'initiative-drag-handle';
      dragHandle.textContent = '⋮⋮';
      dragHandle.title = 'Drag to reorder';
      dragHandle.draggable = true;
      dragHandle.ondragstart = event => {
        draggedInitiativeId = entry.id;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', entry.id);
        row.classList.add('dragging');
      };
      dragHandle.ondragend = () => {
        draggedInitiativeId = null;
        document.querySelectorAll('.initiative-item').forEach(item => item.classList.remove('dragging', 'drag-over'));
      };
      row.appendChild(dragHandle);
    }
    const value = document.createElement(myRole === 'dm' ? 'input' : 'div');
    value.className = 'init-value' + (myRole === 'dm' ? ' init-value-edit' : '');
    if (myRole === 'dm') {
      value.type = 'number';
      value.value = entry.value;
      value.title = `Edit ${entry.name}'s initiative`;
      value.onchange = () => socket.emit('initiative:edit', { id: entry.id, value: Number(value.value) });
    } else {
      value.textContent = entry.value;
    }
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
    const npcToken = entry.tokenId ? state.tokens.find(token => token.id === entry.tokenId && token.kind === 'npc') : null;
    if (character?.canManage || (myRole === 'dm' && npcToken)) {
      const combatButton = document.createElement('button');
      combatButton.type = 'button';
      combatButton.className = 'initiative-combat-btn';
      combatButton.textContent = '⚔';
      combatButton.title = `Open combat controls for ${entry.name}`;
      combatButton.onclick = () => npcToken ? openNpcCombatManager(npcToken.id) : openCombatManager(entry.name);
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
      row.ondragover = event => {
        if (!draggedInitiativeId || draggedInitiativeId === entry.id) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      };
      row.ondragleave = () => row.classList.remove('drag-over');
      row.ondrop = event => {
        event.preventDefault();
        const draggedId = draggedInitiativeId || event.dataTransfer.getData('text/plain');
        row.classList.remove('drag-over');
        if (!draggedId || draggedId === entry.id) return;
        const orderedIds = initiative.entries.map(item => item.id).filter(id => id !== draggedId);
        const targetIndex = orderedIds.indexOf(entry.id);
        const rect = row.getBoundingClientRect();
        const insertAfter = event.clientY > rect.top + rect.height / 2;
        orderedIds.splice(Math.max(0, targetIndex + (insertAfter ? 1 : 0)), 0, draggedId);
        socket.emit('initiative:reorder', { orderedIds });
      };
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
  label.textContent = 'Roll initiative:';
  container.appendChild(label);
  Object.values(state.characters).forEach(character => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-ghost quick-add-chip';
    button.textContent = `🎲 ${character.name}`;
    button.onclick = () => rollCharacterInitiative(character, 'normal');
    container.appendChild(button);
  });
  state.tokens.filter(token => token.kind !== 'item' && !state.characters[token.label]).forEach(token => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-ghost quick-add-chip';
    button.textContent = token.label;
    button.onclick = () => {
      if (token.kind === 'npc') rollNpcInitiative(token, 'normal');
      else {
        document.getElementById('init-name').value = token.label;
        document.getElementById('init-value').focus();
      }
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
