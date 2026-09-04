function registerLibraryHandlers(socket, room) {
  const {
    clearLibraryBroadcast,
    cleanLibraryFile,
    cleanLibraryFolder,
    deny,
    emitLibraryBroadcast,
    emitLibraryUpdate,
    isDm,
    normalizeLibrary,
    persistState,
    removeLibraryFileAsset,
    scheduleLibraryBroadcastExpiry,
    state
  } = room;

  function requireDm() {
    if (isDm(socket)) return true;
    deny(socket, 'Only the Dungeon Master can manage the library.');
    return false;
  }

  socket.on('library:folder:create', (requested = {}) => {
    if (!requireDm()) return;
    normalizeLibrary(state.library);
    const name = String(requested.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!name) return deny(socket, 'Give the folder a name first.');
    const parentId = String(requested.parentId || '').trim().slice(0, 120) || null;
    if (parentId && !state.library.folders.some(folder => folder.id === parentId)) {
      return deny(socket, 'That parent folder no longer exists.');
    }
    if (state.library.folders.some(folder => folder.parentId === parentId && folder.name.toLowerCase() === name.toLowerCase())) {
      return deny(socket, 'A folder with that name already exists here.');
    }
    const folder = cleanLibraryFolder({
      id: `folder_${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      name,
      parentId,
      createdAt: Date.now()
    });
    state.library.folders.push(folder);
    persistState();
    emitLibraryUpdate();
  });

  socket.on('library:folder:rename', (requested = {}) => {
    if (!requireDm()) return;
    const folder = state.library.folders.find(entry => entry.id === String(requested.id || ''));
    if (!folder) return deny(socket, 'That folder no longer exists.');
    const name = String(requested.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!name) return deny(socket, 'Give the folder a name first.');
    if (state.library.folders.some(entry => entry.id !== folder.id && entry.parentId === folder.parentId && entry.name.toLowerCase() === name.toLowerCase())) {
      return deny(socket, 'A folder with that name already exists here.');
    }
    folder.name = name;
    persistState();
    emitLibraryUpdate();
  });

  socket.on('library:folder:delete', (requested = {}) => {
    if (!requireDm()) return;
    const folder = state.library.folders.find(entry => entry.id === String(requested.id || ''));
    if (!folder) return deny(socket, 'That folder no longer exists.');
    const parentId = folder.parentId || null;
    state.library.folders.forEach(entry => {
      if (entry.parentId === folder.id) entry.parentId = parentId;
    });
    state.library.files.forEach(file => {
      if (file.folderId === folder.id) file.folderId = parentId;
    });
    state.library.folders = state.library.folders.filter(entry => entry.id !== folder.id);
    persistState();
    emitLibraryUpdate();
  });

  socket.on('library:file:add', (requested = {}) => {
    if (!requireDm()) return;
    normalizeLibrary(state.library);
    const folderId = String(requested.folderId || '').trim().slice(0, 120) || null;
    if (folderId && !state.library.folders.some(folder => folder.id === folderId)) {
      return deny(socket, 'That destination folder no longer exists.');
    }
    const file = cleanLibraryFile({
      id: `file_${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      name: requested.name,
      url: requested.url,
      mimeType: requested.mimeType,
      size: requested.size,
      folderId,
      createdAt: Date.now()
    });
    if (!file) return deny(socket, 'That upload is not a supported library file.');
    state.library.files.push(file);
    persistState();
    emitLibraryUpdate();
  });

  socket.on('library:file:rename', (requested = {}) => {
    if (!requireDm()) return;
    const file = state.library.files.find(entry => entry.id === String(requested.id || ''));
    if (!file) return deny(socket, 'That file no longer exists.');
    const name = String(requested.name || '').trim().replace(/\s+/g, ' ').slice(0, 160);
    if (!name) return deny(socket, 'Give the file a name first.');
    file.name = name;
    persistState();
    emitLibraryUpdate();
  });

  socket.on('library:file:move', (requested = {}) => {
    if (!requireDm()) return;
    const file = state.library.files.find(entry => entry.id === String(requested.id || ''));
    if (!file) return deny(socket, 'That file no longer exists.');
    const folderId = String(requested.folderId || '').trim().slice(0, 120) || null;
    if (folderId && !state.library.folders.some(folder => folder.id === folderId)) {
      return deny(socket, 'That destination folder no longer exists.');
    }
    file.folderId = folderId;
    persistState();
    emitLibraryUpdate();
  });

  socket.on('library:file:delete', (requested = {}) => {
    if (!requireDm()) return;
    const index = state.library.files.findIndex(entry => entry.id === String(requested.id || ''));
    if (index === -1) return deny(socket, 'That file no longer exists.');
    const [file] = state.library.files.splice(index, 1);
    if (state.library.broadcast?.fileId === file.id) clearLibraryBroadcast();
    if (!state.library.files.some(entry => entry.url === file.url)) removeLibraryFileAsset(file);
    persistState();
    emitLibraryUpdate();
  });

  socket.on('library:broadcast', (requested = {}) => {
    if (!requireDm()) return;
    const file = state.library.files.find(entry => entry.id === String(requested.fileId || ''));
    if (!file) return deny(socket, 'That library file no longer exists.');
    const requestedDuration = Number(requested.duration);
    const duration = Number.isFinite(requestedDuration)
      ? Math.max(0, Math.min(3600, Math.round(requestedDuration)))
      : 0;
    const startedAt = Date.now();
    state.library.broadcast = {
      fileId: file.id,
      startedAt,
      expiresAt: duration ? startedAt + duration * 1000 : 0
    };
    persistState();
    scheduleLibraryBroadcastExpiry();
    emitLibraryBroadcast();
  });

  socket.on('library:broadcast:clear', () => {
    if (!requireDm()) return;
    clearLibraryBroadcast();
  });
}

module.exports = { registerLibraryHandlers };
