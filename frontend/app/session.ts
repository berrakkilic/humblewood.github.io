/** Authentication, routing, socket synchronization, accounts, and presence. */

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
    ? 'Create one account, then use it anywhere you play. This device will stay signed in for 30 days.'
    : 'Sign in from any device. This device will stay signed in for 30 days; if you forget your password, ask the DM to reset it.';
  document.getElementById('join-error').textContent = '';
}

document.getElementById('join-btn').onclick = async () => {
  const nameInput = document.getElementById('name-input');
  myUsername = document.getElementById('username-input').value.trim();
  const password = document.getElementById('password-input').value;
  myName = nameInput.value.trim() || (myRole === 'dm' ? 'The DM' : myUsername);
  if (myRole === 'player' && authMode === 'register' && password !== document.getElementById('confirm-password-input').value) {
    document.getElementById('join-error').textContent = 'Those passwords do not match.';
    return;
  }
  const joinButton = document.getElementById('join-btn');
  joinButton.disabled = true;
  joinButton.textContent = 'Entering…';
  document.getElementById('join-error').textContent = '';
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: myRole,
        name: myName,
        username: myUsername,
        password,
        authMode,
        dmPin: document.getElementById('dm-pin-input').value
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || 'Could not join the table.');
    awaitingSessionResume = true;
    socket.disconnect();
    socket.connect();
  } catch (error) {
    awaitingSessionResume = false;
    joinButton.disabled = false;
    joinButton.textContent = 'Enter the Wood';
    document.getElementById('join-error').textContent = error.message || 'Could not join the table.';
  }
};

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
  awaitingSessionResume = false;
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
  if (myRole !== 'dm') {
    dmPrivateRollsEnabled = false;
    privateRollLog = [];
    if (router.current === 'library') router.navigate('map');
  }
  renderDmPrivateRollMode();
  if (myRole === 'dm') socket.emit('accounts:list');
});

socket.on('connect', () => {
  socket.emit('session:resume');
});
socket.on('session:result', result => {
  if (result.ok || !awaitingSessionResume) return;
  awaitingSessionResume = false;
  const joinButton = document.getElementById('join-btn');
  joinButton.disabled = false;
  joinButton.textContent = 'Enter the Wood';
  document.getElementById('join-error').textContent = 'Your login succeeded, but the saved session could not be restored. Please try again.';
});

// ---------------- Frontend routes ----------------
const router = window.HumblewoodRouter.createRouter({
  routes: {
    map: { path: '/map', title: 'Map' },
    characters: { path: '/characters', title: 'Characters' },
    almanac: { path: '/almanac', title: 'Humble Almanac' },
    jukebox: { path: '/jukebox', title: 'Jukebox' },
    library: { path: '/library', title: 'DM Library' },
    dice: { path: '/dice', title: 'Dice' }
  },
  onRoute: renderRoute
});

window.HumblewoodAlmanac.mount(window.HumblewoodAlmanacData);

document.getElementById('topbar-roll-btn').onclick = () => switchView('dice');
document.getElementById('topbar-logout-btn').onclick = async () => {
  const button = document.getElementById('topbar-logout-btn');
  button.disabled = true;
  button.textContent = 'Logging out…';
  try {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' });
    window.location.reload();
  } catch {
    button.disabled = false;
    button.textContent = 'Log out';
    showToast('Could not log out. Please check your connection and try again.');
  }
};

