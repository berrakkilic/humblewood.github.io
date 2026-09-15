/** Quick combat controls, spell preparation, conditions, and long rests. */

// ================= QUICK COMBAT =================
function openCombatManager(name) {
  const character = state?.characters?.[name];
  if (!character?.canManage) return showToast('You can only manage combat for your own character.');
  activeCombatTarget = { type: 'character', id: name };
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  renderCombatManager();
}

function openNpcCombatManager(id) {
  const token = state?.tokens?.find(entry => entry.id === id && entry.kind === 'npc');
  if (myRole !== 'dm' || !token) return showToast('Only the DM can manage NPC combat.');
  activeCombatTarget = { type: 'npc', id };
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  renderCombatManager();
}

function closeCombatManager() {
  activeCombatTarget = null;
  const overlay = document.getElementById('combat-overlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function combatAction(action, extra: any = {}) {
  if (!activeCombatTarget) return;
  if (action === 'condition:toggle') applyOptimisticConditionToggle(extra.condition);
  if (activeCombatTarget.type === 'npc') socket.emit('token:combat:update', { id: activeCombatTarget.id, action, ...extra });
  else socket.emit('character:combat:update', { name: activeCombatTarget.id, action, ...extra });
}

function activeCombatEntity() {
  if (!activeCombatTarget) return null;
  if (activeCombatTarget.type === 'npc') {
    const token = state?.tokens?.find(entry => entry.id === activeCombatTarget.id && entry.kind === 'npc');
    return token ? { type: 'npc', entity: token } : null;
  }
  const character = state?.characters?.[activeCombatTarget.id];
  return character ? { type: 'character', entity: character } : null;
}

function applyOptimisticConditionToggle(condition) {
  const target = activeCombatEntity();
  if (!target || !CONDITIONS.includes(condition)) return;
  const nextConditions = combatState.toggleCondition(target.entity, condition);

  if (target.type === 'npc') {
    const npc = state?.npcs?.[target.entity.npcId];
    if (npc) combatState.setConditions(npc, nextConditions);
  } else {
    state.tokens
      .filter(token => token.characterName === target.entity.name)
      .forEach(token => combatState.setConditionBadges(token, nextConditions));
  }

  renderCombatManager();
  renderMapTokens();
  renderTokenTray();
  renderCharacters();
  renderPlayerSidebar();
  renderNpcRoster();
  renderDmSidebarSummary();
}

function renderCombatManager() {
  const target = activeCombatEntity();
  if (!target) return closeCombatManager();
  const { type, entity } = target;
  const isNpc = type === 'npc';
  const name = isNpc ? entity.label : entity.name;
  const combat = entity.combat || {
    conditions: [], concentration: false, exhaustion: 0, deathSaves: {}, spellSlots: {}, reactionAvailable: true
  };
  document.getElementById('combat-kicker').textContent = isNpc ? 'NPC combat controls' : 'Character combat controls';
  document.getElementById('combat-title').textContent = name;
  const portrait = document.getElementById('combat-portrait');
  const portraitUrl = isNpc ? entity.imageUrl : entity.portraitUrl;
  portrait.innerHTML = portraitUrl ? `<img src="${escapeAttr(portraitUrl)}" alt="">` : (isNpc ? '🦊' : '🍃');
  document.getElementById('combat-hp').textContent = `${Number(entity.hp) || 0} / ${Number(entity.maxHp) || 0}`;
  document.getElementById('combat-temp-hp').textContent = Number(entity.tempHp) || 0;
  document.getElementById('combat-ac').textContent = Number(entity.ac) || 0;
  document.getElementById('combat-life-status').textContent = combat.dead ? 'Dead' : combat.stable ? 'Stable' : entity.hp <= 0 ? 'Down' : 'Ready';
  const notes = document.getElementById('combat-notes');
  notes.classList.toggle('hidden', !isNpc || !entity.notes);
  notes.textContent = isNpc ? (entity.notes || '') : '';
  document.getElementById('combat-death-section').classList.toggle('hidden', isNpc);
  const hasSpellSlots = Object.values(combat.spellSlots || {}).some(slot => Number(slot.total) > 0);
  document.getElementById('combat-spell-slots-section').classList.toggle('hidden', isNpc && !hasSpellSlots);
  const preparesSpells = !isNpc && characterPreparationDetails(entity) !== null;
  document.getElementById('combat-long-rest-btn').textContent = isNpc
    ? 'Restore NPC'
    : (preparesSpells ? 'Long rest & prepare spells' : 'Complete long rest');
  renderCombatRolls(entity, isNpc);
  renderCombatReactions(entity, isNpc);
  document.getElementById('combat-concentration').checked = !!combat.concentration;
  document.getElementById('combat-exhaustion').textContent = Number(combat.exhaustion) || 0;
  document.getElementById('combat-death-successes').textContent = `${Number(combat.deathSaves?.successes) || 0} / 3`;
  document.getElementById('combat-death-failures').textContent = `${Number(combat.deathSaves?.failures) || 0} / 3`;

  const conditions = document.getElementById('combat-conditions');
  conditions.innerHTML = '';
  CONDITIONS.forEach(condition => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'condition-chip' + ((combat.conditions || []).includes(condition) ? ' active' : '');
    button.textContent = condition;
    button.onclick = () => combatAction('condition:toggle', { condition });
    conditions.appendChild(button);
  });

  const slots = document.getElementById('combat-spell-slots');
  slots.innerHTML = '';
  Object.entries(combat.spellSlots || {}).filter(([, slot]) => Number(slot.total) > 0).forEach(([level, slot]) => {
    const row = document.createElement('div');
    row.className = 'combat-slot-row';
    row.innerHTML = `
      <span class="slot-level">Level ${level}</span>
      <button class="counter-btn recover-slot" type="button" title="Recover one slot">−</button>
      <strong>${Number(slot.total) - Number(slot.used)} / ${Number(slot.total)} available</strong>
      <button class="counter-btn use-slot" type="button" title="Use one slot">+</button>
    `;
    row.querySelector('.recover-slot').onclick = () => combatAction('spellSlot', { level: Number(level), delta: -1 });
    row.querySelector('.use-slot').onclick = () => combatAction('spellSlot', { level: Number(level), delta: 1 });
    slots.appendChild(row);
  });
  if (!slots.children.length) slots.innerHTML = '<p class="empty-roll-options">No spell slots are configured on this sheet.</p>';

  const check = isNpc ? null : pendingConcentrationChecks.get(entity.name);
  const checkButton = document.getElementById('combat-concentration-roll');
  checkButton.classList.toggle('hidden', !check);
  if (check) checkButton.textContent = `Roll Constitution save · DC ${check.dc}`;
}

