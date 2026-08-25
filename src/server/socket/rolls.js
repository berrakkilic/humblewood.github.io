function registerRollHandlers(socket, room) {
  const {
    deny, emitCharacterUpdate, isDm, markSceneDirty, normalizeCharacter,
    ownsCharacter, persistState, syncCharacterTokens, syncCombatFields,
    upsertInitiativeEntry
  } = room;
  const { io, state } = room;

  socket.on('roll:make', (payload = {}) => {
    if (!socket.data.identified) return deny(socket, 'Join the table before rolling.');
    const privateRoll = payload.private === true;
    if (privateRoll && !isDm(socket)) return deny(socket, 'Only the Dungeon Master can make private rolls.');
    const character = payload.characterName ? state.characters[String(payload.characterName)] : null;
    const npc = payload.npcId ? state.npcs[String(payload.npcId)] : null;
    const rollToken = payload.tokenId
      ? state.tokens.find(token => token.id === String(payload.tokenId))
      : null;
    if (payload.characterName && !ownsCharacter(socket, character)) {
      return deny(socket, 'You cannot roll for another player’s character.');
    }
    if (payload.npcId && (!isDm(socket) || !npc)) {
      return deny(socket, 'You cannot roll for that NPC.');
    }
    const validCharacterToken = !!character && !!rollToken && rollToken.kind === 'pc' &&
      rollToken.characterName === character.name && ownsCharacter(socket, character);
    const validNpcToken = isDm(socket) && rollToken?.kind === 'npc';
    if (payload.tokenId && !validCharacterToken && !validNpcToken) {
      return deny(socket, 'You cannot roll for that token.');
    }

    const count = Math.max(1, Math.min(20, Number(payload.count) || 1));
    const sides = Math.max(2, Math.min(1000, Number(payload.sides) || 20));
    const modifier = Math.max(-1000, Math.min(1000, Number(payload.modifier) || 0));
    const mode = ['advantage', 'disadvantage'].includes(payload.mode) && sides === 20 && count === 1
      ? payload.mode
      : 'normal';
    const actualCount = mode === 'normal' ? count : 2;
    const rolls = Array.from({ length: actualCount }, () => 1 + Math.floor(Math.random() * sides));
    const kept = mode === 'advantage'
      ? Math.max(...rolls)
      : mode === 'disadvantage' ? Math.min(...rolls) : null;
    const diceTotal = kept ?? rolls.reduce((total, roll) => total + roll, 0);
    const total = diceTotal + modifier;
    const expression = mode === 'normal'
      ? `${count}d${sides}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`
      : `2d20${mode === 'advantage' ? 'kh1' : 'kl1'}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;
    const rollerName = String(socket.data.name || 'Someone').slice(0, 80);
    const entry = {
      id: `r${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      name: rollToken
        ? `${rollerName} as ${rollToken.label}`
        : (npc
          ? `${rollerName} as ${npc.name}`
          : (character && rollerName !== character.name
          ? `${rollerName} as ${character.name}`
          : (character?.name || rollerName))),
      characterName: character?.name || null,
      npcId: npc?.id || rollToken?.npcId || null,
      label: String(payload.label || '').slice(0, 140),
      expression,
      rolls,
      kept,
      mode,
      modifier,
      total,
      ts: Date.now()
    };
    const hasTargetDc = payload.targetDc !== null && payload.targetDc !== undefined &&
      payload.targetDc !== '' && Number.isFinite(Number(payload.targetDc));
    if (hasTargetDc) {
      entry.targetDc = Math.max(1, Math.min(1000, Number(payload.targetDc)));
      entry.success = total >= entry.targetDc;
    }
    if (privateRoll) {
      entry.private = true;
      socket.emit('roll:private', entry);
      return;
    }
    state.rollLog.unshift(entry);
    state.rollLog = state.rollLog.slice(0, 50);
    if (payload.initiativeName && sides === 20 && (isDm(socket) || payload.initiativeName === character?.name)) {
      const initiativeToken = rollToken || state.tokens.find(item => (
        npc ? item.npcId === npc.id : item.characterName === payload.initiativeName
      ));
      upsertInitiativeEntry({
        name: payload.initiativeName,
        value: total,
        tokenId: initiativeToken?.id || null
      });
      markSceneDirty();
      io.emit('initiative:update', state.initiative);
    }
    if (payload.concentrationFor && character?.name === payload.concentrationFor && entry.targetDc && !entry.success) {
      normalizeCharacter(character);
      character.combat.concentration = false;
      syncCombatFields(character);
      emitCharacterUpdate(character);
      syncCharacterTokens(character);
    }
    persistState();
    io.emit('roll:made', entry);
  });
}

module.exports = { registerRollHandlers };
