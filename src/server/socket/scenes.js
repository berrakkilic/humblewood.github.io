function registerSceneHandlers(socket, room) {
  const {
    broadcastState, cleanDoodlePath, cleanFogShape, cloneJson, defaultState, deny,
    doodleAuthorKey, emitNpcRoster, emitSavedScenes, emitSceneUpdate, isDm,
    markSceneDirty, normalizeToken, persistState, publicDoodlePath, setSceneDirty,
    snapCoordinateToCell, syncCharacterTokens, syncNpcRosterFromTokens
  } = room;
  const { io, state } = room;

  socket.on('scene:setMap', ({ mapUrl, mapName } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the map.');
    state.scene.mapUrl = String(mapUrl || '').slice(0, 1000) || null;
    state.scene.mapName = String(mapName || 'Map').slice(0, 140);
    state.scene.doodlePaths = [];
    state.scene.fogShapes = [];
    markSceneDirty();
    persistState();
    emitSceneUpdate();
  });

  socket.on('scene:setGrid', ({ gridSize, gridVisible, fitTokensToGrid } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the grid.');
    const previousSize = state.scene.gridSize;
    if (gridSize !== undefined) state.scene.gridSize = Math.max(10, Math.min(300, Number(gridSize) || 50));
    if (gridVisible !== undefined) state.scene.gridVisible = !!gridVisible;
    if (fitTokensToGrid !== undefined) state.scene.fitTokensToGrid = !!fitTokensToGrid;
    if (state.scene.fitTokensToGrid && (previousSize !== state.scene.gridSize || fitTokensToGrid === true)) {
      state.tokens.forEach(token => {
        token.x = snapCoordinateToCell(token.x, state.scene.gridSize);
        token.y = snapCoordinateToCell(token.y, state.scene.gridSize);
      });
    }
    markSceneDirty();
    persistState();
    broadcastState();
  });

  socket.on('scene:save', ({ name } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can save scenes.');
    const requestedName = String(name || '').trim().slice(0, 80);
    if (!requestedName) return deny(socket, 'Give the scene a name first.');
    const existingName = Object.keys(state.savedScenes)
      .find(savedName => savedName.toLowerCase() === requestedName.toLowerCase());
    const safeName = existingName || requestedName;
    state.savedScenes[safeName] = {
      name: safeName,
      savedAt: Date.now(),
      scene: cloneJson(state.scene),
      tokens: cloneJson(state.tokens),
      initiative: cloneJson(state.initiative)
    };
    state.activeSceneName = safeName;
    setSceneDirty(false);
    persistState();
    emitSavedScenes();
    io.emit('scene:active', { name: safeName });
    socket.emit('scene:saved', { name: safeName });
  });

  socket.on('scene:load', ({ name } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can load scenes.');
    const saved = state.savedScenes[String(name || '')];
    if (!saved) return deny(socket, 'That saved scene no longer exists.');
    state.scene = { ...defaultState.scene, ...cloneJson(saved.scene) };
    state.tokens = cloneJson(saved.tokens || []);
    state.tokens.forEach(normalizeToken);
    state.initiative = { ...defaultState.initiative, ...cloneJson(saved.initiative || {}) };
    if (!Array.isArray(state.initiative.entries)) state.initiative.entries = [];
    state.activeSceneName = saved.name;
    syncNpcRosterFromTokens(state.tokens, true);
    Object.values(state.characters).forEach(character => syncCharacterTokens(character));
    setSceneDirty(false);
    persistState();
    broadcastState();
    emitNpcRoster();
    io.emit('scene:loaded', { name: saved.name });
  });

  socket.on('scene:delete', ({ name } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can delete saved scenes.');
    const safeName = String(name || '');
    if (!state.savedScenes[safeName]) return;
    delete state.savedScenes[safeName];
    if (state.activeSceneName === safeName) state.activeSceneName = null;
    persistState();
    emitSavedScenes();
    io.emit('scene:active', { name: state.activeSceneName });
    socket.emit('scene:deleted', { name: safeName });
  });

  socket.on('scene:setPlayerDoodling', ({ enabled } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change drawing permissions.');
    state.scene.playerDoodlingEnabled = !!enabled;
    markSceneDirty();
    persistState();
    emitSceneUpdate();
  });

  socket.on('scene:setTokenLabels', ({ visible } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change token labels.');
    state.scene.showTokenLabelsToPlayers = !!visible;
    markSceneDirty();
    persistState();
    emitSceneUpdate();
  });

  socket.on('scene:setFog', ({ enabled } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can control fog of war.');
    state.scene.fogEnabled = !!enabled;
    markSceneDirty();
    persistState();
    io.emit('scene:fog:update', { enabled: state.scene.fogEnabled, shapes: state.scene.fogShapes });
  });

  socket.on('scene:fog:add', requested => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit fog of war.');
    const shape = cleanFogShape(requested);
    if (!shape) return;
    state.scene.fogShapes.push(shape);
    state.scene.fogShapes = state.scene.fogShapes.slice(-500);
    markSceneDirty();
    persistState();
    io.emit('scene:fog:update', { enabled: state.scene.fogEnabled, shapes: state.scene.fogShapes });
  });

  socket.on('scene:fog:undo', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit fog of war.');
    state.scene.fogShapes.pop();
    markSceneDirty();
    persistState();
    io.emit('scene:fog:update', { enabled: state.scene.fogEnabled, shapes: state.scene.fogShapes });
  });

  socket.on('scene:fog:reset', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can reset fog of war.');
    state.scene.fogShapes = [];
    markSceneDirty();
    persistState();
    io.emit('scene:fog:update', { enabled: state.scene.fogEnabled, shapes: state.scene.fogShapes });
  });

  socket.on('scene:doodle:add', requested => {
    if (!isDm(socket) && !(socket.data.identified && state.scene.playerDoodlingEnabled)) {
      return deny(socket, 'The Dungeon Master has not enabled player doodling for this scene.');
    }
    const doodlePath = cleanDoodlePath(requested, socket);
    if (!doodlePath) return;
    state.scene.doodlePaths.push(doodlePath);
    state.scene.doodlePaths = state.scene.doodlePaths.slice(-1000);
    markSceneDirty();
    persistState();
    io.emit('scene:doodle:add', publicDoodlePath(doodlePath));
  });

  socket.on('scene:doodle:undo', () => {
    if (!isDm(socket) && !(socket.data.identified && state.scene.playerDoodlingEnabled)) {
      return deny(socket, 'The Dungeon Master has not enabled player doodling for this scene.');
    }
    if (isDm(socket)) {
      state.scene.doodlePaths.pop();
    } else {
      const authorKey = doodleAuthorKey(socket);
      let index = -1;
      for (let i = state.scene.doodlePaths.length - 1; i >= 0; i -= 1) {
        if (state.scene.doodlePaths[i].authorKey === authorKey) {
          index = i;
          break;
        }
      }
      if (index < 0) return deny(socket, 'You do not have a drawing stroke to undo.');
      state.scene.doodlePaths.splice(index, 1);
    }
    markSceneDirty();
    persistState();
    io.emit('scene:doodle:redrawAll', state.scene.doodlePaths.map(publicDoodlePath));
  });

  socket.on('scene:doodle:clear', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit map drawings.');
    state.scene.doodlePaths = [];
    markSceneDirty();
    persistState();
    io.emit('scene:doodle:clear');
  });
}

module.exports = { registerSceneHandlers };
