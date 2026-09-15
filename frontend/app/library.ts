/** Saved scenes, DM library, handouts, notifications, safety tools, and shop bridge. */

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

// ---- DM library and shared handouts ----
function libraryData() {
  const library = state?.library || {};
  return {
    folders: Array.isArray(library.folders) ? library.folders : [],
    files: Array.isArray(library.files) ? library.files : [],
    broadcast: library.broadcast || null
  };
}

function libraryFolderName(folderId, folders) {
  return folders.find(folder => folder.id === folderId)?.name || 'Unfiled';
}

function orderedLibraryFolders(folders) {
  const ordered = [];
  const visit = (parentId, depth, visited) => {
    folders
      .filter(folder => (folder.parentId || null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(folder => {
        if (visited.has(folder.id)) return;
        const nextVisited = new Set(visited).add(folder.id);
        ordered.push({ folder, depth });
        visit(folder.id, depth + 1, nextVisited);
      });
  };
  visit(null, 0, new Set());
  return ordered;
}

function libraryFileIcon(file) {
  return file.kind === 'image' ? '🖼️' : file.kind === 'pdf' ? '📕' : file.kind === 'html' ? '✨' : file.kind === 'text' ? '📝' : '📎';
}

function libraryFileSize(size) {
  const bytes = Number(size) || 0;
  if (!bytes) return 'Size unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function renderLibrary() {
  if (myRole !== 'dm') return;
  const library = libraryData();
  const currentFolder = libraryCurrentFolderId !== 'all' && libraryCurrentFolderId !== 'unfiled'
    ? library.folders.find(folder => folder.id === libraryCurrentFolderId)
    : null;
  if (libraryCurrentFolderId !== 'all' && libraryCurrentFolderId !== 'unfiled' && !currentFolder) {
    libraryCurrentFolderId = 'all';
  }

  const folderList = document.getElementById('library-folder-list');
  const folderCount = document.getElementById('library-folder-count');
  folderList.innerHTML = '';
  folderCount.textContent = `${library.folders.length} folder${library.folders.length === 1 ? '' : 's'}`;

  const appendFolderButton = (label, id, depth = 0, icon = '') => {
    const row = document.createElement('div');
    row.className = 'library-folder-row';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'library-folder-btn' + (libraryCurrentFolderId === id ? ' active' : '');
    button.style.paddingLeft = `${10 + depth * 16}px`;
    button.textContent = `${icon}${icon ? ' ' : ''}${label}`;
    button.onclick = () => {
      libraryCurrentFolderId = id;
      renderLibrary();
    };
    row.appendChild(button);
    if (id !== 'all' && id !== 'unfiled') {
      const folder = library.folders.find(entry => entry.id === id);
      const actions = document.createElement('span');
      actions.className = 'library-folder-actions';
      const rename = document.createElement('button');
      rename.type = 'button';
      rename.className = 'library-inline-action';
      rename.title = 'Rename folder';
      rename.textContent = '✎';
      rename.onclick = event => {
        event.stopPropagation();
        const name = prompt('Folder name', folder?.name || '');
        if (name?.trim()) socket.emit('library:folder:rename', { id, name: name.trim() });
      };
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'library-inline-action danger';
      remove.title = 'Delete folder';
      remove.textContent = '×';
      remove.onclick = event => {
        event.stopPropagation();
        if (confirm(`Delete “${folder?.name || 'this folder'}”? Its files will be moved to the parent folder.`)) {
          socket.emit('library:folder:delete', { id });
        }
      };
      actions.append(rename, remove);
      row.appendChild(actions);
    }
    folderList.appendChild(row);
  };

  appendFolderButton('All files', 'all', 0, '📚');
  appendFolderButton('Unfiled', 'unfiled', 0, '🗂️');
  orderedLibraryFolders(library.folders).forEach(({ folder, depth }) => appendFolderButton(folder.name, folder.id, depth + 1, '📁'));

  const files = libraryCurrentFolderId === 'all'
    ? library.files
    : library.files.filter(file => libraryCurrentFolderId === 'unfiled'
      ? !file.folderId
      : file.folderId === libraryCurrentFolderId);
  const currentFolderLabel = libraryCurrentFolderId === 'all'
    ? 'All files'
    : libraryCurrentFolderId === 'unfiled' ? 'Unfiled' : currentFolder?.name || 'All files';
  document.getElementById('library-current-folder').textContent = currentFolderLabel;
  document.getElementById('library-file-summary').textContent = `${files.length} file${files.length === 1 ? '' : 's'} here`;

  const fileList = document.getElementById('library-file-list');
  fileList.innerHTML = '';
  if (!files.length) {
    fileList.innerHTML = '<div class="library-empty"><span>🍂</span><strong>No files here yet</strong><p>Upload a handout, clue, map or puzzle file to begin.</p></div>';
    return;
  }

  const folderOptions = orderedLibraryFolders(library.folders);
  files
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(file => {
      const card = document.createElement('article');
      card.className = 'library-file-card';
      card.innerHTML = `
        <div class="library-file-info">
          <span class="library-file-icon" aria-hidden="true">${libraryFileIcon(file)}</span>
          <div><strong class="library-file-name"></strong><span class="library-file-meta"></span></div>
        </div>
        <div class="library-file-actions">
          <label class="library-move-control">Folder
            <select class="library-file-folder" aria-label="Folder for file"></select>
          </label>
          <button class="btn-primary library-share-btn" type="button">Show to players</button>
          <button class="btn-ghost library-rename-btn" type="button">Rename</button>
          <button class="btn-danger-soft library-delete-btn" type="button">Delete</button>
        </div>`;
      card.querySelector('.library-file-name').textContent = file.name;
      card.querySelector('.library-file-meta').textContent = `${String(file.kind || 'file').toUpperCase()} · ${libraryFileSize(file.size)} · ${libraryFolderName(file.folderId, library.folders)}`;
      const folderSelect = card.querySelector('.library-file-folder');
      folderSelect.innerHTML = '<option value="">Unfiled</option>';
      folderOptions.forEach(({ folder, depth }) => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = `${'— '.repeat(depth)}${folder.name}`;
        folderSelect.appendChild(option);
      });
      folderSelect.value = file.folderId || '';
      folderSelect.onchange = () => socket.emit('library:file:move', { id: file.id, folderId: folderSelect.value });
      card.querySelector('.library-share-btn').onclick = () => {
        const duration = Number(document.getElementById('library-broadcast-duration').value) || 0;
        socket.emit('library:broadcast', { fileId: file.id, duration });
      };
      card.querySelector('.library-rename-btn').onclick = () => {
        const name = prompt('File name', file.name);
        if (name?.trim()) socket.emit('library:file:rename', { id: file.id, name: name.trim() });
      };
      card.querySelector('.library-delete-btn').onclick = () => {
        if (confirm(`Delete “${file.name}” from the library?`)) socket.emit('library:file:delete', { id: file.id });
      };
      fileList.appendChild(card);
    });
}

function notificationTimestamp(createdAt) {
  const time = Number(createdAt);
  if (!time) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(time));
}

