/** Character and NPC sheet setup, class/species rules, editor lifecycle, and cards. */

// ================= CHARACTERS =================
function replaceSelectOptions(select, options, placeholder, selected = '') {
  select.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = placeholder;
  select.appendChild(empty);
  options.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  const canonicalSelected = options.find(value => value.toLowerCase() === String(selected || '').trim().toLowerCase()) || '';
  select.value = canonicalSelected;
}

function sheetSpeciesOptions() {
  return characterRules.speciesOptions({ includeNpcOnly: !!editingNpcSheetId });
}

function updateSpeciesOptions(selected = '') {
  replaceSelectOptions(
    document.getElementById('sf-species'),
    sheetSpeciesOptions(),
    'Choose a species...',
    selected
  );
}

function updateSubraceOptions(selected = '') {
  const includeNpcOnly = !!editingNpcSheetId;
  const species = characterRules.canonicalSpecies(
    document.getElementById('sf-species').value,
    { includeNpcOnly }
  );
  const select = document.getElementById('sf-subrace');
  const options = characterRules.subracesFor(species, { includeNpcOnly });
  const placeholder = !species ? 'Choose a species first...' : options.length ? 'Choose a subrace...' : 'This species has no subrace';
  replaceSelectOptions(select, options, placeholder, selected);
  select.disabled = !species || !options.length || !editingCanEdit;
}

function syncAutomaticSpeciesTraits(force = false) {
  const field = document.getElementById('sf-racial-traits');
  if (!field) return;
  const current = field.value || '';
  const hasAutomaticBlock = current.includes(characterRules.AUTO_SPECIES_TRAITS_START);
  // An older sheet may contain hand-written race notes. Preserve those on
  // open; if the player actively changes a choice, append the marked automatic
  // block alongside their notes instead of replacing anything.
  if (!force && current.trim() && !hasAutomaticBlock) return;
  const automatic = characterRules.automaticSpeciesTraitText(
    document.getElementById('sf-species').value,
    document.getElementById('sf-subrace').value
  );
  field.value = characterRules.mergeAutomaticSpeciesTraits(current, automatic);
}

function syncAutomaticClassFeatures(force = false) {
  const field = document.getElementById('sf-features');
  if (!field) return;
  const current = field.value || '';
  const hasAutomaticBlock = current.includes(characterRules.AUTO_CLASS_FEATURES_START);
  // Preserve feature notes from older sheets until the player actively
  // changes class, subclass, or level. Generated content is isolated inside
  // its own block so future updates never replace hand-written choices.
  if (!force && current.trim() && !hasAutomaticBlock) return;
  const automatic = characterRules.automaticClassFeatureText(
    document.getElementById('sf-class').value,
    document.getElementById('sf-subclass').value,
    document.getElementById('sf-level').value
  );
  field.value = characterRules.mergeAutomaticClassFeatures(current, automatic);
}

function updateSubclassOptions(selected = '') {
  const className = characterRules.canonicalClass(document.getElementById('sf-class').value);
  const select = document.getElementById('sf-subclass');
  const options = characterRules.subclassesFor(className);
  replaceSelectOptions(select, options, className ? 'Choose a subclass...' : 'Choose a class first...', selected);
  select.disabled = !className || !options.length || !editingCanEdit;
}

function setCharacterRuleSelections(fields: any = {}) {
  updateSpeciesOptions(fields.species);
  updateSubraceOptions(fields.subrace);
  syncAutomaticSpeciesTraits();
  document.getElementById('sf-class').value = characterRules.canonicalClass(fields.class) || '';
  updateSubclassOptions(fields.subclass);
  syncAutomaticClassFeatures();
}