function renderCombatRolls(character, isNpc = false) {
  const mode = () => document.getElementById('combat-roll-mode').value;
  const initiativeButton = document.getElementById('combat-initiative-roll');
  const initiativeModifier = isNpc ? (Number(character.initiativeModifier) || 0) : characterInitiativeModifier(character);
  initiativeButton.textContent = `Initiative ${signed(initiativeModifier)}`;
  initiativeButton.onclick = () => isNpc ? rollNpcInitiative(character, mode()) : rollCharacterInitiative(character, mode());

  const spellAttackValue = character.spellcasting?.attackBonus ?? character.fields?.['spell-attack'];
  const hasSpellAttack = spellAttackValue !== '' && spellAttackValue !== undefined && spellAttackValue !== null;
  const spellAttackButton = document.getElementById('combat-spell-attack-roll');
  spellAttackButton.classList.toggle('hidden', !hasSpellAttack);
  if (hasSpellAttack) {
    const spellModifier = Number(spellAttackValue) || 0;
    spellAttackButton.textContent = `Spell attack ${signed(spellModifier)}`;
    spellAttackButton.onclick = () => {
      if (isNpc) rollNpcD20(character, 'Spell attack', spellModifier, mode());
      else rollCharacterD20(character, 'Spell attack', spellModifier, { mode: mode() });
    };
  }

  const spellDcValue = character.spellcasting?.saveDc ?? character.fields?.['spell-dc'];
  const spellDc = document.getElementById('combat-spell-dc');
  const hasSpellDc = spellDcValue !== '' && spellDcValue !== undefined && spellDcValue !== null;
  spellDc.classList.toggle('hidden', !hasSpellDc);
  if (hasSpellDc) spellDc.textContent = `Spell save DC ${Number(spellDcValue) || 0}`;

  const attacks = document.getElementById('combat-attacks');
  attacks.innerHTML = '';
  (character.attacks || []).filter(attack => attack.name).forEach(attack => {
    const row = document.createElement('div');
    row.className = 'combat-roll-row';
    const name = document.createElement('span');
    name.className = 'combat-roll-name';
    name.textContent = attack.name;
    if (attack.details) name.title = attack.details;
    row.appendChild(name);
    const bonusMatch = String(attack.bonus || '').match(/[+-]?\d+/);
    if (bonusMatch) {
      const modifier = Number(bonusMatch[0]);
      row.appendChild(makeCombatRollButton(`Hit ${signed(modifier)}`, () => {
        if (isNpc) rollNpcD20(character, `${attack.name} attack`, modifier, mode());
        else rollCharacterD20(character, `${attack.name} attack`, modifier, { mode: mode() });
      }));
    }
    const damage = parseDiceExpression(attack.damage);
    if (damage) {
      row.appendChild(makeCombatRollButton(damage.expression, () => rollDice(damage.count, damage.sides, damage.modifier, {
        characterName: isNpc ? null : character.name,
        tokenId: isNpc ? character.id : null,
        label: `${attack.name} damage`
      }), true));
    }
    attacks.appendChild(row);
  });
  if (!attacks.children.length) attacks.innerHTML = '<p class="empty-roll-options">No attacks are configured.</p>';

  const spells = document.getElementById('combat-spells');
  spells.innerHTML = '';
  (isNpc ? normalizeSpellList(character.spells) : characterSpellEntries(character)).forEach(spell => {
    const row = document.createElement('div');
    row.className = 'combat-roll-row combat-spell-card';
    const info = document.createElement('div');
    info.className = 'combat-spell-info';
    const heading = document.createElement('div');
    heading.className = 'combat-spell-heading';
    const name = document.createElement('span');
    name.className = 'combat-roll-name';
    name.textContent = spell.name;
    const level = document.createElement('small');
    level.textContent = [spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`, spell.school, spell.source].filter(Boolean).join(' · ');
    heading.append(name, level);
    info.appendChild(heading);

    const metadata = [
      spell.castingTime ? `Cast: ${spell.castingTime}` : '',
      spell.range ? `Range: ${spell.range}` : '',
      spell.duration ? `Duration: ${spell.duration}` : '',
      spell.attack && !/^none$/i.test(spell.attack) ? `Attack/save: ${spell.attack}` : '',
      spell.damage ? `Damage: ${spell.damage}` : ''
    ].filter(Boolean);
    if (metadata.length) {
      const meta = document.createElement('div');
      meta.className = 'combat-spell-meta';
      metadata.forEach(value => {
        const detail = document.createElement('span');
        detail.textContent = value;
        meta.appendChild(detail);
      });
      info.appendChild(meta);
    }
    if (spell.effect) {
      const effect = document.createElement('p');
      effect.className = 'combat-spell-effect';
      effect.textContent = spell.effect;
      info.appendChild(effect);
    }
    row.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'combat-spell-actions';
    if (hasSpellAttack && /\bspell attack\b/i.test(spell.attack)) {
      const modifier = Number(spellAttackValue) || 0;
      actions.appendChild(makeCombatRollButton(`Attack ${signed(modifier)}`, () => {
        if (isNpc) rollNpcD20(character, `${spell.name} spell attack`, modifier, mode());
        else rollCharacterD20(character, `${spell.name} spell attack`, modifier, { mode: mode() });
      }));
    }
    const damage = parseDiceExpression(spell.damage || spell.effect || spell.name);
    if (damage) {
      actions.appendChild(makeCombatRollButton(`Roll ${damage.expression}`, () => rollDice(damage.count, damage.sides, damage.modifier, {
        characterName: isNpc ? null : character.name,
        tokenId: isNpc ? character.id : null,
        label: `${spell.name} damage`
      }), true));
    }
    if (actions.children.length) row.appendChild(actions);
    spells.appendChild(row);
  });
  if (!spells.children.length) spells.innerHTML = '<p class="empty-roll-options">No spells are listed on the sheet.</p>';
}

function renderCombatReactions(character, isNpc = false) {
  const section = document.getElementById('combat-reactions-section');
  const container = document.getElementById('combat-reactions');
  const stateLabel = document.getElementById('combat-reaction-state');
  const refreshButton = document.getElementById('combat-reaction-refresh-btn');
  if (!section || !container || !stateLabel || !refreshButton) return;

  const reactions = normalizeReactionList(
    isNpc ? (character.reactions || state?.npcs?.[character.npcId]?.reactions) : character.reactions
  );
  const available = character.combat?.reactionAvailable !== false;
  stateLabel.textContent = available ? 'Available' : 'Spent this turn';
  stateLabel.classList.toggle('spent', !available);
  refreshButton.disabled = available;
  refreshButton.textContent = available ? 'Reaction ready' : 'Refresh reaction';
  container.innerHTML = '';

  if (!reactions.length) {
    container.innerHTML = '<p class="empty-roll-options">No reactions are configured. Add them from the character sheet.</p>';
    return;
  }

  reactions.forEach(reaction => {
    const card = document.createElement('article');
    card.className = 'combat-reaction-card';

    const heading = document.createElement('div');
    heading.className = 'combat-reaction-heading';
    const title = document.createElement('h4');
    title.textContent = reaction.name;
    heading.appendChild(title);
    const meta = [reaction.requirement, reaction.resource, reaction.source].filter(Boolean);
    if (meta.length) {
      const metaLine = document.createElement('div');
      metaLine.className = 'combat-reaction-meta';
      metaLine.textContent = meta.join(' · ');
      heading.appendChild(metaLine);
    }
    card.appendChild(heading);

    if (reaction.trigger) {
      const trigger = document.createElement('p');
      trigger.className = 'combat-reaction-copy';
      trigger.innerHTML = '<strong>Trigger:</strong> ';
      trigger.append(document.createTextNode(reaction.trigger));
      card.appendChild(trigger);
    }
    if (reaction.effect) {
      const effect = document.createElement('p');
      effect.className = 'combat-reaction-copy';
      effect.innerHTML = '<strong>Response:</strong> ';
      effect.append(document.createTextNode(reaction.effect));
      card.appendChild(effect);
    }

    const actions = document.createElement('div');
    actions.className = 'combat-reaction-actions';
    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.className = 'btn-primary';
    useButton.textContent = available ? 'Use reaction' : 'Reaction spent';
    useButton.disabled = !available;
    useButton.onclick = () => combatAction('reaction:use', { reactionId: reaction.id });
    actions.appendChild(useButton);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

function makeCombatRollButton(label, onclick, damage = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `combat-roll-button${damage ? ' damage' : ''}`;
  button.textContent = label;
  button.onclick = onclick;
  return button;
}

function characterKnownSpellEntries(character) {
  const structured = normalizeSpellList(character.fields?.['spell-list']);
  if (structured.length) {
    return structured
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }
  const entries = [];
  for (let level = 0; level <= 9; level += 1) {
    const text = String(character.fields?.[`spells-${level}`] || '').trim();
    if (!text) continue;
    text.split(/\n|;/).flatMap(line => {
      const trimmed = line.trim();
      return trimmed.includes(',') && !/\d+d\d+/i.test(trimmed) ? trimmed.split(',') : [trimmed];
    }).map(name => name.trim()).filter(Boolean).forEach(name => entries.push(normalizeSpell({ level, name }, entries.length)));
  }
  return entries;
}

function characterPreparationDetails(character) {
  if (!character) return null;
  const fields = character.fields || {};
  const className = character.charClass || fields.class || '';
  const subclass = character.subclass || fields.subclass || '';
  const level = character.level || fields.level || 1;
  const ability = characterRules.spellcastingAbilityFor(className, subclass);
  const abilityScore = ability ? (character.abilities?.[ability] ?? fields[ability] ?? 10) : 10;
  const limit = characterRules.preparedSpellCount(className, level, abilityScore);
  if (limit === null) return null;
  const maximumSpellLevel = characterRules.maximumSpellLevelFor(className, subclass, level);
  const available = characterKnownSpellEntries(character)
    .filter(spell => spell.level > 0 && spell.level <= maximumSpellLevel)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const alwaysPrepared = available.filter(spell => spell.alwaysPrepared);
  const selectable = available.filter(spell => !spell.alwaysPrepared);
  return {
    className: characterRules.canonicalClass(className) || className,
    maximumSpellLevel,
    limit,
    available,
    alwaysPrepared,
    selectable,
    target: Math.min(limit, selectable.length)
  };
}

function characterSpellEntries(character) {
  const known = characterKnownSpellEntries(character);
  const preparation = characterPreparationDetails(character);
  if (!preparation) return known;
  const hasSavedPreparation = preparation.available.some(spell => (
    spell.alwaysPrepared || typeof spell.prepared === 'boolean'
  ));
  if (!hasSavedPreparation) return known;
  return known.filter(spell => (
    spell.level === 0 ||
    (spell.level <= preparation.maximumSpellLevel && (spell.alwaysPrepared || spell.prepared === true))
  ));
}

function closeSpellPreparation() {
  pendingSpellPreparation = null;
  const overlay = document.getElementById('spell-preparation-overlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function updateSpellPreparationCount() {
  if (!pendingSpellPreparation) return;
  const { selected, target, alwaysPrepared } = pendingSpellPreparation;
  const valid = selected.size === target;
  const count = document.getElementById('spell-preparation-count');
  count.textContent = `${selected.size} / ${target} selected${alwaysPrepared.length ? ` · ${alwaysPrepared.length} always prepared` : ''}`;
  count.classList.toggle('invalid', !valid);
  document.getElementById('spell-preparation-complete-btn').disabled = !valid;
}

function renderSpellPreparationList() {
  if (!pendingSpellPreparation) return;
  const container = document.getElementById('spell-preparation-list');
  const query = document.getElementById('spell-preparation-search').value.trim().toLowerCase();
  const visible = pendingSpellPreparation.available.filter(spell => (
    !query || [spell.name, spell.school, spell.source].some(value => String(value || '').toLowerCase().includes(query))
  ));
  container.innerHTML = '';
  if (!visible.length) {
    container.innerHTML = `<p class="spell-preparation-empty">${query ? 'No available spells match that search.' : 'No leveled spells on this sheet are available at the character’s current level.'}</p>`;
    updateSpellPreparationCount();
    return;
  }
  const byLevel = new Map();
  visible.forEach(spell => {
    if (!byLevel.has(spell.level)) byLevel.set(spell.level, []);
    byLevel.get(spell.level).push(spell);
  });
  [...byLevel.entries()].forEach(([level, spells]) => {
    const group = document.createElement('section');
    group.className = 'spell-preparation-level';
    const title = document.createElement('h3');
    title.textContent = `Level ${level}`;
    const options = document.createElement('div');
    options.className = 'spell-preparation-options';
    spells.forEach(spell => {
      const option = document.createElement('label');
      option.className = `spell-preparation-option${spell.alwaysPrepared ? ' always' : ''}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = spell.alwaysPrepared || pendingSpellPreparation.selected.has(spell.id);
      checkbox.disabled = spell.alwaysPrepared;
      checkbox.setAttribute('aria-label', spell.alwaysPrepared ? `${spell.name}, always prepared` : `Prepare ${spell.name}`);
      checkbox.onchange = () => {
        if (checkbox.checked && pendingSpellPreparation.selected.size >= pendingSpellPreparation.target) {
          checkbox.checked = false;
          showToast(`You can prepare ${pendingSpellPreparation.target} spell${pendingSpellPreparation.target === 1 ? '' : 's'}.`);
          return;
        }
        if (checkbox.checked) pendingSpellPreparation.selected.add(spell.id);
        else pendingSpellPreparation.selected.delete(spell.id);
        updateSpellPreparationCount();
      };
      const copy = document.createElement('span');
      copy.className = 'spell-preparation-option-copy';
      const name = document.createElement('strong');
      name.textContent = spell.name;
      const details = document.createElement('small');
      details.textContent = spell.alwaysPrepared
        ? ['Always prepared', spell.school, spell.source].filter(Boolean).join(' · ')
        : [spell.school, spell.source].filter(Boolean).join(' · ');
      copy.append(name);
      if (details.textContent) copy.append(details);
      option.append(checkbox, copy);
      options.appendChild(option);
    });
    group.append(title, options);
    container.appendChild(group);
  });
  updateSpellPreparationCount();
}

