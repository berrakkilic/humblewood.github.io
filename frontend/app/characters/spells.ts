/** Spell presets, spell editing, character saving, and derived sheet calculations. */

// ---- Spell list editor ----
const SPELL_LEVEL_NAMES = ['Cantrip', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Level 9'];
const HUMBLEWOOD_SPELL_PRESETS = [
  {
    name: 'Ambush Prey', level: 2, school: 'Illusion', range: 'Self', castingTime: '1 action',
    duration: '1 hour', components: 'S, M (a broken twig)', attack: 'First attack against an unaware target',
    damage: '+1d6', source: 'Humblewood',
    effect: 'Become invisible while you remain within 5 feet of where you cast the spell. Your first attack against a target unaware of you deals extra damage and ends the spell. The bonus damage rises by 1d6 per slot level above 2nd.'
  },
  {
    name: 'Elevated Sight', level: 1, school: 'Divination', range: 'Self', castingTime: '1 action',
    duration: 'Concentration, up to 1 minute', components: 'V, S', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'See through a movable invisible sensor up to 120 feet above you with a 360-degree view. You are blind while looking through the sensor.'
  },
  {
    name: 'Feathered Reach', level: 3, school: 'Transmutation', range: 'Self', castingTime: '1 action',
    duration: '1 minute', components: 'S, M (a small feather)', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'Your arms become wings. You gain bonus-action flight up to twice your speed but must land, an upward boost, reaction gliding, and improved jumping. Your hands must be free of shields and heavy weapons, and you cannot be encumbered.'
  },
  {
    name: 'Globe of Twilight', level: 3, school: 'Conjuration', range: 'Self (15-foot radius, 15 feet high)', castingTime: '1 action',
    duration: 'Concentration, up to 10 minutes', components: 'V, S, M (pitch and glittering sand)', attack: 'Wisdom save', damage: '', source: 'Humblewood',
    effect: 'Create a lightly obscured twilight sphere. Chosen creatures can hide and have advantage on Stealth. Other creatures have disadvantage on Perception and can be blinded until the end of their turn on a failed save.'
  },
  {
    name: 'Gust Barrier', level: 0, school: 'Evocation', range: 'Self', castingTime: '1 action',
    duration: '1 round', components: 'S', attack: 'Constitution save after a melee hit', damage: '', source: 'Humblewood',
    effect: 'Ranged attacks against you have disadvantage until the end of your next turn. A melee attacker that hits must save or be pushed up to 10 feet away and knocked prone.'
  },
  {
    name: 'Invoke the Amaranthine', level: 3, school: 'Divination', range: 'Self; affects a visible creature within 60 feet', castingTime: '10 minutes',
    duration: '24 hours', components: 'V, S, M (a holy symbol of the Amaranthine)', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'Roll and record two d20s, assigning each to attacks, checks, or saves. For 24 hours, use a reaction to replace a matching roll made by a visible ally or enemy within 60 feet before the outcome is known.'
  },
  {
    name: 'Shape Plants', level: 4, school: 'Transmutation', range: 'Touch', castingTime: '1 action',
    duration: 'Instantaneous; shaped form normally lasts 1 hour', components: 'V, S', attack: 'None', damage: '2d4 piercing per 5 feet moved', source: 'Humblewood',
    effect: 'Reshape plant life in a 5-foot cube. Brambles or thorny plants can become damaging difficult terrain. A plant may agree to keep the new form; the affected cube grows by 5 feet per slot level above 4th.'
  },
  {
    name: 'Spiny Shield', level: 1, school: 'Abjuration', range: 'Self', castingTime: '1 reaction',
    duration: '1 round', components: 'V, S, M (a small quill)', attack: 'Triggers when hit by a melee attack', damage: '2d4 piercing', source: 'Humblewood',
    effect: 'Reduce the triggering melee damage by 2d4 and deal the same amount to the attacker. The barrier also grants +2 AC against ranged attacks. Both dice effects rise by 1d4 per slot level above 1st.'
  },
  {
    name: 'Stellar Bodies', level: 4, school: 'Evocation', range: 'Special; star attack reaches 120 feet', castingTime: '1 action',
    duration: '1 minute', components: 'V, S', attack: 'Ranged spell attack; Wisdom and Constitution saves', damage: '4d8 radiant', source: 'Humblewood',
    effect: 'Create two orbiting stars. Nearby melee attackers can take 1d8 radiant damage per star on a failed Wisdom save. Once per round, expend a star as a ranged spell attack; on a hit the target takes damage and can be blinded on a failed Constitution save.'
  },
  {
    name: 'Veil of Dusk', level: 1, school: 'Abjuration', range: '60 feet', castingTime: '1 bonus action',
    duration: 'Concentration, up to 10 minutes', components: 'V, S, M (a pinch of soot)', attack: 'None', damage: '', source: 'Humblewood',
    effect: 'Cloak one creature in shadow and silence. The target gains +1 AC and has advantage on Stealth checks for the duration.'
  }
];

function allSpellPresets() {
  return [
    ...HUMBLEWOOD_SPELL_PRESETS,
    ...(window.HumblewoodPhbSpellPresets?.PHB_SPELL_PRESETS || []),
    ...creationPresets.STANDARD_SPELL_PRESETS
  ];
}

function normalizeSpell(spell, index = 0) {
  if (!spell || typeof spell !== 'object') return null;
  const name = String(spell.name || '').trim();
  if (!name) return null;
  const normalized: any = {
    id: String(spell.id || `spell-normalized-${index}`),
    name,
    level: Math.max(0, Math.min(9, Number(spell.level) || 0)),
    school: String(spell.school || '').trim(),
    range: String(spell.range || '').trim(),
    castingTime: String(spell.castingTime || '').trim(),
    duration: String(spell.duration || '').trim(),
    components: String(spell.components || '').trim(),
    attack: String(spell.attack || '').trim(),
    damage: String(spell.damage || '').trim(),
    effect: String(spell.effect ?? spell.description ?? '').trim(),
    source: String(spell.source || '').trim()
  };
  if (typeof spell.prepared === 'boolean') normalized.prepared = spell.prepared;
  if (spell.alwaysPrepared === true) normalized.alwaysPrepared = true;
  return normalized;
}

function normalizeSpellList(raw) {
  let list = Array.isArray(raw) ? raw : null;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch (err) { /* not JSON, treated as empty — legacy text lives in spells-N fields */ }
  }
  return (list || []).map(normalizeSpell).filter(Boolean);
}

