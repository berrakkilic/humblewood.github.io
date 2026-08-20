function registerCharacterHandlers(socket, room) {
  const {
    CONDITIONS, deny, emitCharacterUpdate, emitToken, isDm, normalizeCharacter,
    ownsCharacter, persistState, removeInitiativeForTokenIds, syncCharacterTokens,
    syncCombatFields
  } = room;
  const { io, state } = room;

  socket.on('character:save', (requested = {}) => {
    if (!socket.data.identified || !requested || typeof requested !== 'object') return;
    const name = String(requested.name || '').trim().slice(0, 100);
    if (!name) return;
    const originalName = String(requested._originalName || name).trim().slice(0, 100);
    const original = state.characters[originalName];
    const destination = state.characters[name];
    if (!isDm(socket) && (
      (original && !ownsCharacter(socket, original)) ||
      (destination && destination !== original && !ownsCharacter(socket, destination))
    )) {
      return deny(socket, `You cannot edit ${name}.`);
    }
    const sheet = { ...requested };
    delete sheet._originalName;
    delete sheet.ownerId;
    delete sheet.ownerUsername;
    delete sheet.canManage;
    delete sheet.claimed;
    sheet.name = name;
    sheet.owner = isDm(socket)
      ? String(sheet.fields?.player || original?.owner || destination?.owner || 'Dungeon Master')
      : socket.data.name;
    sheet.ownerUsername = original?.ownerUsername || destination?.ownerUsername || (isDm(socket) ? null : socket.data.username);
    sheet.ownerId = isDm(socket) ? (original?.ownerId || destination?.ownerId || null) : null;
    if (original?.combat && !sheet.combat) {
      sheet.combat = {
        conditions: original.combat.conditions,
        concentration: original.combat.concentration,
        exhaustion: original.combat.exhaustion,
        stable: original.combat.stable,
        dead: original.combat.dead
      };
    }
    normalizeCharacter(sheet);
    if (originalName !== name && original) {
      delete state.characters[originalName];
      state.tokens
        .filter(token => token.characterName === originalName)
        .forEach(token => { token.characterName = name; });
      io.emit('character:remove', { name: originalName });
    }
    state.characters[name] = sheet;
    syncCharacterTokens(sheet);
    persistState();
    emitCharacterUpdate(sheet);
  });

  socket.on('character:remove', ({ name } = {}) => {
    const existing = state.characters[name];
    if (!ownsCharacter(socket, existing)) return deny(socket, `You cannot delete ${name || 'that character'}.`);
    delete state.characters[name];
    const removedTokenIds = state.tokens.filter(token => token.characterName === name).map(token => token.id);
    state.tokens = state.tokens.filter(token => token.characterName !== name);
    removeInitiativeForTokenIds(removedTokenIds);
    persistState();
    io.emit('character:remove', { name });
    removedTokenIds.forEach(id => io.emit('token:remove', { id }));
    io.emit('initiative:update', state.initiative);
  });

  socket.on('character:claim', ({ name } = {}) => {
    const character = state.characters[name];
    if (!character || isDm(socket) || character.ownerUsername || !ownsCharacter(socket, character)) {
      return deny(socket, 'That character cannot be claimed by this player.');
    }
    character.ownerUsername = socket.data.username;
    character.ownerId = null;
    character.owner = socket.data.name;
    syncCharacterTokens(character);
    persistState();
    emitCharacterUpdate(character);
  });

  socket.on('character:ownership:release', ({ name } = {}) => {
    const character = state.characters[name];
    if (!isDm(socket) || !character) return deny(socket, 'Only the Dungeon Master can release character ownership.');
    character.ownerId = null;
    character.ownerUsername = null;
    state.tokens.filter(token => token.characterName === name).forEach(token => {
      token.ownerId = null;
      token.ownerUsername = null;
      emitToken('token:update', token);
    });
    persistState();
    emitCharacterUpdate(character);
  });

  socket.on('character:combat:update', (payload = {}) => {
    const character = state.characters[String(payload.name || '')];
    if (!ownsCharacter(socket, character)) return deny(socket, 'You can only manage combat for your own character.');
    normalizeCharacter(character);
    const combat = character.combat;
    const amount = Math.max(0, Math.min(9999, Number(payload.amount) || 0));
    if (payload.action === 'damage' && amount) {
      const absorbed = Math.min(character.tempHp, amount);
      character.tempHp -= absorbed;
      character.hp = Math.max(0, character.hp - (amount - absorbed));
      if (combat.concentration) {
        const dc = Math.max(10, Math.floor(amount / 2));
        for (const client of io.sockets.sockets.values()) {
          if (ownsCharacter(client, character)) {
            client.emit('concentration:required', { name: character.name, damage: amount, dc });
          }
        }
      }
    } else if (payload.action === 'heal' && amount) {
      character.hp = Math.min(character.maxHp, character.hp + amount);
      if (character.hp > 0) {
        combat.deathSaves = { successes: 0, failures: 0 };
        combat.stable = false;
        combat.dead = false;
      }
    } else if (payload.action === 'tempHp') {
      character.tempHp = amount;
    } else if (payload.action === 'condition:toggle' && CONDITIONS.has(payload.condition)) {
      combat.conditions = combat.conditions.includes(payload.condition)
        ? combat.conditions.filter(condition => condition !== payload.condition)
        : [...combat.conditions, payload.condition];
    } else if (payload.action === 'concentration:set') {
      combat.concentration = !!payload.value;
    } else if (payload.action === 'exhaustion') {
      combat.exhaustion = Math.max(0, Math.min(6, combat.exhaustion + Math.sign(Number(payload.delta) || 0)));
    } else if (payload.action === 'deathSave') {
      const kind = payload.kind === 'failures' ? 'failures' : 'successes';
      combat.deathSaves[kind] = Math.max(
        0,
        Math.min(3, combat.deathSaves[kind] + Math.sign(Number(payload.delta) || 0))
      );
      combat.stable = combat.deathSaves.successes >= 3;
      combat.dead = combat.deathSaves.failures >= 3;
    } else if (payload.action === 'spellSlot') {
      const level = Math.max(1, Math.min(9, Number(payload.level) || 1));
      const slot = combat.spellSlots[level];
      slot.used = Math.max(0, Math.min(slot.total, slot.used + Math.sign(Number(payload.delta) || 0)));
    } else if (payload.action === 'restoreAllSlots') {
      Object.values(combat.spellSlots).forEach(slot => { slot.used = 0; });
    } else if (payload.action === 'longRest') {
      character.hp = character.maxHp;
      character.tempHp = 0;
      combat.concentration = false;
      combat.deathSaves = { successes: 0, failures: 0 };
      combat.stable = false;
      combat.dead = false;
      combat.exhaustion = Math.max(0, combat.exhaustion - 1);
      Object.values(combat.spellSlots).forEach(slot => { slot.used = 0; });
    } else {
      return;
    }
    syncCombatFields(character);
    syncCharacterTokens(character);
    persistState();
    emitCharacterUpdate(character);
  });
}

module.exports = { registerCharacterHandlers };
