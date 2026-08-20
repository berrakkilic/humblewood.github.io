function registerAuthHandlers(socket, room) {
  const {
    db, deny, dmPin, isDm, makePasswordRecord, normalizeUsername, publicStateFor,
    validPassword, validUsername, verifyPassword
  } = room;

  socket.data.authAttempts = 0;
  const rejectIdentity = message => {
    socket.data.authAttempts += 1;
    socket.emit('identify:result', { ok: false, message });
    if (socket.data.authAttempts >= 10) setTimeout(() => socket.disconnect(true), 150);
  };

  socket.on('identify', async (payload = {}) => {
    const requestedRole = payload.role === 'dm' ? 'dm' : 'player';
    let name;
    let username = null;
    try {
      if (requestedRole === 'dm') {
        if (String(payload.dmPin || '') !== dmPin) {
          return rejectIdentity('That Dungeon Master PIN is not correct.');
        }
        name = String(payload.name || '').trim().slice(0, 80) || 'The DM';
      } else {
        username = normalizeUsername(payload.username);
        const password = String(payload.password || '');
        if (!validUsername(username)) {
          return rejectIdentity('Use a 3–32 character username containing letters, numbers, dots, dashes or underscores.');
        }
        if (!validPassword(password)) return rejectIdentity('Passwords must be between 8 and 128 characters.');
        const existingResult = await db.execute({
          sql: 'SELECT * FROM player_accounts WHERE username = ?',
          args: [username]
        });
        const existing = existingResult.rows[0];
        if (payload.authMode === 'register') {
          if (existing) return rejectIdentity('That username is already taken. Choose Sign in if it belongs to you.');
          name = String(payload.name || '').trim().slice(0, 80) || username;
          const passwordRecord = await makePasswordRecord(password);
          await db.execute({
            sql: 'INSERT INTO player_accounts (username, display_name, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
            args: [username, name, passwordRecord.passwordHash, passwordRecord.salt, Date.now()]
          });
        } else {
          if (!existing || !(await verifyPassword(password, existing.salt, existing.password_hash))) {
            return rejectIdentity('The username or password is incorrect.');
          }
          name = String(existing.display_name).slice(0, 80);
        }
      }
    } catch (error) {
      console.error('Account sign-in failed:', error.message);
      return rejectIdentity('The account could not be checked right now. Please try again.');
    }

    socket.data.role = requestedRole;
    socket.data.name = name;
    socket.data.username = username;
    socket.data.identified = true;
    socket.data.authAttempts = 0;
    socket.emit('identify:result', { ok: true, role: requestedRole, name, username });
    socket.emit('state:full', publicStateFor(socket));
    room.io.emit('presence', { role: requestedRole, name, connected: true });
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
      socket.emit('account:passwordReset', { username });
    } catch (error) {
      console.error('Could not reset account password:', error.message);
      deny(socket, 'That password could not be reset right now.');
    }
  });
}

module.exports = { registerAuthHandlers };