function initializeCharacterRuleControls() {
  updateSpeciesOptions();
  replaceSelectOptions(document.getElementById('sf-class'), Object.keys(characterRules.CLASS_SUBCLASSES), 'Choose a class...');
  updateSubraceOptions();
  updateSubclassOptions();
  document.getElementById('sf-species').addEventListener('change', () => {
    updateSubraceOptions();
    syncAutomaticSpeciesTraits(true);
    applyRecommendedArmorMethod();
  });
  document.getElementById('sf-subrace').addEventListener('change', () => {
    syncAutomaticSpeciesTraits(true);
  });
  document.getElementById('sf-class').addEventListener('change', () => {
    updateSubclassOptions();
    syncAutomaticClassFeatures(true);
    applyClassDefaults();
    renderSpellListEditor();
  });
  document.getElementById('sf-subclass').addEventListener('change', () => {
    syncAutomaticClassFeatures(true);
    applySpellcastingDefaults();
    updateSpellSlotsForLevel();
    refreshCharacterCalculations(false, true);
    renderSpellListEditor();
  });
}

function applyRecommendedArmorMethod() {
  if (acMethodManuallySelected) return refreshArmorClass();
  const method = characterRules.defaultArmorMethod(
    document.getElementById('sf-species').value,
    document.getElementById('sf-class').value
  );
  document.getElementById('sf-ac-method').value = method;
  refreshArmorClass();
}

function applyClassDefaults() {
  const className = characterRules.canonicalClass(document.getElementById('sf-class').value);
  if (!className) return;
  const level = Math.max(1, Math.min(20, Number(document.getElementById('sf-level').value) || 1));
  const hitDie = characterRules.hitDieFor(className);
  document.getElementById('sf-hitdice').value = `${level}d${hitDie}`;
  document.getElementById('sf-hitdice-left').value = level;

  const savingThrows = new Set(characterRules.classSavingThrows(className));
  ABILITIES.forEach(ability => {
    document.getElementById(`sf-save-${ability}-prof`).checked = savingThrows.has(ability);
  });

  if (!editingOriginalName && level === 1) {
    const maximum = Math.max(1, hitDie + characterRules.abilityModifier(document.getElementById('sf-con').value));
    document.getElementById('sf-maxhp').value = maximum;
    document.getElementById('sf-hp').value = maximum;
  }
  applySpellcastingDefaults();
  updateSpellSlotsForLevel();
  applyRecommendedArmorMethod();
  refreshCharacterCalculations(true, true);
}

function refreshNewCharacterHitPoints() {
  if (editingOriginalName || editingBaseLevel !== 1 || Number(document.getElementById('sf-level').value) !== 1) return;
  const className = characterRules.canonicalClass(document.getElementById('sf-class').value);
  if (!className) return;
  const maximum = Math.max(
    1,
    characterRules.hitDieFor(className) + characterRules.abilityModifier(document.getElementById('sf-con').value)
  );
  document.getElementById('sf-maxhp').value = maximum;
  document.getElementById('sf-hp').value = maximum;
}

function applySpellcastingDefaults() {
  const className = characterRules.canonicalClass(document.getElementById('sf-class').value);
  const subclass = document.getElementById('sf-subclass').value;
  const ability = characterRules.spellcastingAbilityFor(className, subclass);
  if (!ability) return;
  document.getElementById('sf-spell-class').value = className;
  document.getElementById('sf-spell-ability').value = ability.toUpperCase();
}

function initializeFeatPresetControls() {
  const select = document.getElementById('feat-preset-select');
  HUMBLEWOOD_FEAT_PRESETS.forEach(feat => {
    const option = document.createElement('option');
    option.value = feat.title;
    const prerequisite = feat.facts?.find(([label]) => label === 'Prerequisite')?.[1];
    option.textContent = prerequisite ? `${feat.title} · requires ${prerequisite}` : feat.title;
    select.appendChild(option);
  });
  document.getElementById('feat-preset-add').addEventListener('click', addFeatPresetToSheet);
}

