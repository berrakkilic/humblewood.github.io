function registerJukeboxHandlers(socket, room) {
  const { deny, io, isDm, persistState, state } = room;

  socket.on('jukebox:setPlaylist', playlist => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit the playlist.');
    state.jukebox.playlist = Array.isArray(playlist) ? playlist.slice(0, 100) : [];
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:play', ({ index } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can control playback.');
    state.jukebox.currentIndex = Math.max(0, Math.min(state.jukebox.playlist.length - 1, Number(index) || 0));
    state.jukebox.isPlaying = true;
    state.jukebox.startedAt = Date.now();
    state.jukebox.seek = 0;
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:pause', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can control playback.');
    state.jukebox.isPlaying = false;
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });

  socket.on('jukebox:resume', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can control playback.');
    state.jukebox.isPlaying = true;
    state.jukebox.startedAt = Date.now();
    persistState();
    io.emit('jukebox:update', state.jukebox);
  });
}

module.exports = { registerJukeboxHandlers };
