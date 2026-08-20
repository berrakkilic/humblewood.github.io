function registerInitiativeHandlers(socket, room) {
  const { deny, isDm, markSceneDirty, persistState, upsertInitiativeEntry } = room;
  const { io, state } = room;

  socket.on('initiative:add', ({ name, value, tokenId }) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can add initiative manually.');
    upsertInitiativeEntry({ name, value, tokenId });
    markSceneDirty();
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:remove', ({ id }) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can change turn order.');
    const currentId = state.initiative.entries[state.initiative.currentIndex]?.id || null;
    const index = state.initiative.entries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      state.initiative.entries.splice(index, 1);
      state.initiative.currentIndex = currentId && currentId !== id
        ? state.initiative.entries.findIndex(entry => entry.id === currentId)
        : Math.min(index, state.initiative.entries.length - 1);
      markSceneDirty();
    }
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:next', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can advance turns.');
    if (state.initiative.entries.length === 0) return;
    const next = state.initiative.currentIndex + 1;
    if (next >= state.initiative.entries.length) {
      state.initiative.currentIndex = 0;
      state.initiative.round += 1;
    } else {
      state.initiative.currentIndex = next;
    }
    markSceneDirty();
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:reset', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can reset initiative.');
    state.initiative = { entries: [], round: 1, currentIndex: -1 };
    markSceneDirty();
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:edit', ({ id, value } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit initiative.');
    const entry = state.initiative.entries.find(item => item.id === String(id || ''));
    if (!entry || !Number.isFinite(Number(value))) return;
    entry.value = Math.max(-999, Math.min(999, Number(value)));
    markSceneDirty();
    persistState();
    io.emit('initiative:update', state.initiative);
  });

  socket.on('initiative:reorder', ({ orderedIds } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can reorder initiative.');
    if (!Array.isArray(orderedIds) || orderedIds.length !== state.initiative.entries.length) return;
    const byId = new Map(state.initiative.entries.map(entry => [entry.id, entry]));
    if (new Set(orderedIds).size !== orderedIds.length || orderedIds.some(id => !byId.has(id))) return;
    const currentId = state.initiative.entries[state.initiative.currentIndex]?.id || null;
    state.initiative.entries = orderedIds.map(id => byId.get(id));
    state.initiative.currentIndex = currentId
      ? state.initiative.entries.findIndex(entry => entry.id === currentId)
      : -1;
    markSceneDirty();
    persistState();
    io.emit('initiative:update', state.initiative);
  });
}

module.exports = { registerInitiativeHandlers };