function addFeatPresetToSheet() {
  const select = document.getElementById('feat-preset-select');
  const feat = HUMBLEWOOD_FEAT_PRESETS.find(entry => entry.title === select.value);
  if (!feat) return showToast('Choose a Humblewood feat first.');
  const prerequisite = feat.facts?.find(([label]) => label === 'Prerequisite')?.[1] || '';
  const species = characterRules.canonicalSpecies(document.getElementById('sf-species').value);
  if (/glide trait/i.test(prerequisite) && !/\(birdfolk\)$/i.test(species)) {
    return showToast(`${feat.title} requires the Glide trait. Choose a birdfolk species first.`);
  }

  const textarea = document.getElementById('sf-feats');
  if (new RegExp(`(^|\\n)${feat.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\n|$)`, 'i').test(textarea.value.trim())) {
    return showToast(`${feat.title} is already on this character.`);
  }

  const details = [];
  (feat.facts || []).forEach(([label, value]) => details.push(`${label}: ${value}`));
  (feat.sections || []).forEach(section => {
    if (section.text) details.push(`${section.heading}: ${section.text}`);
    (section.items || []).forEach(item => details.push(`• ${item}`));
  });
  const block = [feat.title, ...details].join('\n');
  textarea.value = [textarea.value.trim(), block].filter(Boolean).join('\n\n');
  select.value = '';
  textarea.focus();
  showToast(`${feat.title} added.`);
}