function openSpellPreparation(character, preparation = characterPreparationDetails(character)) {
  if (!preparation) return false;
  const current = preparation.selectable.filter(spell => spell.prepared === true).map(spell => spell.id);
  const hasSavedPreparation = preparation.selectable.some(spell => typeof spell.prepared === 'boolean');
  const selected = new Set(current.slice(0, preparation.target));
  if (!hasSavedPreparation && preparation.selectable.length <= preparation.target) {
    preparation.selectable.forEach(spell => selected.add(spell.id));
  }
  pendingSpellPreparation = { characterName: character.name, ...preparation, selected };
  document.getElementById('spell-preparation-title').textContent = `Prepare ${character.name}’s spells`;
  document.getElementById('spell-preparation-intro').textContent = `${preparation.className} level ${character.level || character.fields?.level || 1} can prepare ${preparation.limit} spell${preparation.limit === 1 ? '' : 's'} of level ${preparation.maximumSpellLevel} or lower. Choose ${preparation.target} from the spells currently on the sheet.`;
  document.getElementById('spell-preparation-note').textContent = preparation.alwaysPrepared.length
    ? 'Cantrips and always-prepared spells remain available without using this limit.'
    : 'Cantrips are always available and do not need to be prepared.';
  document.getElementById('spell-preparation-search').value = '';
  const overlay = document.getElementById('spell-preparation-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  renderSpellPreparationList();
  document.getElementById('spell-preparation-search').focus();
  return true;
}

document.getElementById('combat-close-btn').onclick = closeCombatManager;
document.getElementById('combat-overlay').addEventListener('mousedown', event => {
  if (event.target.id === 'combat-overlay') closeCombatManager();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (pendingSpellPreparation) closeSpellPreparation();
  else if (activeCombatTarget) closeCombatManager();
});
document.getElementById('combat-damage-btn').onclick = () => combatAction('damage', { amount: Number(document.getElementById('combat-amount').value) || 0 });
document.getElementById('combat-heal-btn').onclick = () => combatAction('heal', { amount: Number(document.getElementById('combat-amount').value) || 0 });
document.getElementById('combat-temp-btn').onclick = () => combatAction('tempHp', { amount: Number(document.getElementById('combat-amount').value) || 0 });
document.getElementById('combat-concentration').onchange = event => combatAction('concentration:set', { value: event.target.checked });
document.querySelectorAll('[data-combat-action]').forEach(button => {
  button.onclick = () => {
    const actions = {
      'exhaustion-down': ['exhaustion', { delta: -1 }],
      'exhaustion-up': ['exhaustion', { delta: 1 }],
      'success-down': ['deathSave', { kind: 'successes', delta: -1 }],
      'success-up': ['deathSave', { kind: 'successes', delta: 1 }],
      'failure-down': ['deathSave', { kind: 'failures', delta: -1 }],
      'failure-up': ['deathSave', { kind: 'failures', delta: 1 }]
    };
    const [action, extra] = actions[button.dataset.combatAction];
    combatAction(action, extra);
  };
});
document.getElementById('combat-restore-slots-btn').onclick = () => combatAction('restoreAllSlots');
document.getElementById('combat-reaction-refresh-btn').onclick = () => combatAction('reaction:refresh');
document.getElementById('combat-long-rest-btn').onclick = () => {
  const target = activeCombatEntity();
  if (!target) return;
  const name = target.type === 'npc' ? target.entity.label : target.entity.name;
  if (target.type === 'npc') {
    if (confirm(`Restore ${name} to full HP?`)) combatAction('longRest');
    return;
  }
  const preparation = characterPreparationDetails(target.entity);
  if (preparation?.available.length) {
    openSpellPreparation(target.entity, preparation);
    return;
  }
  if (confirm(`Give ${name} a long rest? This restores HP and all spell slots.`)) combatAction('longRest');
};
document.getElementById('spell-preparation-close-btn').onclick = closeSpellPreparation;
document.getElementById('spell-preparation-overlay').addEventListener('mousedown', event => {
  if (event.target.id === 'spell-preparation-overlay') closeSpellPreparation();
});
document.getElementById('spell-preparation-search').addEventListener('input', renderSpellPreparationList);
document.getElementById('spell-preparation-complete-btn').onclick = () => {
  if (!pendingSpellPreparation || pendingSpellPreparation.selected.size !== pendingSpellPreparation.target) return;
  const characterName = pendingSpellPreparation.characterName;
  const preparedSpellIds = [...pendingSpellPreparation.selected];
  closeSpellPreparation();
  socket.emit('character:combat:update', { name: characterName, action: 'longRest', preparedSpellIds });
};
document.getElementById('combat-concentration-roll').onclick = () => {
  if (activeCombatTarget?.type !== 'character') return;
  const character = state?.characters?.[activeCombatTarget.id];
  const check = pendingConcentrationChecks.get(activeCombatTarget.id);
  if (!character || !check) return;
  rollCharacterD20(character, `Concentration save (DC ${check.dc})`, characterSaveModifier(character, 'con'), {
    targetDc: check.dc,
    concentrationFor: character.name,
    mode: 'normal'
  });
};