function migrateLegacySpellText(fields) {
  const migrated = [];
  for (let level = 0; level <= 9; level += 1) {
    const text = String(fields?.[`spells-${level}`] || '').trim();
    if (!text) continue;
    text.split(/\n|;/).flatMap(line => {
      const trimmed = line.trim();
      return trimmed.includes(',') && !/\d+d\d+/i.test(trimmed) ? trimmed.split(',') : [trimmed];
    }).map(name => name.trim()).filter(Boolean).forEach(name => {
      migrated.push(normalizeSpell({ id: `spell-migrated-${level}-${migrated.length}`, name, level }, migrated.length));
    });
  }
  return migrated;
}

function syncSpellListField() {
  document.getElementById('sf-spell-list').value = JSON.stringify(editingSpells);
}

function renderSpellListEditor() {
  const container = document.getElementById('spell-list');
  container.innerHTML = '';
  if (!editingSpells.length) {
    container.innerHTML = '<p class="sidebar-help">No spells added yet.</p>';
    syncSpellListField();
    return;
  }
  const preparesSpells = characterRules.preparedSpellCount(
    document.getElementById('sf-class').value,
    document.getElementById('sf-level').value,
    10
  ) !== null;
  const byLevel = new Map();
  editingSpells.forEach(spell => {
    const level = Math.max(0, Math.min(9, Number(spell.level) || 0));
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push(spell);
  });
  [...byLevel.keys()].sort((a, b) => a - b).forEach(level => {
    const group = document.createElement('div');
    group.className = 'spell-level-group';
    const title = document.createElement('div');
    title.className = 'spell-level-group-title';
    title.textContent = SPELL_LEVEL_NAMES[level];
    group.appendChild(title);
    byLevel.get(level).forEach(spell => {
      const row = document.createElement('div');
      row.className = 'spell-list-item';
      const main = document.createElement('div');
      main.className = 'spell-list-item-main';
      const name = document.createElement('div');
      name.className = 'spell-list-item-name';
      name.textContent = spell.name;
      if (spell.source) {
        const source = document.createElement('span');
        source.className = 'spell-source-badge';
        source.textContent = spell.source;
        name.appendChild(source);
      }
      if (spell.alwaysPrepared || (preparesSpells && spell.level > 0 && spell.prepared === true)) {
        const prepared = document.createElement('span');
        prepared.className = `spell-prepared-badge${spell.alwaysPrepared ? ' always' : ''}`;
        prepared.textContent = spell.alwaysPrepared ? 'Always prepared' : 'Prepared';
        name.appendChild(prepared);
      }
      main.appendChild(name);
      const metadata = [
        spell.school,
        spell.range ? `Range: ${spell.range}` : '',
        spell.attack && !/^none$/i.test(spell.attack) ? `Attack/save: ${spell.attack}` : '',
        spell.damage ? `Damage: ${spell.damage}` : ''
      ].filter(Boolean);
      if (metadata.length) {
        const meta = document.createElement('div');
        meta.className = 'spell-list-item-meta';
        metadata.forEach(value => {
          const item = document.createElement('span');
          item.textContent = value;
          meta.appendChild(item);
        });
        main.appendChild(meta);
      }
      if (spell.effect) {
        const desc = document.createElement('div');
        desc.className = 'spell-list-item-desc';
        desc.textContent = spell.effect;
        main.appendChild(desc);
      }
      row.appendChild(main);
      const actions = document.createElement('div');
      actions.className = 'spell-list-item-actions';
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'edit'; edit.textContent = '✎'; edit.title = 'Edit spell';
      edit.disabled = !editingCanEdit;
      edit.onclick = () => openSpellForm(spell);
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'del'; del.textContent = '×'; del.title = 'Remove spell';
      del.disabled = !editingCanEdit;
      del.onclick = () => {
        editingSpells = editingSpells.filter(entry => entry.id !== spell.id);
        renderSpellListEditor();
      };
      actions.append(edit, del);
      row.appendChild(actions);
      group.appendChild(row);
    });
    container.appendChild(group);
  });
  syncSpellListField();
}