function renderCharacters() {
  const grid = document.getElementById('char-grid');
  grid.innerHTML = '';
  renderNpcFilterControls();
  const characters = Object.values(state.characters || {}).sort((a, b) => a.name.localeCompare(b.name));
  if (!characters.length) grid.innerHTML = '<p class="empty-character-grid">No player characters yet.</p>';
  characters.forEach(c => {
    const card = document.createElement('div');
    card.className = 'char-card';
    const canEdit = canEditCharacter(c);
    const mapToken = state.tokens.find(token => token.characterName === c.name);
    const combat = c.combat || {};
    const conditionSummary = [
      ...(combat.conditions || []),
      combat.concentration ? 'Concentrating' : '',
      combat.exhaustion ? `Exhaustion ${combat.exhaustion}` : ''
    ].filter(Boolean);
    const species = c.species || c.race || '';
    const charClass = c.charClass || c.className || '';
    card.innerHTML = `
      <div class="card-top">
        <div class="card-portrait">${c.portraitUrl ? `<img src="${escapeAttr(c.portraitUrl)}" alt="">` : '🍃'}</div>
        <div><h3>${escapeHtml(c.name)}</h3><div class="meta">${escapeHtml([c.pronouns, species, charClass, `Level ${Number(c.level) || 1}`].filter(Boolean).join(' · '))}</div></div>
        ${canEdit ? '' : '<span class="locked-badge">View only</span>'}
      </div>
      <div class="stat-row">
        <span class="stat-pill">HP ${Number(c.hp) || 0}/${Number(c.maxHp) || 0}</span>
        ${Number(c.tempHp) ? `<span class="stat-pill temp-hp-pill">+${Number(c.tempHp)} temp</span>` : ''}
        <span class="stat-pill">AC ${Number(c.ac) || 0}</span>
        <span class="stat-pill">Init ${signed(characterInitiativeModifier(c))}</span>
      </div>
      ${conditionSummary.length ? `<div class="character-condition-summary">${conditionSummary.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
      <div class="char-card-actions">
        <button type="button" class="btn-ghost view-character-btn">${canEdit ? 'Open sheet' : 'View sheet'}</button>
        ${canEdit ? '<button type="button" class="btn-rose roll-character-btn">🎲 Roll</button>' : ''}
        ${myRole === 'dm' ? '<button type="button" class="btn-ghost initiative-character-btn">🎲 Initiative</button>' : ''}
        ${canEdit ? '<button type="button" class="btn-ghost combat-character-btn">⚔ Combat</button>' : ''}
        ${canEdit ? `<button type="button" class="btn-ghost map-character-btn">${mapToken ? 'Remove from map' : 'Put on map'}</button>` : ''}
        ${myRole === 'player' && canEdit && !c.claimed ? '<button type="button" class="btn-ghost claim-character-btn">Claim character</button>' : ''}
        ${myRole === 'dm' && c.claimed ? '<button type="button" class="btn-ghost release-character-btn">Release owner</button>' : ''}
      </div>
    `;
    card.querySelector('.view-character-btn').onclick = () => openSheetEditor(c);
    card.querySelector('.roll-character-btn')?.addEventListener('click', () => openCharacterRoller(c.name));
    card.querySelector('.initiative-character-btn')?.addEventListener('click', () => rollCharacterInitiative(c, 'normal'));
    card.querySelector('.combat-character-btn')?.addEventListener('click', () => openCombatManager(c.name));
    card.querySelector('.map-character-btn')?.addEventListener('click', () => {
      if (mapToken) socket.emit('token:remove', { id: mapToken.id });
      else socket.emit('token:add', { characterName: c.name });
    });
    card.querySelector('.claim-character-btn')?.addEventListener('click', () => socket.emit('character:claim', { name: c.name }));
    card.querySelector('.release-character-btn')?.addEventListener('click', () => {
      if (confirm(`Release ${c.name} so their named player can claim them again?`)) socket.emit('character:ownership:release', { name: c.name });
    });
    grid.appendChild(card);
  });

  const npcGrid = document.getElementById('npc-sheet-grid');
  if (!npcGrid) return;
  npcGrid.innerHTML = '';
  const allNpcs = Object.values(state.npcs || {});
  const npcs = filteredNpcDirectory(allNpcs).sort((a, b) => a.name.localeCompare(b.name));
  if (!npcs.length) {
    npcGrid.innerHTML = `<p class="empty-character-grid">${allNpcs.length ? 'No NPCs match these filters.' : 'No NPCs yet. Create one from a preset or paste a stat block.'}</p>`;
    return;
  }
  npcs.forEach(npc => {
    const token = state.tokens.find(entry => entry.npcId === npc.id);
    const fields = npc.sheet?.fields || {};
    const descriptor = fields.background || (npc.sheet ? 'Full NPC sheet' : 'Quick NPC');
    const challenge = npc.sheet?.challenge ? ` · CR ${npc.sheet.challenge}` : '';
    const details = npcDirectoryDetails(npc);
    const card = document.createElement('div');
    card.className = 'char-card npc-sheet-card';
    card.innerHTML = `
      <div class="card-top">
        <div class="card-portrait">${npc.imageUrl ? `<img src="${escapeAttr(npc.imageUrl)}" alt="">` : '🦊'}</div>
        <div><h3>${escapeHtml(npc.name)}</h3><div class="meta">${escapeHtml([npc.pronouns, details.race !== 'Unspecified' ? details.race : '', details.className !== 'Unspecified' ? details.className : '', descriptor].filter(Boolean).join(' · '))}${escapeHtml(challenge)}</div></div>
        <span class="npc-sheet-badge">NPC</span>
      </div>
      <div class="stat-row">
        <span class="stat-pill">HP ${Number(token?.hp ?? npc.hp) || 0}/${Number(npc.maxHp) || 0}</span>
        ${Number(token?.tempHp ?? npc.tempHp) ? `<span class="stat-pill temp-hp-pill">+${Number(token?.tempHp ?? npc.tempHp)} temp</span>` : ''}
        <span class="stat-pill">AC ${Number(npc.ac) || 0}</span>
        <span class="stat-pill">Init ${signed(npc.initiativeModifier)}</span>
      </div>
      <div class="char-card-actions">
        <button type="button" class="btn-ghost npc-sheet-open-btn">${npc.sheet ? 'Open full sheet' : 'Expand to full sheet'}</button>
        <button type="button" class="btn-rose npc-sheet-combat-btn" ${token ? '' : 'disabled'}>⚔ Combat</button>
        <button type="button" class="btn-ghost npc-sheet-initiative-btn" ${token ? '' : 'disabled'}>🎲 Initiative</button>
        <button type="button" class="btn-ghost npc-sheet-map-btn">${token ? 'Remove from map' : 'Put on map'}</button>
        <button type="button" class="btn-danger-soft npc-sheet-delete-btn">Delete</button>
      </div>
    `;
    card.querySelector('.npc-sheet-open-btn').onclick = () => openSheetEditor(npc, { npc: true });
    card.querySelector('.npc-sheet-combat-btn').onclick = () => token && openNpcCombatManager(token.id);
    card.querySelector('.npc-sheet-initiative-btn').onclick = () => token && rollNpcInitiative(token, 'normal');
    card.querySelector('.npc-sheet-map-btn').onclick = () => {
      if (token) socket.emit('token:remove', { id: token.id });
      else socket.emit('npc:place', { id: npc.id });
    };
    card.querySelector('.npc-sheet-delete-btn').onclick = () => {
      if (confirm(`Permanently delete ${npc.name}? It will also be removed from every saved scene.`)) socket.emit('npc:delete', { id: npc.id });
    };
    npcGrid.appendChild(card);
  });
}

document.getElementById('new-sheet-btn').onclick = () => openSheetEditor(null, { npc: false });
document.getElementById('new-npc-sheet-btn').onclick = () => openSheetEditor(null, { npc: true });
document.getElementById('close-sheet-btn').onclick = () => {
  closeLevelUpDialog(false);
  editingNpcSheetId = null;
  document.getElementById('sheet-editor').classList.add('hidden');
};

function openSheetEditor(c, options: any = {}) {
  const isNpc = !!options.npc;
  const form = document.getElementById('sheet-form');
  form.reset();
  closeLevelUpDialog(false);
  document.getElementById('sheet-editor').classList.remove('hidden');
  document.getElementById('sheet-editor-title').textContent = c
    ? `Edit ${c.name}${isNpc ? ' · NPC' : ''}`
    : (isNpc ? 'New NPC stat block' : 'New character');
  editingNpcSheetId = isNpc ? (c?.id || '__new__') : null;
  editingOriginalName = !isNpc && c ? c.name : null;
  editingCanEdit = isNpc ? myRole === 'dm' : canEditCharacter(c);
  pendingPortraitFile = null;
  editingPortraitUrl = (isNpc ? c?.imageUrl : c?.portraitUrl) || null;
  const fields = {
    ...(isNpc ? (c?.sheet?.fields || legacyNpcFields(c)) : (c?.fields || legacyCharacterFields(c)))
  };
  if (!Object.prototype.hasOwnProperty.call(fields, 'pronouns')) {
    fields.pronouns = isNpc
      ? (c?.pronouns || c?.sheet?.pronouns || '')
      : (c?.pronouns || '');
  }
  editingBaseLevel = Math.max(1, Math.min(20, Number(fields.level ?? c?.level) || 1));
  acMethodManuallySelected = !!c || !!fields['ac-method'];
  initiativeManuallyEdited = !!c && fields.initiative !== '' && fields.initiative !== undefined;
  document.getElementById('npc-sheet-tools').classList.toggle('hidden', !isNpc);
  document.getElementById('level-up-btn').classList.toggle('hidden', isNpc);
  document.getElementById('save-sheet-btn').textContent = isNpc ? 'Save NPC' : 'Save character';
  form.dataset.npcChallenge = isNpc ? (c?.sheet?.challenge || '') : '';
  document.getElementById('npc-statblock-import').value = '';
  document.getElementById('npc-sheet-preset').value = '';
  ABILITIES.forEach(ability => { document.getElementById(`sf-${ability}`).max = isNpc ? '30' : '20'; });
  form.querySelectorAll('[id^="sf-"]').forEach(input => {
    if (input.type === 'file') return;
    const key = input.id.slice(3);
    if (!Object.prototype.hasOwnProperty.call(fields, key)) return;
    if (input.type === 'checkbox') input.checked = !!fields[key];
    else input.value = fields[key] ?? '';
  });
  setCharacterRuleSelections(fields);
  if (!c && !fields['ac-method']) applyRecommendedArmorMethod();
  editingInventory = normalizeInventory(isNpc ? c?.sheet?.inventory : c?.inventory);
  inventoryExpandedContainers = new Set(editingInventory.filter(item => item.isContainer).map(item => item.id));
  renderInventoryEditor();
  editingAttacks = normalizeAttackList(isNpc ? (c?.sheet?.attacks || c?.attacks) : c?.attacks);
  editingAttackId = null;
  document.getElementById('attack-add-form').classList.add('hidden');
  renderAttackEditor();
  editingReactions = normalizeReactionList(isNpc ? (c?.sheet?.reactions || c?.reactions) : c?.reactions);
  editingReactionId = null;
  document.getElementById('reaction-add-form').classList.add('hidden');
  renderReactionEditor();
  editingSpells = normalizeSpellList(fields['spell-list'] || (isNpc ? c?.spells : null));
  if (isNpc && !editingSpells.length) editingSpells = normalizeSpellList(c?.spells);
  if (!editingSpells.length) editingSpells = migrateLegacySpellText(fields);
  editingSpellId = null;
  document.getElementById('spell-add-form').classList.add('hidden');
  renderSpellListEditor();
  renderPortraitPreview(editingPortraitUrl);
  refreshCharacterCalculations(!c, !c && !isNpc);
  setSheetEditable(editingCanEdit, !!c);
  document.getElementById('view-characters').scrollIntoView({ behavior: 'smooth' });
}

function legacyCharacterFields(c) {
  if (!c) return {};
  const fields = {
    name: c.name || '', pronouns: c.pronouns || '', species: c.species || c.race || '', class: c.charClass || '', level: c.level ?? 1,
    hp: c.hp ?? 10, maxhp: c.maxHp ?? 10, ac: c.ac ?? 10, speed: c.speed || '30 ft', notes: c.notes || ''
  };
  ABILITIES.forEach(ability => { fields[ability] = c.abilities?.[ability] ?? 10; });
  return fields;
}

function legacyNpcFields(npc) {
  if (!npc) return {};
  const fields = {
    name: npc.name || '', pronouns: npc.pronouns || '', level: '1', hp: npc.hp ?? npc.maxHp ?? 10, maxhp: npc.maxHp ?? 10,
    temphp: npc.tempHp ?? 0, ac: npc.ac ?? 10, initiative: npc.initiativeModifier ?? 0,
    speed: '30 ft.', 'ac-method': 'manual', 'ac-base': npc.ac ?? 10,
    'attacks-notes': npc.notes || '', notes: npc.notes || ''
  };
  ABILITIES.forEach(ability => { fields[ability] = npc.sheet?.abilities?.[ability] ?? 10; });
  return fields;
}

function canEditCharacter(c) {
  return !c || !!c.canManage;
}

function setSheetEditable(canEdit, hasCharacter) {
  document.querySelectorAll('#sheet-form input, #sheet-form select, #sheet-form textarea, #sheet-form button').forEach(control => {
    control.disabled = !canEdit;
  });
  document.getElementById('save-sheet-btn').classList.toggle('hidden', !canEdit);
  document.getElementById('delete-sheet-btn').classList.toggle('hidden', !canEdit || !hasCharacter);
  const ownerNote = document.getElementById('sheet-owner-note');
  ownerNote.textContent = canEdit ? '' : 'Only this character’s owner or the Dungeon Master can edit it.';
  updateSubraceOptions(document.getElementById('sf-subrace').value);
  updateSubclassOptions(document.getElementById('sf-subclass').value);
}
