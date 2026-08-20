function registerPresenceHandlers(socket, room) {
  const { io, pointerColor } = room;

  socket.on('pointer:move', ({ x, y } = {}) => {
    if (!socket.data.identified || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
    const now = Date.now();
    if (now - (socket.data.lastPointerAt || 0) < 35) return;
    socket.data.lastPointerAt = now;
    io.emit('pointer:move', {
      id: socket.id,
      name: socket.data.name,
      color: pointerColor(socket.data.name),
      x: Math.max(-5000, Math.min(50000, Number(x))),
      y: Math.max(-5000, Math.min(50000, Number(y)))
    });
  });

  socket.on('pointer:ping', ({ x, y } = {}) => {
    if (!socket.data.identified || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
    const now = Date.now();
    if (now - (socket.data.lastPingAt || 0) < 250) return;
    socket.data.lastPingAt = now;
    io.emit('pointer:ping', {
      id: `p${now}${Math.random().toString(36).slice(2, 6)}`,
      name: socket.data.name,
      color: pointerColor(socket.data.name),
      x: Math.max(-5000, Math.min(50000, Number(x))),
      y: Math.max(-5000, Math.min(50000, Number(y)))
    });
  });

  socket.on('pointer:hide', () => {
    if (socket.data.identified) io.emit('pointer:hide', { id: socket.id });
  });

  socket.on('disconnect', () => {
    io.emit('pointer:hide', { id: socket.id });
    if (socket.data.name) {
      io.emit('presence', { role: socket.data.role, name: socket.data.name, connected: false });
    }
  });
}

module.exports = { registerPresenceHandlers };
