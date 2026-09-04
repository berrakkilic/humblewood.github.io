function registerTokenHandlers(socket, room) {
  const {
    CONDITIONS, applyNpcToToken, cloneJson, controlsToken, deny, emitCharacterUpdate,
    emitNpcRoster, emitSavedScenes, emitToken, isDm, markSceneDirty, normalizeCharacter,
    normalizeNpc, normalizeToken, npcFromToken, persistState, publicToken,
    removeInitiativeForTokenIds, snapCoordinateToCell, syncNpcFromToken, uniqueTokenLabel
  } = room;
  const { io, state } = room;

  socket.on('token:add', (requested = {}) => {
    if (!socket.data.identified) return deny(socket, 'Join the table before adding a token.');
    let token;
    if (!isDm(socket)) {
      const character = state.characters[String(requested.characterName || '')];
      if (!room.ownsCharacter(socket, character)) return deny(socket, 'You can only place your own character on the map.');
      const existing = state.tokens.find(entry => entry.characterName === character.name);
      if (existing) return socket.emit('token:exists', publicToken(socket, existing));
      normalizeCharacter(character);
      token = {
        id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        characterName: character.name,
        ownerUsername: character.ownerUsername || socket.data.username,
        ownerId: null,
        label: character.name,
        pronouns: character.pronouns,
        kind: 'pc',
        imageUrl: character.portraitUrl || null,
        x: snapCoordinateToCell(state.scene.gridSize / 2, state.scene.gridSize, state.scene.gridOffsetX),
        y: snapCoordinateToCell(state.scene.gridSize / 2, state.scene.gridSize, state.scene.gridOffsetY),
        size: 44,
        sizeScale: 1,
        coordinateMode: 'center',
        hp: character.hp,
        maxHp: character.maxHp,
        tempHp: character.tempHp,
        visibleToPlayers: true
      };
      if (!character.ownerUsername) character.ownerUsername = socket.data.username;
      character.ownerId = null;
    } else {
      const linkedCharacter = state.characters[String(requested.characterName || requested.label || '')];
      if (linkedCharacter) normalizeCharacter(linkedCharacter);
      const kind = linkedCharacter ? 'pc' : (['pc', 'npc', 'item'].includes(requested.kind) ? requested.kind : 'npc');
      token = {
        id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        label: String(requested.label || linkedCharacter?.name || 'Token').trim().slice(0, 100),
        pronouns: linkedCharacter?.pronouns || requested.pronouns || '',
        kind,
        imageUrl: String(requested.imageUrl || linkedCharacter?.portraitUrl || '').slice(0, 1000) || null,
        x: Number.isFinite(Number(requested.x))
          ? Number(requested.x)
          : snapCoordinateToCell(state.scene.gridSize / 2, state.scene.gridSize, state.scene.gridOffsetX),
        y: Number.isFinite(Number(requested.y))
          ? Number(requested.y)
          : snapCoordinateToCell(state.scene.gridSize / 2, state.scene.gridSize, state.scene.gridOffsetY),
        size: Math.max(18, Math.min(180, Number(requested.size) || 44)),
        sizeScale: Math.max(0.35, Math.min(3, Number(requested.sizeScale) || 1)),
        coordinateMode: 'center',
        hp: linkedCharacter ? linkedCharacter.hp : (kind === 'item' ? null : Math.max(0, Number(requested.hp) || 10)),
        maxHp: linkedCharacter ? linkedCharacter.maxHp : (kind === 'item' ? null : Math.max(1, Number(requested.maxHp ?? requested.hp) || 10)),
        tempHp: linkedCharacter ? linkedCharacter.tempHp : 0,
        visibleToPlayers: requested.visibleToPlayers !== false,
        characterName: linkedCharacter?.name || null,
        ownerUsername: linkedCharacter?.ownerUsername || null,
        ownerId: null
      };
      if (kind === 'npc') {
        const npc = normalizeNpc({
          id: requested.npcId,
          name: token.label,
          pronouns: requested.pronouns,
          imageUrl: token.imageUrl,
          hp: token.hp,
          maxHp: token.maxHp,
          ac: requested.ac,
          initiativeModifier: requested.initiativeModifier,
          attacks: requested.attacks,
          spells: requested.spells,
          spellcasting: requested.spellcasting,
          sheet: requested.sheet,
          notes: requested.notes
        });
        state.npcs[npc.id] = npc;
        applyNpcToToken(npc, token);
      }
    }
    normalizeToken(token);
    state.tokens.push(token);
    markSceneDirty();
    persistState();
    emitToken('token:add', token);
    if (token.kind === 'npc') emitNpcRoster();
    if (token.characterName) emitCharacterUpdate(state.characters[token.characterName]);
  });

  socket.on('token:move', ({ id, x, y } = {}) => {
    const token = state.tokens.find(entry => entry.id === id);
    if (!controlsToken(socket, token)) return deny(socket, 'You can only move your own character token.');
    if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
    token.x = Math.max(-5000, Math.min(50000, Number(x)));
    token.y = Math.max(-5000, Math.min(50000, Number(y)));
    markSceneDirty();
    persistState();
    io.emit('token:move', { id, x: token.x, y: token.y });
  });

  socket.on('token:update', (updated = {}) => {
    const token = state.tokens.find(entry => entry.id === updated.id);
    if (!isDm(socket) || !token) return deny(socket, 'Only the Dungeon Master can edit token details.');
    if (updated.hp !== undefined && !token.characterName) token.hp = Math.max(0, Number(updated.hp) || 0);
    if (updated.maxHp !== undefined && !token.characterName) token.maxHp = Math.max(0, Number(updated.maxHp) || 0);
    if (updated.visibleToPlayers !== undefined) token.visibleToPlayers = !!updated.visibleToPlayers;
    if (updated.sizeScale !== undefined) token.sizeScale = Math.max(0.35, Math.min(3, Number(updated.sizeScale) || 1));
    normalizeToken(token);
    syncNpcFromToken(token);
    markSceneDirty();
    persistState();
    emitToken('token:update', token);
    if (token.kind === 'npc') emitNpcRoster();
  });

  socket.on('token:remove', ({ id } = {}) => {
    const token = state.tokens.find(entry => entry.id === id);
    if (!controlsToken(socket, token)) return deny(socket, 'You can only remove your own character token.');
    state.tokens = state.tokens.filter(entry => entry.id !== id);
    removeInitiativeForTokenIds([id]);
    markSceneDirty();
    persistState();
    io.emit('token:remove', { id });
    io.emit('initiative:update', state.initiative);
  });

  socket.on('token:duplicate', ({ id } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can duplicate tokens.');
    const source = state.tokens.find(token => token.id === String(id || ''));
    if (!source) return deny(socket, 'That token is no longer on the map.');
    const duplicate = cloneJson(source);
    duplicate.id = `t${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    duplicate.x = Math.max(-5000, Math.min(50000, Number(source.x) + state.scene.gridSize));
    duplicate.y = Number(source.y);
    duplicate.coordinateMode = 'center';
    if (source.kind === 'npc') {
      const npcSource = state.npcs[source.npcId] || npcFromToken(source);
      const npc = normalizeNpc({
        ...cloneJson(npcSource),
        id: `npc_${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
        name: uniqueTokenLabel(source.label)
      });
      state.npcs[npc.id] = npc;
      duplicate.npcId = npc.id;
      duplicate.label = npc.name;
      applyNpcToToken(npc, duplicate);
    } else if (source.kind === 'item') {
      duplicate.label = uniqueTokenLabel(source.label);
    }
    normalizeToken(duplicate);
    state.tokens.push(duplicate);
    markSceneDirty();
    persistState();
    emitToken('token:add', duplicate);
    if (duplicate.kind === 'npc') emitNpcRoster();
  });

  socket.on('npc:create', (requested = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can create NPCs.');
    const npc = normalizeNpc({
      ...requested,
      id: `npc_${Date.now()}${Math.random().toString(36).slice(2, 7)}`
    });
    state.npcs[npc.id] = npc;
    persistState();
    emitNpcRoster();
    socket.emit('npc:saved', { id: npc.id, name: npc.name });
  });

  socket.on('npc:place', ({ id } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can place NPCs.');
    const npc = state.npcs[String(id || '')];
    if (!npc) return deny(socket, 'That NPC no longer exists.');
    const existing = state.tokens.find(token => token.npcId === npc.id);
    if (existing) return socket.emit('token:exists', publicToken(socket, existing));
    const token = applyNpcToToken(npc, {
      id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      x: snapCoordinateToCell(state.scene.gridSize / 2, state.scene.gridSize, state.scene.gridOffsetX),
      y: snapCoordinateToCell(state.scene.gridSize / 2, state.scene.gridSize, state.scene.gridOffsetY),
      size: 44,
      sizeScale: npc.tokenScale,
      coordinateMode: 'center',
      visibleToPlayers: true,
      ownerUsername: null,
      ownerId: null
    });
    state.tokens.push(token);
    markSceneDirty();
    persistState();
    emitToken('token:add', token);
    emitNpcRoster();
  });

  socket.on('npc:update', (requested = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can edit NPCs.');
    const existing = state.npcs[String(requested.id || '')];
    if (!existing) return deny(socket, 'That NPC no longer exists.');
    const updated = normalizeNpc({
      ...existing,
      ...requested,
      id: existing.id,
      imageUrl: requested.imageUrl === undefined ? existing.imageUrl : requested.imageUrl,
      combat: {
        ...existing.combat,
        spellSlots: requested.combat?.spellSlots || existing.combat?.spellSlots
      }
    });
    state.npcs[updated.id] = updated;
    state.tokens.filter(token => token.npcId === updated.id).forEach(token => {
      const position = {
        x: token.x,
        y: token.y,
        id: token.id,
        size: token.size,
        sizeScale: token.sizeScale,
        coordinateMode: 'center',
        visibleToPlayers: token.visibleToPlayers
      };
      applyNpcToToken(updated, token);
      Object.assign(token, position);
      emitToken('token:update', token);
    });
    const activeNpcTokenIds = new Set(
      state.tokens.filter(token => token.npcId === updated.id).map(token => token.id)
    );
    state.initiative.entries
      .filter(entry => activeNpcTokenIds.has(entry.tokenId))
      .forEach(entry => { entry.name = updated.name; });
    Object.values(state.savedScenes).forEach(saved => {
      saved.tokens.filter(token => token.npcId === updated.id).forEach(token => {
        token.label = updated.name;
        token.pronouns = updated.pronouns;
        token.imageUrl = updated.imageUrl;
        token.maxHp = updated.maxHp;
        token.hp = Math.min(Number(token.hp) || 0, updated.maxHp);
        token.ac = updated.ac;
        token.initiativeModifier = updated.initiativeModifier;
        token.attacks = cloneJson(updated.attacks);
        token.spells = cloneJson(updated.spells);
        token.spellcasting = cloneJson(updated.spellcasting);
        const previousCombat = token.combat && typeof token.combat === 'object' ? token.combat : {};
        token.combat = cloneJson(updated.combat);
        token.combat.conditions = Array.isArray(previousCombat.conditions) ? previousCombat.conditions : [];
        token.combat.concentration = !!previousCombat.concentration;
        token.combat.exhaustion = Number(previousCombat.exhaustion) || 0;
        Object.entries(token.combat.spellSlots || {}).forEach(([level, slot]) => {
          const previousUsed = previousCombat.spellSlots?.[level]?.used;
          slot.used = Math.max(0, Math.min(slot.total, Number(previousUsed) || 0));
        });
        token.notes = updated.notes;
      });
      saved.initiative.entries
        .filter(entry => saved.tokens.some(token => token.id === entry.tokenId && token.npcId === updated.id))
        .forEach(entry => { entry.name = updated.name; });
    });
    markSceneDirty();
    persistState();
    emitNpcRoster();
    io.emit('initiative:update', state.initiative);
    socket.emit('npc:saved', { id: updated.id, name: updated.name });
  });

  socket.on('npc:delete', ({ id } = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can delete NPCs.');
    const npcId = String(id || '');
    const npc = state.npcs[npcId];
    if (!npc) return;
    const removedTokenIds = state.tokens.filter(token => token.npcId === npcId).map(token => token.id);
    state.tokens = state.tokens.filter(token => token.npcId !== npcId);
    removeInitiativeForTokenIds(removedTokenIds);
    Object.values(state.savedScenes).forEach(saved => {
      const savedIds = saved.tokens.filter(token => token.npcId === npcId).map(token => token.id);
      saved.tokens = saved.tokens.filter(token => token.npcId !== npcId);
      removeInitiativeForTokenIds(savedIds, saved.initiative);
    });
    delete state.npcs[npcId];
    if (removedTokenIds.length) markSceneDirty();
    persistState();
    removedTokenIds.forEach(tokenId => io.emit('token:remove', { id: tokenId }));
    io.emit('initiative:update', state.initiative);
    emitNpcRoster();
    emitSavedScenes();
    socket.emit('npc:deleted', { id: npcId, name: npc.name });
  });

  socket.on('token:combat:update', (payload = {}) => {
    if (!isDm(socket)) return deny(socket, 'Only the Dungeon Master can manage NPC combat.');
    const token = state.tokens.find(entry => entry.id === String(payload.id || ''));
    if (!token || token.kind !== 'npc') return deny(socket, 'That NPC is not on the current map.');
    normalizeToken(token);
    const combat = token.combat;
    const amount = Math.max(0, Math.min(9999, Number(payload.amount) || 0));
    if (payload.action === 'damage' && amount) {
      const absorbed = Math.min(token.tempHp, amount);
      token.tempHp -= absorbed;
      token.hp = Math.max(0, token.hp - (amount - absorbed));
    } else if (payload.action === 'heal' && amount) {
      token.hp = Math.min(token.maxHp, token.hp + amount);
    } else if (payload.action === 'tempHp') {
      token.tempHp = amount;
    } else if (payload.action === 'condition:toggle' && CONDITIONS.has(payload.condition)) {
      combat.conditions = combat.conditions.includes(payload.condition)
        ? combat.conditions.filter(condition => condition !== payload.condition)
        : [...combat.conditions, payload.condition];
    } else if (payload.action === 'concentration:set') {
      combat.concentration = !!payload.value;
    } else if (payload.action === 'exhaustion') {
      combat.exhaustion = Math.max(0, Math.min(6, combat.exhaustion + Math.sign(Number(payload.delta) || 0)));
    } else if (payload.action === 'spellSlot') {
      const level = Math.max(1, Math.min(9, Number(payload.level) || 1));
      const slot = combat.spellSlots[level];
      slot.used = Math.max(0, Math.min(slot.total, slot.used + Math.sign(Number(payload.delta) || 0)));
    } else if (payload.action === 'restoreAllSlots') {
      Object.values(combat.spellSlots).forEach(slot => { slot.used = 0; });
    } else if (payload.action === 'longRest') {
      token.hp = token.maxHp;
      token.tempHp = 0;
      combat.concentration = false;
      combat.exhaustion = Math.max(0, combat.exhaustion - 1);
      Object.values(combat.spellSlots).forEach(slot => { slot.used = 0; });
    } else {
      return;
    }
    syncNpcFromToken(token);
    markSceneDirty();
    persistState();
    emitToken('token:update', token);
    emitNpcRoster();
  });
}

module.exports = { registerTokenHandlers };
