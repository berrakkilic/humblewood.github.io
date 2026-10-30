function registerSceneHandlers(socket, room) {
  const {
    broadcastState, cleanDoodlePath, cleanFogShape, cloneJson, defaultState, deny,
    doodleAuthorKey, emitNpcRoster, emitSavedScenes, emitSceneUpdate, isDm, pointToSegmentDistance,
    markSceneDirty, normalizeToken, persistState, publicDoodlePath, setSceneDirty,
    snapCoordinateToCell, syncCharacterTokens, syncNpcRosterFromTokens
  } = room;
  const { io, state } = room;

  function doodlePathsFor(layer) {
    return layer === 'corner' ? state.scene.doodleCornerPaths : state.scene.doodlePaths;
  }

  function doodleHistoryFor(layer) {
    if (!socket.data.doodleUndoHistory) socket.data.doodleUndoHistory = { map: [], corner: [] };
    return socket.data.doodleUndoHistory[layer];
  }

  function rememberDoodleAction(layer, action) {
    const history = doodleHistoryFor(layer);
    history.push(cloneJson(action));
    if (history.length > 100) history.shift();
  }

  function emitDoodleRedraw(layer) {
    const paths = doodlePathsFor(layer);
    io.emit(layer === 'corner' ? 'scene:doodleCorner:redrawAll' : 'scene:doodle:redrawAll', paths.map(publicDoodlePath));
  }

  function undoDoodleAction(layer) {
    const action = doodleHistoryFor(layer).pop();
    if (!action) return false;
    const paths = doodlePathsFor(layer);
    if (action.type === 'add') {
      const index = paths.findIndex(path => path.id === action.path.id);
      if (index >= 0) paths.splice(index, 1);
    } else if (action.type === 'erase') {
      if (!paths.some(path => path.id === action.path.id)) paths.splice(Math.min(action.index, paths.length), 0, action.path);
    } else if (action.type === 'clear') {
      action.paths.forEach(entry => {
        if (!paths.some(path => path.id === entry.path.id)) paths.splice(Math.min(entry.index, paths.length), 0, entry.path);
      });
    }
    markSceneDirty();
    persistState();
    emitDoodleRedraw(layer);
    return true;
  }

  socket.on('scene:setMap', ({ mapUrl, mapName } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the map.');
    state.scene.mapUrl = String(mapUrl || '').slice(0, 1000) || null;
    state.scene.mapName = String(mapName || 'Map').slice(0, 140);
    state.scene.doodlePaths = [];
    if (socket.data.doodleUndoHistory) socket.data.doodleUndoHistory.map = [];
    state.scene.fogShapes = [];
    markSceneDirty();
    persistState();
    emitSceneUpdate();
  });

  socket.on('scene:setGrid', ({ gridSize, gridVisible, gridColor, snapToGrid, fitTokensToGrid, gridOffsetX, gridOffsetY } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the grid.');
    const previousSize = state.scene.gridSize;
    if (gridSize !== undefined) state.scene.gridSize = Math.max(10, Math.min(300, Number(gridSize) || 50));
    if (gridVisible !== undefined) state.scene.gridVisible = !!gridVisible;
    if (gridColor !== undefined && /^#[0-9a-f]{6}$/i.test(String(gridColor))) {
      state.scene.gridColor = String(gridColor).toLowerCase();
    }
    if (snapToGrid !== undefined) state.scene.snapToGrid = !!snapToGrid;
    if (fitTokensToGrid !== undefined) state.scene.fitTokensToGrid = !!fitTokensToGrid;
    if (gridOffsetX !== undefined) {
      const size = state.scene.gridSize;
      state.scene.gridOffsetX = ((Number(gridOffsetX) || 0) % size + size) % size;
    }
    if (gridOffsetY !== undefined) {
      const size = state.scene.gridSize;
      state.scene.gridOffsetY = ((Number(gridOffsetY) || 0) % size + size) % size;
    }
    if (state.scene.fitTokensToGrid && (previousSize !== state.scene.gridSize || fitTokensToGrid === true)) {
      state.tokens.forEach(token => {
        token.x = snapCoordinateToCell(token.x, state.scene.gridSize, state.scene.gridOffsetX);
        token.y = snapCoordinateToCell(token.y, state.scene.gridSize, state.scene.gridOffsetY);
      });
    }
    markSceneDirty();
    persistState();
    broadcastState();
  });

  socket.on('scene:setTimeOfDay', ({ timeOfDay } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change the time of day.');
    if (!['morning', 'afternoon', 'night'].includes(timeOfDay)) return;
    state.scene.timeOfDay = timeOfDay;
    markSceneDirty();
    persistState();
    emitSceneUpdate();
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
    rememberDoodleAction('map', { type: 'add', path: doodlePath });
    state.scene.doodlePaths = state.scene.doodlePaths.slice(-1000);
    markSceneDirty();
    persistState();
    io.emit('scene:doodle:add', publicDoodlePath(doodlePath));
  });

  socket.on('scene:doodle:undo', () => {
    if (!isDm(socket) && !(socket.data.identified && state.scene.playerDoodlingEnabled)) {
      return deny(socket, 'The Dungeon Master has not enabled player doodling for this scene.');
    }
    if (!undoDoodleAction('map')) return deny(socket, 'You do not have a drawing stroke or doodle action to undo.');
  });

  socket.on('scene:doodle:erase', ({ x, y } = {}) => {
    if (!isDm(socket) && !(socket.data.identified && state.scene.playerDoodlingEnabled)) {
      return deny(socket, 'The Dungeon Master has not enabled player doodling for this scene.');
    }
    const point = { x: Number(x), y: Number(y) };
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const authorKey = doodleAuthorKey(socket);
    const maxDistance = 18;
    let nearestIndex = -1;
    let nearestDistance = maxDistance;
    state.scene.doodlePaths.forEach((path, index) => {
      if (!isDm(socket) && path.authorKey !== authorKey) return;
      for (let pointIndex = 1; pointIndex < path.points.length; pointIndex += 1) {
        const distance = pointToSegmentDistance(point, path.points[pointIndex - 1], path.points[pointIndex]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }
    });
    if (nearestIndex < 0) return;
    const [removed] = state.scene.doodlePaths.splice(nearestIndex, 1);
    rememberDoodleAction('map', { type: 'erase', path: removed, index: nearestIndex });
    markSceneDirty();
    persistState();
    io.emit('scene:doodle:redrawAll', state.scene.doodlePaths.map(publicDoodlePath));
  });

  socket.on('scene:doodle:clear', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit map drawings.');
    rememberDoodleAction('map', {
      type: 'clear',
      paths: state.scene.doodlePaths.map((path, index) => ({ path, index }))
    });
    state.scene.doodlePaths = [];
    markSceneDirty();
    persistState();
    io.emit('scene:doodle:clear');
  });

  socket.on('scene:doodleCorner:add', requested => {
    if (!socket.data.identified) return deny(socket, 'You must be logged in to use the doodle corner.');
    const doodlePath = cleanDoodlePath(requested, socket);
    if (!doodlePath) return;
    state.scene.doodleCornerPaths.push(doodlePath);
    rememberDoodleAction('corner', { type: 'add', path: doodlePath });
    state.scene.doodleCornerPaths = state.scene.doodleCornerPaths.slice(-500);
    markSceneDirty();
    persistState();
    io.emit('scene:doodleCorner:add', publicDoodlePath(doodlePath));
  });

  socket.on('scene:doodleCorner:undo', () => {
    if (!socket.data.identified) return deny(socket, 'You must be logged in to use the doodle corner.');
    if (!undoDoodleAction('corner')) return deny(socket, 'You do not have a doodle action to undo.');
  });

  socket.on('scene:doodleCorner:erase', ({ x, y } = {}) => {
    if (!socket.data.identified) return deny(socket, 'You must be logged in to use the doodle corner.');
    const point = { x: Number(x), y: Number(y) };
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const authorKey = doodleAuthorKey(socket);
    let nearestIndex = -1;
    let nearestDistance = 18;
    state.scene.doodleCornerPaths.forEach((path, index) => {
      if (!isDm(socket) && path.authorKey !== authorKey) return;
      for (let pointIndex = 1; pointIndex < path.points.length; pointIndex += 1) {
        const distance = pointToSegmentDistance(point, path.points[pointIndex - 1], path.points[pointIndex]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }
    });
    if (nearestIndex < 0) return;
    const [removed] = state.scene.doodleCornerPaths.splice(nearestIndex, 1);
    rememberDoodleAction('corner', { type: 'erase', path: removed, index: nearestIndex });
    markSceneDirty();
    persistState();
    io.emit('scene:doodleCorner:redrawAll', state.scene.doodleCornerPaths.map(publicDoodlePath));
  });

  socket.on('scene:doodleCorner:clear', () => {
    if (!socket.data.identified) return deny(socket, 'You must be logged in to use the doodle corner.');
    if (isDm(socket)) {
      rememberDoodleAction('corner', {
        type: 'clear',
        paths: state.scene.doodleCornerPaths.map((path, index) => ({ path, index }))
      });
      state.scene.doodleCornerPaths = [];
    } else {
      const authorKey = doodleAuthorKey(socket);
      const removed = [];
      state.scene.doodleCornerPaths = state.scene.doodleCornerPaths.filter((path, index) => {
        if (path.authorKey !== authorKey) return true;
        removed.push({ path, index });
        return false;
      });
      rememberDoodleAction('corner', { type: 'clear', paths: removed });
    }
    markSceneDirty();
    persistState();
    io.emit('scene:doodleCorner:redrawAll', state.scene.doodleCornerPaths.map(publicDoodlePath));
  });
}

module.exports = { registerSceneHandlers };