function populateSpellForm(spell: any = {}) {
  const form = document.getElementById('spell-add-form');
  const normalized: any = normalizeSpell({ name: spell.name || ' ', ...spell }) || {};
  form.dataset.spellSource = normalized.source || '';
  document.getElementById('spell-form-name').value = spell.name || '';
  document.getElementById('spell-form-level').value = normalized.level ?? '0';
  document.getElementById('spell-form-school').value = normalized.school || '';
  document.getElementById('spell-form-range').value = normalized.range || '';
  document.getElementById('spell-form-casting-time').value = normalized.castingTime || '';
  document.getElementById('spell-form-duration').value = normalized.duration || '';
  document.getElementById('spell-form-components').value = normalized.components || '';
  document.getElementById('spell-form-attack').value = normalized.attack || '';
  document.getElementById('spell-form-damage').value = normalized.damage || '';
  document.getElementById('spell-form-effect').value = normalized.effect || '';
  document.getElementById('spell-form-always-prepared').checked = !!normalized.alwaysPrepared;
}

function openSpellForm(spell) {
  const form = document.getElementById('spell-add-form');
  form.classList.remove('hidden');
  editingSpellId = spell ? spell.id : null;
  document.getElementById('spell-preset-select').value = '';
  populateSpellForm(spell || {});
  document.getElementById('spell-form-name').focus();
}

