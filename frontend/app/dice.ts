/** Shared/private dice rolls and character/NPC roll builders. */

// ================= DICE =================
document.getElementById('dm-private-roll-toggle').onclick = () => {
  if (myRole !== 'dm') return;
  dmPrivateRollsEnabled = !dmPrivateRollsEnabled;
  renderDmPrivateRollMode();
  showToast(dmPrivateRollsEnabled
    ? 'Private DM mode is on. Rolls on this screen are hidden from players.'
    : 'Shared rolls are on. New rolls on this screen will be visible to everyone.');
};

function renderDmPrivateRollMode() {
  const active = myRole === 'dm' && dmPrivateRollsEnabled;
  const toggle = document.getElementById('dm-private-roll-toggle');
  const banner = document.getElementById('dm-private-roll-banner');
  const panel = document.querySelector('.dice-panel');
  if (toggle) {
    toggle.classList.toggle('active', active);
    toggle.setAttribute('aria-pressed', String(active));
    toggle.textContent = active ? '🔒 DM mode: private' : 'Shared rolls';
  }
  if (banner) banner.classList.toggle('hidden', !active);
  if (panel) panel.classList.toggle('dm-private-mode', active);
}

function privateDiceRollActive() {
  return myRole === 'dm' && dmPrivateRollsEnabled &&
    document.getElementById('view-dice')?.classList.contains('active');
}