function renderDmNotifications() {
  const panel = document.getElementById('dm-notifications-panel');
  const list = document.getElementById('dm-notifications-list');
  const count = document.getElementById('dm-notification-count');
  const toggle = document.getElementById('dm-notifications-btn');
  if (!panel || !list || !count || !toggle) return;
  const notifications = myRole === 'dm' && Array.isArray(state?.notifications) ? state.notifications : [];
  const unreadCount = notifications.filter(notification => !notification.read).length;
  count.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
  count.classList.toggle('hidden', unreadCount === 0);
  toggle.setAttribute('aria-expanded', String(dmNotificationsOpen));
  panel.classList.toggle('hidden', myRole !== 'dm' || !dmNotificationsOpen);

  list.innerHTML = '';
  if (!notifications.length) {
    const empty = document.createElement('div');
    empty.className = 'dm-notifications-empty';
    empty.innerHTML = '<span aria-hidden="true">🌿</span><strong>Nothing waiting</strong><p>Player questions and private safety requests will appear here.</p>';
    list.appendChild(empty);
  } else {
    notifications.forEach(notification => {
      const item = document.createElement('article');
      item.className = `dm-notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`;
      const heading = document.createElement('div');
      heading.className = 'dm-notification-heading';
      const title = document.createElement('strong');
      title.textContent = notification.type === 'safety'
        ? '15-minute break requested'
        : `Question from ${notification.anonymous ? 'Anonymous player' : (notification.senderName || 'Player')}`;
      const time = document.createElement('time');
      time.dateTime = new Date(Number(notification.createdAt) || Date.now()).toISOString();
      time.textContent = notificationTimestamp(notification.createdAt);
      heading.append(title, time);
      const body = document.createElement('p');
      body.textContent = notification.type === 'safety'
        ? 'An anonymous player needs a pause. Please stop play for 15 minutes and check in privately.'
        : notification.question;
      const actions = document.createElement('div');
      actions.className = 'dm-notification-actions';
      if (!notification.read) {
        const markRead = document.createElement('button');
        markRead.type = 'button';
        markRead.className = 'btn-ghost';
        markRead.textContent = 'Mark read';
        markRead.onclick = () => socket.emit('notifications:markRead', { id: notification.id });
        actions.appendChild(markRead);
      }
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'btn-danger-soft';
      dismiss.textContent = 'Dismiss';
      dismiss.onclick = () => socket.emit('notifications:clear', { id: notification.id });
      actions.appendChild(dismiss);
      item.append(heading, body, actions);
      list.appendChild(item);
    });
  }
  const markAll = document.getElementById('dm-notifications-mark-all');
  const clearAll = document.getElementById('dm-notifications-clear-all');
  if (markAll) markAll.disabled = unreadCount === 0;
  if (clearAll) clearAll.disabled = notifications.length === 0;
}

