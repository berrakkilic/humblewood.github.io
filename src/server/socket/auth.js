const AUTH_COOKIE_NAME = 'humblewood_session';

function cookieValue(header, name) {
  const prefix = `${name}=`;
  const part = String(header || '').split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!part) return '';
  try {
    return decodeURIComponent(part.slice(prefix.length));
  } catch {
    return '';
  }
}

function registerAuthHandlers(socket, room) {
  const {
    authSessionIdentity, authenticateIdentity, db, deny, isDm, makePasswordRecord,
    normalizeUsername, publicStateFor, revokeAuthSessionsForUsername, validPassword
  } = room;

  socket.data.authAttempts = 0;

  const rejectIdentity = message => {
    socket.data.authAttempts += 1;
    socket.emit('identify:result', { ok: false, message });
    if (socket.data.authAttempts >= 10) setTimeout(() => socket.disconnect(true), 150);
  };

  const completeIdentity = (identity, restored = false) => {
    socket.data.role = identity.role;
    socket.data.name = identity.name;
    socket.data.username = identity.username || null;
    socket.data.identified = true;
    socket.data.authAttempts = 0;
    socket.emit('identify:result', {
      ok: true,
      role: identity.role,
      name: identity.name,
      username: identity.username || null,
      restored
    });
    socket.emit('state:full', publicStateFor(socket));
    room.io.emit('presence', { role: identity.role, name: identity.name, connected: true });
  };

  // Kept for older clients and automated tests. The browser UI uses the HTTP
  // session endpoint so the credential never has to be stored in JavaScript.
  socket.on('identify', async (payload = {}) => {
    try {
      const result = await authenticateIdentity(payload);
      if (!result.ok) return rejectIdentity(result.message);
      completeIdentity(result, false);
    } catch (error) {
      console.error('Account sign-in failed:', error.message);
      rejectIdentity('The account could not be checked right now. Please try again.');
    }
  });

  socket.on('session:resume', async () => {
    if (socket.data.identified) return;
    try {
      const token = cookieValue(socket.request?.headers?.cookie, AUTH_COOKIE_NAME);
      const identity = token ? await authSessionIdentity(token) : null;
      if (!identity) return socket.emit('session:result', { ok: false });
      completeIdentity(identity, true);
      socket.emit('session:result', { ok: true });
    } catch (error) {
      console.error('Session restore failed:', error.message);
      socket.emit('session:result', { ok: false });
    }
  });

  socket.on('accounts:list', async () => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can view player accounts.');
    try {
      const result = await db.execute('SELECT username, display_name, created_at FROM player_accounts ORDER BY display_name COLLATE NOCASE');
      socket.emit('accounts:update', result.rows.map(row => ({
        username: String(row.username),
        displayName: String(row.display_name),
        createdAt: Number(row.created_at)
      })));
    } catch (error) {
      console.error('Could not list accounts:', error.message);
      deny(socket, 'Player accounts could not be loaded right now.');
    }
  });

  socket.on('account:resetPassword', async ({ username: requestedUsername, password } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can reset player passwords.');
    const username = normalizeUsername(requestedUsername);
    if (!validPassword(password)) return deny(socket, 'The new password must be between 8 and 128 characters.');
    try {
      const existing = await db.execute({
        sql: 'SELECT username FROM player_accounts WHERE username = ?',
        args: [username]
      });
      if (!existing.rows.length) return deny(socket, 'No player account uses that username.');
      const passwordRecord = await makePasswordRecord(password);
      await db.execute({
        sql: 'UPDATE player_accounts SET password_hash = ?, salt = ? WHERE username = ?',
        args: [passwordRecord.passwordHash, passwordRecord.salt, username]
      });
      await revokeAuthSessionsForUsername(username);
      socket.emit('account:passwordReset', { username });
    } catch (error) {
      console.error('Could not reset account password:', error.message);
      deny(socket, 'That password could not be reset right now.');
    }
  });
}

module.exports = { AUTH_COOKIE_NAME, cookieValue, registerAuthHandlers };