function setPendingDiceRollMode(mode = 'normal') {
  pendingDiceRollMode = ['advantage', 'disadvantage'].includes(mode) ? mode : 'normal';
  document.querySelectorAll('.dice-roll-mode-btn').forEach(button => {
    const active = button.dataset.mode === pendingDiceRollMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const hint = document.getElementById('dice-roll-mode-hint');
  if (hint) {
    hint.textContent = pendingDiceRollMode === 'normal'
      ? 'Choose one for your next roll.'
      : `${pendingDiceRollMode === 'advantage' ? 'Advantage' : 'Disadvantage'} is on for one roll.`;
  }
}

function consumePendingDiceRollMode() {
  const mode = pendingDiceRollMode;
  setPendingDiceRollMode('normal');
  return mode;
}

document.querySelectorAll('.dice-roll-mode-btn').forEach(button => {
  button.onclick = () => {
    const requested = button.dataset.mode;
    setPendingDiceRollMode(pendingDiceRollMode === requested ? 'normal' : requested);
  };
});

function rollDiceFromDiceScreen(count, sides, modifier, options: any = {}) {
  rollDice(count, sides, modifier, {
    ...options,
    mode: consumePendingDiceRollMode()
  });
}

document.querySelectorAll('.die-btn').forEach(btn => {
  btn.onclick = () => rollDiceFromDiceScreen(1, Number(btn.dataset.sides), 0, { label: `Quick d${btn.dataset.sides}` });
});
document.getElementById('roll-custom-btn').onclick = () => {
  rollDiceFromDiceScreen(
    Number(document.getElementById('dice-count').value) || 1,
    Number(document.getElementById('dice-sides').value) || 20,
    Number(document.getElementById('dice-mod').value) || 0,
    { label: 'Custom roll' }
  );
};

function rollDice(count, sides, modifier, options: any = {}) {
  socket.emit('roll:make', {
    name: options.name || myName,
    count,
    sides,
    modifier,
    mode: options.mode || 'normal',
    label: options.label || '',
    characterName: options.characterName || null,
    npcId: options.npcId || null,
    initiativeName: options.initiativeName || null,
    tokenId: options.tokenId || null,
    targetDc: options.targetDc || null,
    concentrationFor: options.concentrationFor || null,
    private: options.private ?? privateDiceRollActive()
  });
}

socket.on('roll:made', (entry) => {
  if (!state.rollLog) state.rollLog = [];
  state.rollLog.unshift(entry);
  if (entry.characterName && entry.targetDc) pendingConcentrationChecks.delete(entry.characterName);
  renderRollLog();
  const showOutcome = entry.targetDc && !/\b(?:attack|damage)\b/i.test(entry.label || '');
  const outcome = showOutcome ? (entry.success ? ' — success' : ' — failed') : '';
  showToast(`${entry.label || entry.expression}: ${entry.total}${outcome}`);
});

socket.on('roll:private', (entry) => {
  if (myRole !== 'dm') return;
  privateRollLog.unshift({ ...entry, private: true });
  privateRollLog = privateRollLog.slice(0, 50);
  renderRollLog();
  const showOutcome = entry.targetDc && !/\b(?:attack|damage)\b/i.test(entry.label || '');
  const outcome = showOutcome ? (entry.success ? ' — success' : ' — failed') : '';
  showToast(`🔒 ${entry.label || entry.expression}: ${entry.total}${outcome}`);
});

function rollBreakdownText(entry) {
  const modifier = entry.modifier
    ? ` ${entry.modifier > 0 ? '+' : ''}${entry.modifier}`
    : '';
  if (entry.mode && entry.mode !== 'normal' && Array.isArray(entry.rollSets) && entry.rollSets.length === 2) {
    const sets = entry.rollSets.map(set => `[${set.join(', ')}]`);
    const keptRolls = Array.isArray(entry.keptRolls)
      ? entry.keptRolls
      : entry.rollSets[Number(entry.keptSetIndex) || 0];
    return `${sets[0]} vs ${sets[1]} → kept [${keptRolls.join(', ')}]${modifier}`;
  }
  const rolls = Array.isArray(entry.rolls) ? entry.rolls : [];
  const kept = Number.isFinite(Number(entry.kept)) ? Number(entry.kept) : (rolls.length === 1 ? rolls[0] : null);
  return `[${rolls.join(', ')}]${entry.mode && entry.mode !== 'normal' ? ` → kept ${kept}` : ''}${modifier}`;
}

function renderRollLog() {
  const log = document.getElementById('roll-log');
  if (!log) return;
  log.innerHTML = '';
  const entries = [
    ...((state && state.rollLog) || []),
    ...(myRole === 'dm' ? privateRollLog : [])
  ].sort((a, b) => Number(b.ts) - Number(a.ts));
  entries.forEach(entry => {
    const row = document.createElement('div');
    const rolls = Array.isArray(entry.rolls) ? entry.rolls : [];
    const kept = Number.isFinite(Number(entry.kept)) ? Number(entry.kept) : (rolls.length === 1 ? rolls[0] : null);
    const keptDice = Array.isArray(entry.keptRolls) && entry.keptRolls.length
      ? entry.keptRolls
      : (rolls.length === 1 ? rolls : [kept]);
    const isSingleD20 = (Number(entry.count) === 1 && Number(entry.sides) === 20) ||
      (!entry.count && /(?:^|\()1d20\b|^2d20/.test(entry.expression || ''));
    const isCrit = isSingleD20 && keptDice.length === 1 && keptDice[0] === 20;
    const isFumble = isSingleD20 && keptDice.length === 1 && keptDice[0] === 1;
    row.className = 'roll-entry' + (entry.private ? ' private' : '') + (isCrit ? ' crit' : '') + (isFumble ? ' fumble' : '');
    row.innerHTML = `
      <div>
        <span class="who">${escapeHtml(entry.name)}</span>${entry.private ? '<span class="private-roll-badge">DM only</span>' : ''}
        <span class="expr">${entry.label ? escapeHtml(entry.label) + ' · ' : ''}${escapeHtml(entry.expression)}</span><br>
        <span class="breakdown">${escapeHtml(rollBreakdownText(entry))}</span>
        ${entry.targetDc && !/\b(?:attack|damage)\b/i.test(entry.label || '') ? `<span class="roll-outcome ${entry.success ? 'success' : 'failure'}">DC ${entry.targetDc} · ${entry.success ? 'Success' : 'Failure'}</span>` : ''}
      </div>
      <div class="total">${entry.total}</div>
    `;
    log.appendChild(row);
  });
}

document.getElementById('dice-character').onchange = renderCharacterRollOptions;

function rollableCharacters() {
  const all = Object.values(state?.characters || {}).sort((a, b) => a.name.localeCompare(b.name));
  if (myRole === 'dm') return all;
  return all.filter(character => character.canManage);
}

function openCharacterRoller(name) {
  switchView('dice');
  refreshCharacterRoller(name);
  document.getElementById('character-roller-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function refreshCharacterRoller(preferredName = '') {
  if (!state) return;
  const select = document.getElementById('dice-character');
  const characters = rollableCharacters();
  const npcs = myRole === 'dm'
    ? Object.values(state.npcs || {}).sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const previous = preferredName || select.value;
  select.innerHTML = '';
  if (characters.length) {
    const group = document.createElement('optgroup');
    group.label = 'Characters';
    characters.forEach(character => {
      const option = document.createElement('option');
      option.value = character.name;
      option.textContent = `${character.name} · Level ${character.level || 1} ${character.charClass || ''}`.trim();
      group.appendChild(option);
    });
    select.appendChild(group);
  }
  if (npcs.length) {
    const group = document.createElement('optgroup');
    group.label = 'NPCs';
    npcs.forEach(npc => {
      const option = document.createElement('option');
      option.value = `npc:${npc.id}`;
      option.textContent = npc.name;
      group.appendChild(option);
    });
    select.appendChild(group);
  }
  const validSelections = [
    ...characters.map(character => character.name),
    ...npcs.map(npc => `npc:${npc.id}`)
  ];
  if (validSelections.includes(previous)) select.value = previous;
  renderCharacterRollOptions();
}

function renderCharacterRollOptions() {
  const container = document.getElementById('character-roll-options');
  container.innerHTML = '';
  const selected = document.getElementById('dice-character').value;
  if (myRole === 'dm' && selected.startsWith('npc:')) {
    const npc = state?.npcs?.[selected.slice(4)];
    if (npc) return renderNpcRollOptions(container, npc);
  }
  const character = state?.characters?.[selected];
  if (!character) {
    container.innerHTML = '<p class="empty-roll-options">Create or claim a character sheet, or create an NPC, to use automatic modifiers.</p>';
    return;
  }

  const combatButtons = createDiceRollGroup(container, 'Combat');
  appendRollButton(combatButtons, 'Initiative', characterInitiativeModifier(character), () => rollCharacterInitiative(character));
  const spellAttack = character.spellcasting?.attackBonus ?? character.fields?.['spell-attack'];
  if (spellAttack !== '' && spellAttack !== undefined && spellAttack !== null) {
    appendRollButton(combatButtons, 'Spell attack', Number(spellAttack) || 0, () => rollCharacterD20(character, 'Spell attack', Number(spellAttack) || 0));
  }
  (character.attacks || []).forEach(attack => {
    const bonusMatch = String(attack.bonus || '').match(/[+-]?\d+/);
    if (attack.name && bonusMatch) {
      appendRollButton(combatButtons, `${attack.name} to hit`, Number(bonusMatch[0]), () => rollCharacterD20(character, `${attack.name} attack`, Number(bonusMatch[0])));
    }
    const damage = parseDiceExpression(attack.damage);
    if (attack.name && damage) {
      appendRollButton(combatButtons, `${attack.name} damage`, damage.modifier, () => {
        rollDiceFromDiceScreen(damage.count, damage.sides, damage.modifier, {
          name: characterRollName(character),
          characterName: character.name,
          label: `${attack.name} damage`
        });
      }, true, damage.expression);
    }
  });

  const abilityButtons = createDiceRollGroup(container, 'Ability checks');
  ABILITIES.forEach(ability => {
    const modifier = abilityModifier(character.abilities?.[ability]);
    appendRollButton(abilityButtons, ABILITY_LABELS[ability], modifier, () => rollCharacterD20(character, `${ABILITY_LABELS[ability]} check`, modifier));
  });

  const saveButtons = createDiceRollGroup(container, 'Saving throws');
  ABILITIES.forEach(ability => {
    const modifier = characterSaveModifier(character, ability);
    appendRollButton(saveButtons, ABILITY_LABELS[ability], modifier, () => rollCharacterD20(character, `${ABILITY_LABELS[ability]} save`, modifier));
  });

  const skillButtons = createDiceRollGroup(container, 'Skills');
  Object.keys(SKILL_ABILITIES).forEach(skill => {
    const modifier = characterSkillModifier(character, skill);
    appendRollButton(skillButtons, SKILL_LABELS[skill], modifier, () => rollCharacterD20(character, `${SKILL_LABELS[skill]} check`, modifier));
  });

}

function renderNpcRollOptions(container, npc) {
  const combatButtons = createDiceRollGroup(container, 'Combat');
  appendRollButton(combatButtons, 'Initiative', Number(npc.initiativeModifier) || 0, () => rollNpcSheetInitiative(npc));
  const spellAttack = npc.spellcasting?.attackBonus ?? npc.sheet?.spellcasting?.attackBonus ?? npc.sheet?.fields?.['spell-attack'];
  const hasSpellAttack = spellAttack !== '' && spellAttack !== undefined && spellAttack !== null;
  if (hasSpellAttack) {
    appendRollButton(combatButtons, 'Spell attack', Number(spellAttack) || 0, () => (
      rollNpcSheetD20(npc, 'Spell attack', Number(spellAttack) || 0)
    ));
  }
  (npc.attacks || []).forEach(attack => {
    const bonusMatch = String(attack.bonus || '').match(/[+-]?\d+/);
    if (attack.name && bonusMatch) {
      const modifier = Number(bonusMatch[0]);
      appendRollButton(combatButtons, `${attack.name} to hit`, modifier, () => (
        rollNpcSheetD20(npc, `${attack.name} attack`, modifier)
      ));
    }
    const damage = parseDiceExpression(attack.damage);
    if (attack.name && damage) {
      appendRollButton(combatButtons, `${attack.name} damage`, damage.modifier, () => {
        rollDiceFromDiceScreen(damage.count, damage.sides, damage.modifier, {
          npcId: npc.id,
          label: `${attack.name} damage`
        });
      }, true, damage.expression);
    }
  });

  const spells = normalizeSpellList(npc.spells || npc.sheet?.spells);
  if (spells.length) {
    const spellButtons = createDiceRollGroup(container, 'Spells');
    spells.forEach(spell => {
      if (hasSpellAttack && /\bspell attack\b/i.test(spell.attack || '')) {
        const modifier = Number(spellAttack) || 0;
        appendRollButton(spellButtons, `${spell.name} attack`, modifier, () => (
          rollNpcSheetD20(npc, `${spell.name} spell attack`, modifier)
        ));
      }
      const damage = parseDiceExpression(spell.damage || spell.effect || spell.name);
      if (damage) {
        appendRollButton(spellButtons, `${spell.name} damage`, damage.modifier, () => {
          rollDiceFromDiceScreen(damage.count, damage.sides, damage.modifier, {
            npcId: npc.id,
            label: `${spell.name} damage`
          });
        }, true, damage.expression);
      }
    });
    if (!spellButtons.children.length) {
      spellButtons.innerHTML = '<span class="empty-roll-options">No spell attack or damage dice are configured.</span>';
    }
  }

  const abilityButtons = createDiceRollGroup(container, 'Ability checks');
  ABILITIES.forEach(ability => {
    const modifier = abilityModifier(npcAbilityScore(npc, ability));
    appendRollButton(abilityButtons, ABILITY_LABELS[ability], modifier, () => (
      rollNpcSheetD20(npc, `${ABILITY_LABELS[ability]} check`, modifier)
    ));
  });

  const saveButtons = createDiceRollGroup(container, 'Saving throws');
  ABILITIES.forEach(ability => {
    const modifier = npcSaveModifier(npc, ability);
    appendRollButton(saveButtons, ABILITY_LABELS[ability], modifier, () => (
      rollNpcSheetD20(npc, `${ABILITY_LABELS[ability]} save`, modifier)
    ));
  });

  const skillButtons = createDiceRollGroup(container, 'Skills');
  Object.keys(SKILL_ABILITIES).forEach(skill => {
    const modifier = npcSkillModifier(npc, skill);
    appendRollButton(skillButtons, SKILL_LABELS[skill], modifier, () => (
      rollNpcSheetD20(npc, `${SKILL_LABELS[skill]} check`, modifier)
    ));
  });
}

function createDiceRollGroup(container, title) {
  const group = document.createElement('section');
  group.className = 'roll-group';
  const heading = document.createElement('h4');
  heading.textContent = title;
  const buttons = document.createElement('div');
  buttons.className = 'modifier-buttons';
  group.append(heading, buttons);
  container.appendChild(group);
  return buttons;
}

function appendRollButton(container, label, modifier, onclick, damage = false, valueLabel = null) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'modifier-roll-btn' + (damage ? ' damage' : '');
  button.innerHTML = `${escapeHtml(label)} <strong>${escapeHtml(valueLabel || signed(Number(modifier) || 0))}</strong>`;
  button.onclick = onclick;
  container.appendChild(button);
}

function characterRollName(character) {
  return myName === character.name ? character.name : `${myName} as ${character.name}`;
}

function rollCharacterD20(character, label, modifier, extra: any = {}) {
  const mode = extra.mode || consumePendingDiceRollMode();
  rollDice(1, 20, modifier, {
    name: characterRollName(character),
    characterName: character.name,
    label,
    mode,
    ...extra
  });
}

function rollCharacterInitiative(character, forcedMode = null) {
  const token = state.tokens.find(entry => entry.label.toLowerCase() === character.name.toLowerCase());
  rollDice(1, 20, characterInitiativeModifier(character), {
    name: characterRollName(character),
    characterName: character.name,
    label: `${character.name} initiative`,
    mode: forcedMode || consumePendingDiceRollMode(),
    initiativeName: character.name,
    tokenId: token?.id || null
  });
}

function rollNpcD20(token, label, modifier, mode = 'normal', extra: any = {}) {
  rollDice(1, 20, modifier, {
    name: `${myName} as ${token.label}`,
    tokenId: token.id,
    label,
    mode,
    ...extra
  });
}

function rollNpcInitiative(token, mode = 'normal') {
  const modifier = Number(token.initiativeModifier) || 0;
  rollNpcD20(token, `${token.label} initiative`, modifier, mode, {
    initiativeName: token.label
  });
}

function rollNpcSheetD20(npc, label, modifier, extra: any = {}) {
  const mode = extra.mode || consumePendingDiceRollMode();
  rollDice(1, 20, modifier, {
    npcId: npc.id,
    label,
    mode,
    ...extra
  });
}

function rollNpcSheetInitiative(npc) {
  const modifier = Number(npc.initiativeModifier) || 0;
  rollNpcSheetD20(npc, `${npc.name} initiative`, modifier, {
    initiativeName: npc.name
  });
}

function characterInitiativeModifier(character) {
  const stored = character.initiativeModifier ?? character.fields?.initiative;
  if (stored !== '' && stored !== undefined && stored !== null) return Number(stored) || 0;
  return abilityModifier(character.abilities?.dex);
}

function characterSaveModifier(character, ability) {
  const saved = character.saves?.[ability]?.modifier ?? character.fields?.[`save-${ability}`];
  if (saved !== '' && saved !== undefined && saved !== null) return Number(saved) || 0;
  return abilityModifier(character.abilities?.[ability]) + (character.saves?.[ability]?.proficient ? proficiencyBonus(character.level) : 0);
}

function characterSkillModifier(character, skill) {
  const saved = character.skills?.[skill]?.modifier ?? character.fields?.[`skill-${skill}`];
  if (saved !== '' && saved !== undefined && saved !== null) return Number(saved) || 0;
  return abilityModifier(character.abilities?.[SKILL_ABILITIES[skill]]) + (character.skills?.[skill]?.proficient ? proficiencyBonus(character.level) : 0);
}

function npcAbilityScore(npc, ability) {
  return Number(npc.sheet?.abilities?.[ability] ?? npc.sheet?.fields?.[ability]) || 10;
}

function npcSaveModifier(npc, ability) {
  const saved = npc.sheet?.saves?.[ability]?.modifier ?? npc.sheet?.fields?.[`save-${ability}`];
  if (saved !== '' && saved !== undefined && saved !== null) return Number(saved) || 0;
  return abilityModifier(npcAbilityScore(npc, ability));
}

function npcSkillModifier(npc, skill) {
  const saved = npc.sheet?.skills?.[skill]?.modifier ?? npc.sheet?.fields?.[`skill-${skill}`];
  if (saved !== '' && saved !== undefined && saved !== null) return Number(saved) || 0;
  return abilityModifier(npcAbilityScore(npc, SKILL_ABILITIES[skill]));
}

function parseDiceExpression(value) {
  const match = String(value || '').replace(/\s+/g, '').match(/(\d*)d(\d+)([+-]\d+)?/i);
  if (!match) return null;
  const count = Math.max(1, Number(match[1]) || 1);
  const sides = Math.max(2, Number(match[2]) || 20);
  const modifier = Number(match[3]) || 0;
  return { count, sides, modifier, expression: `${count}d${sides}${modifier ? signed(modifier) : ''}` };
}