function closePlayerQuestion() {
  const overlay = document.getElementById('player-question-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

document.getElementById('player-safety-btn').onclick = () => {
  if (myRole !== 'player') return;
  socket.emit('safety:request');
};
document.getElementById('player-question-btn').onclick = () => {
  if (myRole !== 'player') return;
  const overlay = document.getElementById('player-question-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('player-question-input').focus();
};
document.getElementById('player-question-close').onclick = closePlayerQuestion;
document.getElementById('player-question-cancel').onclick = closePlayerQuestion;
document.getElementById('player-question-overlay').onclick = event => {
  if (event.target.id === 'player-question-overlay') closePlayerQuestion();
};
document.getElementById('player-question-form').onsubmit = event => {
  event.preventDefault();
  if (questionSubmitting) return;
  const input = document.getElementById('player-question-input');
  const question = input.value.trim();
  if (!question) return showToast('Write a question before sending it.');
  questionSubmitting = true;
  const button = document.getElementById('player-question-submit');
  button.disabled = true;
  button.textContent = 'Sending…';
  socket.emit('question:submit', {
    question,
    anonymous: document.getElementById('player-question-anonymous').checked
  });
  window.setTimeout(() => {
    if (!questionSubmitting) return;
    questionSubmitting = false;
    button.disabled = false;
    button.textContent = 'Send question';
  }, 5000);
};

document.getElementById('dm-notifications-btn').onclick = event => {
  event.stopPropagation();
  if (myRole !== 'dm') return;
  dmNotificationsOpen = !dmNotificationsOpen;
  renderDmNotifications();
};
document.getElementById('dm-notifications-close').onclick = () => {
  dmNotificationsOpen = false;
  renderDmNotifications();
};
document.getElementById('dm-notifications-mark-all').onclick = () => socket.emit('notifications:markAllRead');
document.getElementById('dm-notifications-clear-all').onclick = () => {
  if (state?.notifications?.length && confirm('Clear all DM notifications?')) socket.emit('notifications:clearAll');
};
document.addEventListener('click', event => {
  const panel = document.getElementById('dm-notifications-panel');
  const toggle = document.getElementById('dm-notifications-btn');
  if (dmNotificationsOpen && panel && !panel.contains(event.target) && !toggle.contains(event.target)) {
    dmNotificationsOpen = false;
    renderDmNotifications();
  }
});

function activeShopFrame() {
  return document.querySelector('#shared-handout-content iframe[data-shop-handout="true"]');
}

function postShopMessage(message, frame = activeShopFrame()) {
  if (frame?.contentWindow) frame.contentWindow.postMessage(message, '*');
}

function postShopContext(frame = activeShopFrame()) {
  postShopMessage({
    type: 'humblewood:shop-context',
    role: myRole,
    stock: state?.shopStock || {}
  }, frame);
}

function rejectShopRequest(request, message) {
  postShopMessage({
    type: 'humblewood:shop-purchase-result',
    requestId: request.requestId,
    itemId: request.itemId,
    ok: false,
    message
  });
  if (message) showToast(message);
}

function choosePurchaseCharacter() {
  const characters = Object.values(state?.characters || {}).filter(character => character.canManage);
  if (characters.length === 1) return characters[0];
  if (!characters.length) return null;
  const choices = characters.map((character, index) => `${index + 1}. ${character.name}`).join('\n');
  const preferredIndex = characters.findIndex(character => character.name === shopPurchaseCharacterName);
  const answer = prompt(
    `Which character is buying this item?\n\n${choices}`,
    preferredIndex >= 0 ? String(preferredIndex + 1) : '1'
  );
  if (answer === null) return null;
  const number = Number(answer.trim());
  if (Number.isInteger(number) && characters[number - 1]) return characters[number - 1];
  return characters.find(character => character.name.toLowerCase() === answer.trim().toLowerCase()) || null;
}

window.addEventListener('message', event => {
  const frame = activeShopFrame();
  if (!frame || event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
  const request = event.data;
  if (request.type === 'humblewood:puzzle-complete') {
    const puzzleName = String(request.name || 'Puzzle').trim().slice(0, 80) || 'Puzzle';
    showToast(`${puzzleName} completed.`);
    return;
  }
  if (request.type === 'humblewood:shop-ready') {
    postShopContext(frame);
    return;
  }
  if (request.type !== 'humblewood:shop-purchase-request') return;
  if (myRole !== 'player') return rejectShopRequest(request, 'Only players can purchase items.');

  const catalogItem = state?.shopCatalog?.[String(request.itemId || '')];
  if (!catalogItem) return rejectShopRequest(request, 'That item is not available for purchase.');

  const character = choosePurchaseCharacter();
  if (!character) return rejectShopRequest(request, 'No character was selected for this purchase.');
  shopPurchaseCharacterName = character.name;

  const confirmed = confirm(
    `Are you sure ${character.name} wants to purchase ${catalogItem.name} for ${catalogItem.priceLabel}?`
  );
  if (!confirmed) return rejectShopRequest(request, 'Purchase cancelled.');

  socket.emit('shop:purchase', {
    requestId: String(request.requestId || '').slice(0, 100),
    itemId: String(request.itemId || '').slice(0, 180),
    characterName: character.name
  });
});

function formatSharedHandoutTimer(expiresAt) {
  const seconds = Math.max(0, Math.ceil((Number(expiresAt) - Date.now()) / 1000));
  if (seconds < 60) return `${seconds}s remaining`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m${remainder ? ` ${remainder}s` : ''} remaining`;
}

const sharedHandoutDialog = createDialogController(document.getElementById('shared-handout-overlay'), {
  onDismiss: () => {
    if (state?.library?.broadcast && sharedHandoutRenderKey) dismissedSharedHandoutKey = sharedHandoutRenderKey;
    clearInterval(sharedHandoutTimer);
    sharedHandoutTimer = null;
  }
});

function renderSharedHandoutContent(broadcast) {
  const content = document.getElementById('shared-handout-content');
  content.innerHTML = '';
  if (broadcast.kind === 'image') {
    const image = document.createElement('img');
    image.src = broadcast.url;
    image.alt = broadcast.name;
    content.appendChild(image);
    return;
  }
  if (broadcast.kind === 'pdf') {
    const frame = document.createElement('iframe');
    frame.src = broadcast.url;
    frame.title = broadcast.name;
    content.appendChild(frame);
    return;
  }
  if (broadcast.kind === 'html') {
    const frame = document.createElement('iframe');
    frame.src = broadcast.url;
    frame.title = broadcast.name;
    frame.dataset.shopHandout = 'true';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('allow', 'fullscreen');
    frame.setAttribute('allowfullscreen', '');
    frame.addEventListener('load', () => postShopContext(frame));
    content.appendChild(frame);
    return;
  }
  if (broadcast.kind === 'text') {
    const pre = document.createElement('pre');
    pre.textContent = 'Loading handout…';
    content.appendChild(pre);
    const requestId = ++sharedHandoutContentRequest;
    fetch(broadcast.url)
      .then(response => {
        if (!response.ok) throw new Error('Could not load the handout.');
        return response.text();
      })
      .then(text => {
        if (requestId === sharedHandoutContentRequest) pre.textContent = text;
      })
      .catch(() => {
        if (requestId === sharedHandoutContentRequest) pre.textContent = 'This handout could not be loaded.';
      });
    return;
  }
  const message = document.createElement('p');
  message.textContent = 'This file type cannot be previewed in the handout overlay.';
  const link = document.createElement('a');
  link.href = broadcast.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Open or download the file';
  message.append(' ', link);
  content.appendChild(message);
}

function updateSharedHandoutTimer() {
  const broadcast = state?.library?.broadcast;
  if (!broadcast) return;
  if (broadcast.expiresAt && Number(broadcast.expiresAt) <= Date.now()) {
    sharedHandoutDialog.close('expired');
    clearInterval(sharedHandoutTimer);
    sharedHandoutTimer = null;
    return;
  }
  document.getElementById('shared-handout-timer').textContent = broadcast.expiresAt
    ? formatSharedHandoutTimer(broadcast.expiresAt)
    : 'Shown until stopped';
}

function renderSharedHandout() {
  const broadcast = state?.library?.broadcast;
  clearInterval(sharedHandoutTimer);
  sharedHandoutTimer = null;
  if (!broadcast || (broadcast.expiresAt && Number(broadcast.expiresAt) <= Date.now())) {
    dismissedSharedHandoutKey = '';
    sharedHandoutDialog.close(broadcast ? 'expired' : 'broadcast-ended');
    sharedHandoutRenderKey = '';
    return;
  }
  const renderKey = `${broadcast.fileId}:${broadcast.url}:${broadcast.kind}:${broadcast.startedAt || ''}`;
  if (dismissedSharedHandoutKey === renderKey) return;
  if (dismissedSharedHandoutKey) dismissedSharedHandoutKey = '';
  document.getElementById('shared-handout-title').textContent = broadcast.name || 'Shared handout';
  if (sharedHandoutRenderKey !== renderKey) {
    sharedHandoutRenderKey = renderKey;
    renderSharedHandoutContent(broadcast);
  }
  updateSharedHandoutTimer();
  sharedHandoutDialog.open();
  if (broadcast.expiresAt) sharedHandoutTimer = setInterval(updateSharedHandoutTimer, 250);
}

document.getElementById('library-new-folder-btn').onclick = () => {
  const name = prompt('Folder name');
  if (name?.trim()) {
    const parentId = libraryCurrentFolderId !== 'all' && libraryCurrentFolderId !== 'unfiled' ? libraryCurrentFolderId : null;
    socket.emit('library:folder:create', { name: name.trim(), parentId });
  }
};
document.getElementById('library-add-session0-btn').onclick = () => {
  const library = libraryData();
  if (library.files.some(file => file.url === '/handouts/session-0.html')) {
    return showToast('The Session 0 handout is already in your library.');
  }
  const folderId = libraryCurrentFolderId !== 'all' && libraryCurrentFolderId !== 'unfiled' ? libraryCurrentFolderId : null;
  socket.emit('library:file:add', {
    name: 'Session 0 · Welcome & table safety',
    url: '/handouts/session-0.html',
    mimeType: 'text/html',
    size: 0,
    folderId
  });
};
document.getElementById('library-upload-btn').onclick = () => document.getElementById('library-file-input').click();
document.getElementById('library-file-input').onchange = async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const folderId = libraryCurrentFolderId !== 'all' && libraryCurrentFolderId !== 'unfiled' ? libraryCurrentFolderId : null;
  const button = document.getElementById('library-upload-btn');
  button.disabled = true;
  try {
    const uploaded = await uploadLibraryFile(file);
    socket.emit('library:file:add', {
      name: uploaded.name || file.name,
      url: uploaded.url,
      mimeType: uploaded.mimeType || file.type,
      size: uploaded.size || file.size,
      folderId
    });
  } catch (error) {
    showToast(error.message || 'The file could not be uploaded.');
  } finally {
    button.disabled = false;
  }
};
document.getElementById('shared-handout-stop-btn').onclick = () => socket.emit('library:broadcast:clear');