const spellPresetSelect = document.getElementById('spell-preset-select');
['Humblewood', "Player's Handbook (2014)"].forEach(source => {
  const group = document.createElement('optgroup');
  group.label = source;
  allSpellPresets()
    .filter(spell => spell.source === source)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    .forEach(spell => {
      const option = document.createElement('option');
      option.value = `${source}::${spell.name}`;
      option.textContent = `${SPELL_LEVEL_NAMES[spell.level]} · ${spell.name}`;
      group.appendChild(option);
    });
  spellPresetSelect.appendChild(group);
});

function selectedSpellPreset() {
  const [source, ...nameParts] = spellPresetSelect.value.split('::');
  const name = nameParts.join('::');
  return allSpellPresets().find(spell => spell.source === source && spell.name === name);
}

function addSpellNames(raw) {
  const names = String(raw || '').split(/[,;\n]/).map(name => name.trim()).filter(Boolean);
  if (!names.length) return showToast('Enter at least one spell name.');
  let added = 0;
  names.forEach(name => {
    if (editingSpells.some(existing => existing.name.toLowerCase() === name.toLowerCase())) return;
    const preset = creationPresets.findSpellPreset(name, allSpellPresets());
    editingSpells.push(normalizeSpell({
      ...(preset || {}),
      id: `spell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: preset?.name || name,
      level: preset?.level || 0,
      source: preset?.source || 'Custom list'
    }));
    added += 1;
  });
  renderSpellListEditor();
  document.getElementById('spell-bulk-list').value = '';
  showToast(added ? `Added ${added} spell${added === 1 ? '' : 's'}.` : 'Those spells are already on the sheet.');
}

document.getElementById('spell-preset-load').onclick = () => {
  const preset = selectedSpellPreset();
  if (!preset) return showToast('Choose a spell preset first.');
  populateSpellForm(preset);
};
document.getElementById('spell-bulk-add').onclick = () => addSpellNames(document.getElementById('spell-bulk-list').value);

document.getElementById('spell-add-btn').onclick = () => openSpellForm(null);
document.getElementById('spell-form-cancel').onclick = () => {
  document.getElementById('spell-add-form').classList.add('hidden');
  editingSpellId = null;
};
document.getElementById('spell-form-save').onclick = () => {
  const name = document.getElementById('spell-form-name').value.trim();
  if (!name) return alert('Give the spell a name first.');
  const existing = editingSpells.find(entry => entry.id === editingSpellId);
  const spell = normalizeSpell({
    id: editingSpellId || `spell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    level: document.getElementById('spell-form-level').value,
    school: document.getElementById('spell-form-school').value,
    range: document.getElementById('spell-form-range').value,
    castingTime: document.getElementById('spell-form-casting-time').value,
    duration: document.getElementById('spell-form-duration').value,
    components: document.getElementById('spell-form-components').value,
    attack: document.getElementById('spell-form-attack').value,
    damage: document.getElementById('spell-form-damage').value,
    effect: document.getElementById('spell-form-effect').value,
    source: document.getElementById('spell-add-form').dataset.spellSource || '',
    prepared: existing?.prepared,
    alwaysPrepared: document.getElementById('spell-form-always-prepared').checked
  });
  if (editingSpellId) {
    const index = editingSpells.findIndex(entry => entry.id === editingSpellId);
    if (index !== -1) editingSpells[index] = spell;
  } else {
    editingSpells.push(spell);
  }
  editingSpellId = null;
  document.getElementById('spell-add-form').classList.add('hidden');
  renderSpellListEditor();
};

document.getElementById('sf-portrait').onchange = (event) => {
  pendingPortraitFile = event.target.files[0] || null;
  if (!pendingPortraitFile) return renderPortraitPreview(editingPortraitUrl);
  const reader = new FileReader();
  reader.onload = () => renderPortraitPreview(reader.result);
  reader.readAsDataURL(pendingPortraitFile);
};

function renderPortraitPreview(url) {
  const preview = document.getElementById('portrait-preview');
  preview.innerHTML = '';
  if (!url) {
    preview.textContent = '🍃';
    return;
  }
  const image = document.createElement('img');
  image.src = url;
  image.alt = 'Character portrait';
  preview.appendChild(image);
}

function collectCharacterFields() {
  const fields: any = {};
  document.querySelectorAll('#sheet-form [id^="sf-"]').forEach(input => {
    if (input.type === 'file') return;
    const key = input.id.slice(3);
    fields[key] = input.type === 'checkbox' ? input.checked : input.value;
  });
  return fields;
}

document.getElementById('save-sheet-btn').onclick = async () => {
  if (!editingCanEdit) return;
  refreshCharacterCalculations(false);
  let fields = collectCharacterFields();
  const name = String(fields.name || '').trim();
  const isNpc = !!editingNpcSheetId;
  if (!name) return alert(`Every ${isNpc ? 'NPC' : 'character'} needs a name.`);
  if (!isNpc) {
    const constrainedCharacter = { fields };
    const validationError = characterRules.validatePlayerCharacter(constrainedCharacter);
    if (validationError) return alert(validationError);
    characterRules.applyPlayerCharacterConstraints(constrainedCharacter);
    fields = constrainedCharacter.fields;
  }
  const saveButton = document.getElementById('save-sheet-btn');
  saveButton.disabled = true;
  saveButton.textContent = 'Saving…';
  try {
    if (pendingPortraitFile) editingPortraitUrl = await uploadFile(pendingPortraitFile);
  } catch (error) {
    showToast('The portrait could not be uploaded. Please try again.');
    saveButton.disabled = false;
    saveButton.textContent = isNpc ? 'Save NPC' : 'Save character';
    return;
  }

  const num = (key, fallback = 0) => Number(fields[key]) || fallback;
  const sheet = {
    name,
    pronouns: String(fields.pronouns || '').trim(),
    _originalName: editingOriginalName,
    portraitUrl: editingPortraitUrl,
    species: fields.species || '',
    race: fields.species || '',
    subrace: fields.subrace || '',
    charClass: fields.class || '',
    subclass: fields.subclass || '',
    level: Math.max(1, Math.min(20, num('level', 1))),
    hp: num('hp'), maxHp: num('maxhp'), tempHp: num('temphp'), ac: num('ac', 10),
    initiativeModifier: num('initiative'), speed: fields.speed || '',
    abilities: Object.fromEntries(ABILITIES.map(ability => [ability, num(ability, 10)])),
    saves: Object.fromEntries(ABILITIES.map(ability => [ability, {
      proficient: !!fields[`save-${ability}-prof`], modifier: num(`save-${ability}`)
    }])),
    skills: Object.fromEntries(Object.keys(SKILL_ABILITIES).map(skill => [skill, {
      proficient: !!fields[`skill-${skill}-prof`], modifier: num(`skill-${skill}`)
    }])),
    attacks: editingAttacks.map(attack => ({ ...attack })),
    spellcasting: {
      className: fields['spell-class'] || '', ability: fields['spell-ability'] || '',
      saveDc: num('spell-dc'), attackBonus: num('spell-attack')
    },
    inventory: editingInventory.map(item => ({ ...item })),
    notes: fields.notes || '',
    fields
  };
  if (isNpc) {
    const existing = editingNpcSheetId === '__new__' ? null : state.npcs?.[editingNpcSheetId];
    const spellSlots = {};
    for (let level = 1; level <= 9; level += 1) {
      const total = Math.max(0, Number(fields[`spell-slots-${level}`]) || 0);
      spellSlots[level] = {
        total,
        used: Math.max(0, Math.min(total, Number(fields[`spell-used-${level}`]) || 0))
      };
    }
    const npcPayload = {
      ...(existing ? { id: existing.id } : {}),
      name,
      pronouns: sheet.pronouns,
      imageUrl: editingPortraitUrl,
      hp: num('hp', 10), maxHp: Math.max(1, num('maxhp', 10)), tempHp: Math.max(0, num('temphp')),
      ac: num('ac', 10), initiativeModifier: num('initiative'),
      attacks: sheet.attacks,
      spells: editingSpells.map(spell => ({ ...spell })),
      spellcasting: sheet.spellcasting,
      notes: fields['attacks-notes'] || fields.notes || '',
      combat: {
        ...(existing?.combat || {}),
        spellSlots
      },
      sheet: {
        ...sheet,
        portraitUrl: editingPortraitUrl,
        challenge: document.getElementById('sheet-form').dataset.npcChallenge || existing?.sheet?.challenge || '',
        spells: editingSpells.map(spell => ({ ...spell }))
      }
    };
    socket.emit(existing ? 'npc:update' : 'npc:create', npcPayload);
  } else {
    socket.emit('character:save', sheet);
    document.getElementById('sheet-editor').classList.add('hidden');
  }
  saveButton.disabled = false;
  saveButton.textContent = isNpc ? 'Save NPC' : 'Save character';
  if (!isNpc) showToast(`${name} saved.`);
};

document.getElementById('delete-sheet-btn').onclick = () => {
  if (editingNpcSheetId) {
    if (editingNpcSheetId !== '__new__' && confirm(`Delete ${state.npcs?.[editingNpcSheetId]?.name || 'this NPC'}?`)) {
      socket.emit('npc:delete', { id: editingNpcSheetId });
    } else if (editingNpcSheetId !== '__new__') {
      return;
    }
    editingNpcSheetId = null;
    document.getElementById('sheet-editor').classList.add('hidden');
    return;
  }
  if (editingOriginalName && confirm(`Delete ${editingOriginalName}?`)) {
    socket.emit('character:remove', { name: editingOriginalName });
  } else if (editingOriginalName) {
    return;
  }
  document.getElementById('sheet-editor').classList.add('hidden');
};

function abilityModifier(score) {
  return Math.floor(((Number(score) || 10) - 10) / 2);
}

function proficiencyBonus(level) {
  return 2 + Math.floor((Math.max(1, Math.min(20, Number(level) || 1)) - 1) / 4);
}

function updateSpellSlotsForLevel() {
  const className = document.getElementById('sf-class').value;
  const subclass = document.getElementById('sf-subclass').value;
  const level = document.getElementById('sf-level').value;
  const slots = characterRules.spellSlotsFor(className, subclass, level);
  for (let spellLevel = 1; spellLevel <= 9; spellLevel += 1) {
    const maximum = slots[spellLevel - 1] || 0;
    const maximumInput = document.getElementById(`sf-spell-slots-${spellLevel}`);
    const usedInput = document.getElementById(`sf-spell-used-${spellLevel}`);
    maximumInput.value = maximum;
    usedInput.value = Math.min(maximum, Math.max(0, Number(usedInput.value) || 0));
  }
}

function refreshArmorClass() {
  const methodInput = document.getElementById('sf-ac-method');
  const armorClassInput = document.getElementById('sf-ac');
  const baseInput = document.getElementById('sf-ac-base');
  const method = methodInput.value;
  const calculated = characterRules.armorClass({
    method,
    base: baseInput.value,
    bonus: document.getElementById('sf-ac-bonus').value,
    dex: document.getElementById('sf-dex').value,
    con: document.getElementById('sf-con').value,
    wis: document.getElementById('sf-wis').value
  });
  const automatic = calculated !== null;
  armorClassInput.readOnly = automatic;
  baseInput.readOnly = !['light', 'medium', 'heavy'].includes(method);
  if (automatic) armorClassInput.value = calculated;

  const notes = {
    manual: 'Manual AC remains unchanged.',
    unarmored: '10 + Dexterity modifier + the shield/other bonus.',
    light: 'Armor base + Dexterity modifier + the shield/other bonus.',
    medium: 'Armor base + Dexterity modifier (maximum +2) + the shield/other bonus.',
    heavy: 'Armor base + the shield/other bonus; Dexterity does not apply.',
    barbarian: '10 + Dexterity modifier + Constitution modifier + the shield/other bonus.',
    monk: '10 + Dexterity modifier + Wisdom modifier + other bonuses. Monk Unarmored Defense does not allow a shield.',
    hedge: '14 + Dexterity modifier + the shield/other bonus. Hedges cannot wear armor.',
    'hedge-curled': '19 + the shield/other bonus while curled up; Dexterity does not apply.'
  };
  document.getElementById('ac-calculation-note').textContent = notes[method] || notes.manual;
}

function refreshCharacterCalculations(force, recalculateSpell = false) {
  const level = document.getElementById('sf-level');
  const bonus = proficiencyBonus(level.value);
  document.getElementById('sf-prof-bonus').value = bonus;
  ABILITIES.forEach(ability => {
    const modifier = abilityModifier(document.getElementById(`sf-${ability}`).value);
    document.getElementById(`mod-${ability}`).textContent = signed(modifier);
    const saveInput = document.getElementById(`sf-save-${ability}`);
    const saveValue = modifier + (document.getElementById(`sf-save-${ability}-prof`).checked ? bonus : 0);
    if (force || saveInput.value === '') saveInput.value = saveValue;
  });
  Object.entries(SKILL_ABILITIES).forEach(([skill, ability]) => {
    const input = document.getElementById(`sf-skill-${skill}`);
    const value = abilityModifier(document.getElementById(`sf-${ability}`).value) +
      (document.getElementById(`sf-skill-${skill}-prof`).checked ? bonus : 0);
    if (force || input.value === '') input.value = value;
  });
  const initiativeInput = document.getElementById('sf-initiative');
  if (!initiativeManuallyEdited && (force || initiativeInput.value === '')) {
    initiativeInput.value = abilityModifier(document.getElementById('sf-dex').value);
  }
  const passive = document.getElementById('sf-passive-perception');
  if (force || passive.value === '') passive.value = 10 + Number(document.getElementById('sf-skill-perception').value || 0);
  const spellAbility = document.getElementById('sf-spell-ability').value.toLowerCase();
  if (ABILITIES.includes(spellAbility)) {
    const calculated = characterRules.spellcastingValues(
      document.getElementById(`sf-${spellAbility}`).value,
      level.value
    );
    const spellDc = document.getElementById('sf-spell-dc');
    const spellAttack = document.getElementById('sf-spell-attack');
    if (recalculateSpell || spellDc.value === '') spellDc.value = calculated.saveDc;
    if (recalculateSpell || spellAttack.value === '') spellAttack.value = calculated.attackBonus;
  }
  const className = document.getElementById('sf-class').value;
  const subclass = document.getElementById('sf-subclass').value;
  const preparedAbility = characterRules.spellcastingAbilityFor(className, subclass) || spellAbility;
  const prepared = characterRules.preparedSpellCount(
    className,
    level.value,
    ABILITIES.includes(preparedAbility) ? document.getElementById(`sf-${preparedAbility}`).value : 10
  );
  document.getElementById('sf-spells-prepared').value = prepared === null ? '' : prepared;
  refreshArmorClass();
}

ABILITIES.forEach(ability => document.getElementById(`sf-${ability}`).addEventListener('input', () => {
  const spellAbility = document.getElementById('sf-spell-ability').value.toLowerCase();
  if (ability === 'con') refreshNewCharacterHitPoints();
  refreshCharacterCalculations(true, ability === spellAbility);
}));
document.getElementById('sf-level').addEventListener('input', () => {
  refreshCharacterCalculations(true, true);
  syncAutomaticClassFeatures(true);
  renderSpellListEditor();
});
document.getElementById('sf-initiative').addEventListener('input', () => { initiativeManuallyEdited = true; });
ABILITIES.forEach(ability => document.getElementById(`sf-save-${ability}-prof`).addEventListener('change', () => refreshCharacterCalculations(true)));
Object.keys(SKILL_ABILITIES).forEach(skill => document.getElementById(`sf-skill-${skill}-prof`).addEventListener('change', () => refreshCharacterCalculations(true)));
document.getElementById('sf-spell-ability').addEventListener('change', () => refreshCharacterCalculations(false, true));
document.getElementById('sf-ac-method').addEventListener('change', () => {
  acMethodManuallySelected = true;
  refreshArmorClass();
});
document.getElementById('sf-ac-base').addEventListener('input', refreshArmorClass);
document.getElementById('sf-ac-bonus').addEventListener('input', refreshArmorClass);