function renderRoute(viewName, route) {
  if (viewName === 'library' && myRole !== 'dm') {
    router.navigate('map');
    return;
  }
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
  if (shopPurchaseCharacterName && !state.characters?.[shopPurchaseCharacterName]?.canManage) {
    shopPurchaseCharacterName = '';
  }
  onlineUsers = Array.isArray(s.onlineUsers) ? s.onlineUsers : [];
  renderMap();
  renderTokenTray();
  renderNpcRoster();
  renderSavedScenes();
  renderPlayerSidebar();
  renderDmSidebarSummary();
  renderCharacters();
  renderJukebox();
  renderLibrary();
  renderDmNotifications();
  renderOnlineUsers();
  renderSharedHandout();
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
  if (idx === -1) state.tokens.push(updated);
  else state.tokens[idx] = { ...state.tokens[idx], ...updated };
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

socket.on('npcs:update', npcs => {
  state.npcs = npcs || {};
  renderNpcRoster();
  renderDmSidebarSummary();
  renderCharacters();
  refreshCharacterRoller();
  if (activeCombatTarget?.type === 'npc') renderCombatManager();
});
socket.on('library:update', library => {
  if (!state) return;
  state.library = library || { folders: [], files: [], broadcast: null };
  renderLibrary();
  renderSharedHandout();
});
socket.on('library:broadcast', broadcast => {
  if (!state) return;
  state.library = state.library || { folders: [], files: [], broadcast: null };
  state.library.broadcast = broadcast || null;
  renderSharedHandout();
  if (broadcast) showToast(`Shared “${broadcast.name}” with the table.`);
});
socket.on('notifications:update', notifications => {
  if (!state || myRole !== 'dm') return;
  const previousIds = new Set((state.notifications || []).map(notification => notification.id));
  state.notifications = Array.isArray(notifications) ? notifications : [];
  const hasNew = state.notifications.some(notification => !previousIds.has(notification.id));
  if (hasNew) dmNotificationsOpen = true;
  renderDmNotifications();
  if (hasNew) showToast('New private table notification.');
});
socket.on('safety:submitted', ({ cooldown }: any = {}) => {
  const button = document.getElementById('player-safety-btn');
  if (!button) return;
  button.disabled = true;
  button.textContent = cooldown ? 'Break request sent' : 'Break requested';
  clearTimeout(safetyButtonTimer);
  safetyButtonTimer = setTimeout(() => {
    button.disabled = false;
    button.textContent = '⏸ Need a break';
  }, 30000);
  showToast('The DM has been notified privately. Please take the space you need.');
});
socket.on('question:submitted', () => {
  questionSubmitting = false;
  const button = document.getElementById('player-question-submit');
  if (button) {
    button.disabled = false;
    button.textContent = 'Send question';
  }
  document.getElementById('player-question-input').value = '';
  document.getElementById('player-question-anonymous').checked = false;
  closePlayerQuestion();
  showToast('Your question was sent privately to the DM.');
});
socket.on('scenes:update', scenes => { state.savedScenes = scenes || []; renderSavedScenes(); });
socket.on('scene:active', ({ name }) => { state.activeSceneName = name || null; renderSavedScenes(); renderDmSidebarSummary(); });
socket.on('scene:saved', ({ name }) => showToast(`Saved scene “${name}”.`));
socket.on('scene:loaded', ({ name }) => showToast(`Loaded scene “${name}”.`));
socket.on('scene:deleted', ({ name }) => showToast(`Deleted saved scene “${name}”.`));
socket.on('npc:saved', ({ id, name }) => {
  resetNpcEditor();
  if (editingNpcSheetId === id || (editingNpcSheetId === '__new__' && state.npcs?.[id])) {
    editingNpcSheetId = null;
    document.getElementById('sheet-editor').classList.add('hidden');
  }
  showToast(`Saved ${name}.`);
});
socket.on('npc:deleted', ({ id, name }) => {
  if (editingNpcId === id) resetNpcEditor();
  if (editingNpcSheetId === id) {
    editingNpcSheetId = null;
    document.getElementById('sheet-editor').classList.add('hidden');
  }
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
socket.on('shop:stock:update', shopStock => {
  if (!state) return;
  state.shopStock = shopStock || {};
  postShopContext();
});
socket.on('shop:purchase:result', result => {
  postShopMessage({ type: 'humblewood:shop-purchase-result', ...result });
  showToast(result.message || (result.ok ? 'Purchase complete.' : 'Purchase could not be completed.'));
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

socket.on('presence:list', users => {
  onlineUsers = Array.isArray(users) ? users : [];
  renderOnlineUsers();
});

socket.on('pointer:move', renderSharedPointer);
socket.on('pointer:hide', ({ id }) => removeSharedPointer(id));
socket.on('pointer:ping', renderSharedPing);
