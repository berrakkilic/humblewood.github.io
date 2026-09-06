function registerNotificationHandlers(socket, room) {
  const { cleanNotification, deny, emitNotifications, isDm, persistState, state } = room;

  function addNotification(notification) {
    const cleaned = cleanNotification({
      ...notification,
      id: `notification_${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      read: false
    });
    if (!cleaned) return null;
    state.notifications.unshift(cleaned);
    state.notifications = state.notifications.slice(0, 100);
    persistState();
    emitNotifications();
    return cleaned;
  }

  socket.on('safety:request', () => {
    if (!socket.data.identified || isDm(socket)) return deny(socket, 'Only players can send a safety request.');
    const now = Date.now();
    if (now - Number(socket.data.lastSafetyRequest || 0) < 15000) {
      return socket.emit('safety:submitted', { cooldown: true, breakMinutes: 15 });
    }
    socket.data.lastSafetyRequest = now;
    addNotification({ type: 'safety', anonymous: true });
    socket.emit('safety:submitted', { cooldown: true, breakMinutes: 15 });
  });

  socket.on('question:submit', (requested = {}) => {
    if (!socket.data.identified || isDm(socket)) return deny(socket, 'Only players can send a question to the DM.');
    const question = String(requested.question || '').trim().slice(0, 1200);
    if (!question) return deny(socket, 'Write a question before sending it.');
    const now = Date.now();
    if (now - Number(socket.data.lastQuestionSubmission || 0) < 3000) {
      return deny(socket, 'Please wait a moment before sending another question.');
    }
    socket.data.lastQuestionSubmission = now;
    const anonymous = !!requested.anonymous;
    addNotification({
      type: 'question',
      anonymous,
      senderName: anonymous ? null : socket.data.name,
      question
    });
    socket.emit('question:submitted');
  });

  socket.on('notifications:markRead', ({ id } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can manage notifications.');
    const notification = state.notifications.find(entry => entry.id === String(id || ''));
    if (!notification) return;
    notification.read = true;
    persistState();
    emitNotifications();
  });

  socket.on('notifications:markAllRead', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can manage notifications.');
    state.notifications.forEach(notification => { notification.read = true; });
    persistState();
    emitNotifications();
  });

  socket.on('notifications:clear', ({ id } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can manage notifications.');
    const notificationId = String(id || '');
    state.notifications = state.notifications.filter(notification => notification.id !== notificationId);
    persistState();
    emitNotifications();
  });

  socket.on('notifications:clearAll', () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can manage notifications.');
    state.notifications = [];
    persistState();
    emitNotifications();
  });
}

module.exports = { registerNotificationHandlers };
