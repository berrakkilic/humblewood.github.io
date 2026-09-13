/** Level-up dialog, hit-point growth, ASIs, and automatic advancement. */

function formatSpellSlots(slots) {
  const parts = slots.map((count, index) => count ? `${index + 1}st${index ? '' : ''}: ${count}` : '').filter(Boolean);
  return parts.length ? parts.join(', ').replace(/2st/g, '2nd').replace(/3st/g, '3rd').replace(/([4-9])st/g, '$1th') : 'none';
}

function abilitySelectMarkup(className) {
  return `<select class="${className}"><option value="">Choose an ability...</option>${ABILITIES.map(ability =>
    `<option value="${ability}">${ABILITY_LABELS[ability]} (${document.getElementById(`sf-${ability}`).value})</option>`
  ).join('')}</select>`;
}

function closeLevelUpDialog(resetLevel = true) {
  const overlay = document.getElementById('level-up-overlay');
  if (resetLevel && pendingLevelUp) {
    suppressLevelUpPrompt = true;
    document.getElementById('sf-level').value = pendingLevelUp.fromLevel;
    suppressLevelUpPrompt = false;
    refreshCharacterCalculations(true, true);
  }
  syncAutomaticClassFeatures(true);
  pendingLevelUp = null;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function renderLevelUpDialog() {
  if (!pendingLevelUp) return;
  const { fromLevel, toLevel, className, subclass, species } = pendingLevelUp;
  const hitDie = characterRules.hitDieFor(className);
  const average = characterRules.averageHitDieRoll(className);
  const constitutionModifier = characterRules.abilityModifier(document.getElementById('sf-con').value);
  const gains = characterRules.levelUpGains({ className, subclass, species, fromLevel, toLevel });

  document.getElementById('level-up-title').textContent = `${className} level ${fromLevel} → ${toLevel}`;
  document.getElementById('level-up-intro').textContent = `Complete the choices below, then apply the milestone level-up. No experience points are required.`;

  const hpContainer = document.getElementById('level-up-hp-rows');
  hpContainer.innerHTML = gains.map(gain => `
    <div class="level-up-hp-row" data-level="${gain.level}">
      <strong>Level ${gain.level}</strong>
      <label><input type="radio" name="hp-method-${gain.level}" value="average" checked> Fixed ${average} ${signed(constitutionModifier)} CON</label>
      <label><input type="radio" name="hp-method-${gain.level}" value="roll"> Roll or enter d${hitDie}</label>
      <input class="level-up-hp-roll" type="number" min="1" max="${hitDie}" placeholder="1-${hitDie}" aria-label="Hit die result for level ${gain.level}">
      <button type="button" class="btn-ghost level-up-roll-btn">Roll d${hitDie}</button>
    </div>
  `).join('');
  hpContainer.querySelectorAll('.level-up-hp-row').forEach(row => {
    const rollInput = row.querySelector('.level-up-hp-roll');
    row.querySelector('.level-up-roll-btn').addEventListener('click', () => {
      rollInput.value = Math.floor(Math.random() * hitDie) + 1;
      row.querySelector('input[value="roll"]').checked = true;
    });
    rollInput.addEventListener('input', () => { row.querySelector('input[value="roll"]').checked = true; });
  });

  const asiLevels = gains.filter(gain => gain.asi).map(gain => gain.level);
  const asiCard = document.getElementById('level-up-asi-card');
  const asiContainer = document.getElementById('level-up-asi-rows');
  asiCard.classList.toggle('hidden', !asiLevels.length);
  asiContainer.innerHTML = asiLevels.map(level => `
    <div class="level-up-asi-row" data-level="${level}">
      <div class="level-up-asi-row-header"><strong>Level ${level}</strong><span>Ability Score Improvement</span></div>
      <select class="level-up-asi-mode">
        <option value="">Choose improvement...</option>
        <option value="plus-two">+2 to one ability</option>
        <option value="split">+1 to two abilities</option>
        <option value="feat">Take a feat instead</option>
      </select>
      <div class="level-up-asi-controls single hidden" data-asi-controls="plus-two">${abilitySelectMarkup('level-up-asi-plus-two')}</div>
      <div class="level-up-asi-controls hidden" data-asi-controls="split">${abilitySelectMarkup('level-up-asi-plus-one-a')}${abilitySelectMarkup('level-up-asi-plus-one-b')}</div>
      <div class="level-up-asi-controls single hidden" data-asi-controls="feat"><input type="text" class="level-up-feat-name" placeholder="Feat name"></div>
    </div>
  `).join('');
  asiContainer.querySelectorAll('.level-up-asi-row').forEach(row => {
    const mode = row.querySelector('.level-up-asi-mode');
    mode.addEventListener('change', () => {
      row.querySelectorAll('[data-asi-controls]').forEach(control => {
        control.classList.toggle('hidden', control.dataset.asiControls !== mode.value);
      });
    });
  });

  const summary = document.getElementById('level-up-summary');
  summary.innerHTML = gains.map(gain => {
    const items = ['Increase maximum HP and gain one Hit Die'];
    if (gain.asi) {
      items.push('Choose an Ability Score Improvement or a feat');
      if (characterRules.spellcastingAbilityFor(className, subclass)) items.push('A class cantrip may be replaced with another cantrip from the same class');
    }
    if (gain.proficiencyIncrease) items.push(`Proficiency bonus increases to +${characterRules.proficiencyBonus(gain.level)}`);
    items.push(...gain.classFeatures.map(feature => `Class: ${feature}`));
    items.push(...gain.subclassFeatures.map(feature => `Subclass: ${feature}`));
    items.push(...gain.speciesFeatures.map(feature => `Species: ${feature}`));
    if (gain.cantripIncrease) items.push('Damaging cantrips gain another damage die where their spell description says so');
    if (characterRules.spellcastingAbilityFor(className, subclass)) items.push('Review spells known or prepared and any spell replacement allowed at this class level');
    if (className === 'Wizard') items.push('Add two wizard spells to the spellbook');
    items.push('Confirm class-table resource counts and scaling values for this level');
    return `<article class="level-up-summary-level"><h4>Level ${gain.level}</h4><ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>`;
  }).join('');

  const oldSlots = characterRules.spellSlotsFor(className, subclass, fromLevel);
  const newSlots = characterRules.spellSlotsFor(className, subclass, toLevel);
  const slotsChanged = oldSlots.some((count, index) => count !== newSlots[index]);
  const automaticParts = [
    'Proficiency bonus, proficient saves and skills, initiative, passive Perception, spell attack, and spell save DC will recalculate.',
    `Hit Dice become ${toLevel}d${hitDie}.`
  ];
  if (slotsChanged) automaticParts.push(`Spell slots change from ${formatSpellSlots(oldSlots)} to ${formatSpellSlots(newSlots)}.`);
  if (characterRules.preparedSpellCount(className, toLevel, 10) !== null) automaticParts.push('The prepared-spell limit will recalculate from the final spellcasting ability score.');
  automaticParts.push('AC will recalculate only when an automatic AC method is selected on the sheet.');
  document.getElementById('level-up-automatic-summary').textContent = automaticParts.join(' ');

  const overlay = document.getElementById('level-up-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function requestLevelUp(targetLevel) {
  if (suppressLevelUpPrompt || !editingCanEdit) return;
  const target = Math.max(1, Math.min(20, Number(targetLevel) || editingBaseLevel));
  if (target <= editingBaseLevel) return;
  const className = characterRules.canonicalClass(document.getElementById('sf-class').value);
  if (!className) {
    document.getElementById('sf-level').value = editingBaseLevel;
    refreshCharacterCalculations(true, true);
    return showToast('Choose a class before leveling up.');
  }
  pendingLevelUp = {
    fromLevel: editingBaseLevel,
    toLevel: target,
    className,
    subclass: document.getElementById('sf-subclass').value,
    species: document.getElementById('sf-species').value,
    oldConstitution: Number(document.getElementById('sf-con').value) || 10,
    oldMaximumHp: Number(document.getElementById('sf-maxhp').value) || 0,
    oldCurrentHp: Number(document.getElementById('sf-hp').value) || 0,
    oldHitDiceLeft: Math.max(0, Number(document.getElementById('sf-hitdice-left').value) || 0)
  };
  renderLevelUpDialog();
}

function collectLevelUpAbilityChoices() {
  const scores = Object.fromEntries(ABILITIES.map(ability => [ability, Number(document.getElementById(`sf-${ability}`).value) || 10]));
  const feats = [];
  for (const row of document.querySelectorAll('.level-up-asi-row')) {
    const level = Number(row.dataset.level);
    const mode = row.querySelector('.level-up-asi-mode').value;
    if (!mode) return { error: `Choose the improvement for level ${level}.` };
    if (mode === 'plus-two') {
      const ability = row.querySelector('.level-up-asi-plus-two').value;
      if (!ability) return { error: `Choose an ability for the level ${level} improvement.` };
      if (scores[ability] >= 20) return { error: `${ABILITY_LABELS[ability]} is already 20.` };
      scores[ability] = Math.min(20, scores[ability] + 2);
    } else if (mode === 'split') {
      const first = row.querySelector('.level-up-asi-plus-one-a').value;
      const second = row.querySelector('.level-up-asi-plus-one-b').value;
      if (!first || !second) return { error: `Choose two abilities for the level ${level} improvement.` };
      if (first === second) return { error: `Choose two different abilities at level ${level}.` };
      if (scores[first] >= 20 || scores[second] >= 20) return { error: 'An ability score cannot be increased above 20.' };
      scores[first] += 1;
      scores[second] += 1;
    } else {
      const feat = row.querySelector('.level-up-feat-name').value.trim();
      if (!feat) return { error: `Enter the feat chosen at level ${level}.` };
      feats.push(feat);
    }
  }
  return { scores, feats };
}

function applyLevelUp() {
  if (!pendingLevelUp) return;
  const { className, fromLevel, toLevel, oldConstitution, oldMaximumHp, oldCurrentHp, oldHitDiceLeft } = pendingLevelUp;
  const hitDie = characterRules.hitDieFor(className);
  const average = characterRules.averageHitDieRoll(className);
  const hitDieResults = [];
  for (const row of document.querySelectorAll('.level-up-hp-row')) {
    const method = row.querySelector('input[type="radio"]:checked')?.value || 'average';
    const result = method === 'average' ? average : Number(row.querySelector('.level-up-hp-roll').value);
    if (!Number.isInteger(result) || result < 1 || result > hitDie) {
      return showToast(`Enter a d${hitDie} result from 1 to ${hitDie} for level ${row.dataset.level}.`);
    }
    hitDieResults.push(result);
  }

  const choices = collectLevelUpAbilityChoices();
  if (choices.error) return showToast(choices.error);
  ABILITIES.forEach(ability => { document.getElementById(`sf-${ability}`).value = choices.scores[ability]; });
  if (choices.feats.length) {
    const featField = document.getElementById('sf-feats');
    const existing = featField.value.trim();
    const additions = choices.feats.filter(feat => !new RegExp(`(^|\\n)${feat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\n|$)`, 'i').test(existing));
    featField.value = [existing, additions.join('\n\n')].filter(Boolean).join('\n\n');
  }

  const hpIncrease = characterRules.levelUpHitPointIncrease(
    className,
    oldConstitution,
    choices.scores.con,
    toLevel,
    hitDieResults
  );
  const newMaximumHp = Math.max(1, oldMaximumHp + hpIncrease);
  document.getElementById('sf-maxhp').value = newMaximumHp;
  document.getElementById('sf-hp').value = document.getElementById('level-up-current-hp').checked
    ? Math.min(newMaximumHp, oldCurrentHp + hpIncrease)
    : Math.min(newMaximumHp, oldCurrentHp);
  document.getElementById('sf-hitdice').value = `${toLevel}d${hitDie}`;
  document.getElementById('sf-hitdice-left').value = Math.min(toLevel, oldHitDiceLeft + (toLevel - fromLevel));
  document.getElementById('sf-level').value = toLevel;

  updateSpellSlotsForLevel();
  initiativeManuallyEdited = false;
  refreshCharacterCalculations(true, true);
  editingBaseLevel = toLevel;
  closeLevelUpDialog(false);
  showToast(`Level ${toLevel} applied. Review the listed features and save the character.`);
}

document.getElementById('sf-level').addEventListener('change', () => requestLevelUp(document.getElementById('sf-level').value));
document.getElementById('level-up-btn').addEventListener('click', () => {
  if (editingBaseLevel >= 20) return showToast('This character is already level 20.');
  const target = Math.max(editingBaseLevel + 1, Number(document.getElementById('sf-level').value) || editingBaseLevel + 1);
  document.getElementById('sf-level').value = Math.min(20, target);
  requestLevelUp(document.getElementById('sf-level').value);
});
document.getElementById('level-up-close-btn').addEventListener('click', () => closeLevelUpDialog(true));
document.getElementById('level-up-cancel-btn').addEventListener('click', () => closeLevelUpDialog(true));
document.getElementById('level-up-apply-btn').addEventListener('click', applyLevelUp);

