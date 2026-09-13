/** Token and NPC creation, rosters, directory filters, and sidebars. */

// ---- Token and NPC creation ----
document.getElementById('token-kind').onchange = updateTokenCreateForm;
document.getElementById('cancel-npc-edit-btn').onclick = resetNpcEditor;

function updateTokenCreateForm() {
  const kind = document.getElementById('token-kind').value;
  document.getElementById('npc-create-fields').classList.toggle('hidden', kind !== 'npc');
  document.getElementById('token-pronouns').classList.toggle('hidden', kind === 'item');
  if (!editingNpcId) document.getElementById('add-token-btn').textContent = kind === 'npc' ? 'Create NPC & place' : 'Add to map';
}

function parseNpcAttacks(text) {
  return String(text || '').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [name = '', bonus = '', damage = ''] = line.split('|').map(part => part.trim());
    return { name, bonus, damage };
  }).filter(attack => attack.name);
}

function npcAttacksText(attacks) {
  return (attacks || []).map(attack => [attack.name, attack.bonus, attack.damage].join(' | ')).join('\n');
}

document.getElementById('add-token-btn').onclick = async () => {
  const name = document.getElementById('token-name').value.trim();
  if (!name) return showToast('Give the token a name first.');
  const kind = document.getElementById('token-kind').value;
  const file = document.getElementById('token-image').files[0];
  let imageUrl;
  if (file) imageUrl = await uploadFile(file);

  if (editingNpcId) {
    socket.emit('npc:update', {
      id: editingNpcId,
      name,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      hp: Number(document.getElementById('npc-hp').value) || 1,
      maxHp: Number(document.getElementById('npc-hp').value) || 1,
      ac: Number(document.getElementById('npc-ac').value) || 0,
      initiativeModifier: Number(document.getElementById('npc-initiative').value) || 0,
      pronouns: document.getElementById('token-pronouns').value.trim(),
      attacks: parseNpcAttacks(document.getElementById('npc-attacks').value),
      notes: document.getElementById('npc-notes').value.trim()
    });
    return;
  }

  socket.emit('token:add', {
    label: name,
    kind,
    imageUrl: imageUrl || null,
    hp: kind === 'npc' ? Number(document.getElementById('npc-hp').value) || 1 : undefined,
    maxHp: kind === 'npc' ? Number(document.getElementById('npc-hp').value) || 1 : undefined,
    ac: Number(document.getElementById('npc-ac').value) || 0,
    initiativeModifier: Number(document.getElementById('npc-initiative').value) || 0,
    pronouns: kind === 'item' ? '' : document.getElementById('token-pronouns').value.trim(),
    attacks: parseNpcAttacks(document.getElementById('npc-attacks').value),
    notes: document.getElementById('npc-notes').value.trim()
  });
  resetNpcEditor();
};

function editNpc(npcId) {
  const npc = state.npcs?.[npcId];
  if (!npc) return;
  editingNpcId = npcId;
  document.getElementById('token-kind').value = 'npc';
  document.getElementById('token-kind').disabled = true;
  document.getElementById('token-name').value = npc.name;
  document.getElementById('npc-hp').value = Number(npc.maxHp) || 1;
  document.getElementById('npc-ac').value = Number(npc.ac) || 0;
  document.getElementById('npc-initiative').value = Number(npc.initiativeModifier) || 0;
  document.getElementById('token-pronouns').value = npc.pronouns || npc.sheet?.pronouns || npc.sheet?.fields?.pronouns || '';
  document.getElementById('npc-attacks').value = npcAttacksText(npc.attacks);
  document.getElementById('npc-notes').value = npc.notes || '';
  document.getElementById('add-token-btn').textContent = 'Save NPC changes';
  document.getElementById('cancel-npc-edit-btn').classList.remove('hidden');
  updateTokenCreateForm();
  document.getElementById('token-name').focus();
}

function resetNpcEditor() {
  editingNpcId = null;
  document.getElementById('token-kind').disabled = false;
  document.getElementById('token-name').value = '';
  document.getElementById('token-image').value = '';
  document.getElementById('npc-hp').value = 10;
  document.getElementById('npc-ac').value = 10;
  document.getElementById('npc-initiative').value = 0;
  document.getElementById('token-pronouns').value = '';
  document.getElementById('npc-attacks').value = '';
  document.getElementById('npc-notes').value = '';
  document.getElementById('cancel-npc-edit-btn').classList.add('hidden');
  updateTokenCreateForm();
}

function renderTokenTray() {
  const list = document.getElementById('token-list');
  list.innerHTML = '';
  state.tokens.forEach(t => {
    if (myRole === 'player' && t.visibleToPlayers === false) return;
    const entry = document.createElement('article');
    entry.className = 'token-list-entry';
    const chip = document.createElement('div');
    chip.className = 'token-chip kind-' + t.kind;
    if (!t.canControl) chip.classList.add('locked-token');
    const displayLabel = visibleTokenLabel(t) || `${t.kind} token`;
    const hoverLabel = tokenHoverText(t);
    const controlHint = t.canControl
      ? 'click to nudge on the map'
      : (t.kind === 'pc' ? 'controlled by another player' : '');
    chip.title = [hoverLabel, controlHint].filter(Boolean).join(' · ');
    chip.setAttribute('aria-label', hoverLabel);
    if (t.visibleToPlayers === false) chip.classList.add('hidden-token');
    chip.innerHTML = (t.imageUrl ? `<img src="${escapeAttr(t.imageUrl)}" alt="${escapeAttr(displayLabel)}">` : emojiFor(t.kind)) +
      (t.canControl ? '<span class="del" title="Remove from map">×</span>' : '');
    const remove = chip.querySelector('.del');
    if (remove) remove.onclick = (e) => {
        e.stopPropagation();
        socket.emit('token:remove', { id: t.id });
      };
    chip.onclick = () => {
      if (!t.canControl) return showToast('You can only move your own character token.');
      socket.emit('token:move', { id: t.id, x: t.x + 10, y: t.y + 10 });
    };
    const details = document.createElement('div');
    details.className = 'token-list-details dm-only';
    const scalePercent = Math.round((Number(t.sizeScale) || 1) * 100);
    details.innerHTML = `
      <div class="token-list-heading"><strong>${escapeHtml(t.label)}</strong><span>${escapeHtml([t.kind, tokenPronouns(t)].filter(Boolean).join(' · '))}</span></div>
      <label class="token-size-control">Size <input type="range" min="35" max="300" step="5" value="${scalePercent}"><output>${scalePercent}%</output></label>
      <div class="token-list-actions">
        <button class="btn-ghost token-reset-size" type="button">Reset size</button>
        <button class="btn-ghost token-visibility" type="button">${t.visibleToPlayers === false ? 'Show' : 'Hide'}</button>
        <button class="btn-ghost token-duplicate" type="button">Duplicate</button>
        <button class="btn-danger-soft token-remove" type="button">Remove</button>
      </div>
    `;
    const sizeInput = details.querySelector('input[type="range"]');
    const sizeOutput = details.querySelector('output');
    sizeInput.oninput = () => { sizeOutput.textContent = `${sizeInput.value}%`; };
    sizeInput.onchange = () => socket.emit('token:update', { id: t.id, sizeScale: Number(sizeInput.value) / 100 });
    details.querySelector('.token-reset-size').onclick = () => socket.emit('token:update', { id: t.id, sizeScale: 1 });
    details.querySelector('.token-visibility').onclick = () => socket.emit('token:update', { id: t.id, visibleToPlayers: t.visibleToPlayers === false });
    details.querySelector('.token-duplicate').onclick = () => socket.emit('token:duplicate', { id: t.id });
    details.querySelector('.token-remove').onclick = () => socket.emit('token:remove', { id: t.id });
    entry.append(chip, details);
    list.appendChild(entry);
  });
  renderDmSidebarSummary();
}

document.getElementById('toggle-dm-sidebar-btn').onclick = () => {
  const sidebar = document.getElementById('map-sidebar');
  const expanded = sidebar.classList.toggle('dm-detailed');
  const button = document.getElementById('toggle-dm-sidebar-btn');
  button.textContent = expanded ? 'Compact' : 'Details';
  button.setAttribute('aria-expanded', String(expanded));
};

// ---- Sidebar accordion state (remembered per-browser) ----
document.querySelectorAll('.sidebar-accordion').forEach(details => {
  const key = `humblewood:accordion:${details.id}`;
  const saved = localStorage.getItem(key);
  if (saved !== null) details.open = saved === '1';
  details.addEventListener('toggle', () => {
    localStorage.setItem(key, details.open ? '1' : '0');
  });
});

function renderDmSidebarSummary() {
  const summary = document.getElementById('dm-sidebar-summary');
  if (!summary || !state) return;
  const tokens = state.tokens || [];
  const counts = { pc: 0, npc: 0, item: 0 };
  tokens.forEach(token => { if (counts[token.kind] !== undefined) counts[token.kind] += 1; });
  if (!tokens.length) {
    summary.textContent = 'No tokens on the map.';
    return;
  }
  const parts = [
    counts.pc ? `${counts.pc} player${counts.pc === 1 ? '' : 's'}` : '',
    counts.npc ? `${counts.npc} NPC${counts.npc === 1 ? '' : 's'}` : '',
    counts.item ? `${counts.item} item${counts.item === 1 ? '' : 's'}` : ''
  ].filter(Boolean);
  summary.textContent = parts.join(' · ');
}

function npcDirectoryDetails(npc) {
  const fields = npc?.sheet?.fields || {};
  const sheet = npc?.sheet || {};
  const race = String(
    npc?.race || npc?.species || sheet.race || sheet.species || fields.race || fields.species || ''
  ).trim();
  const subrace = String(npc?.subrace || sheet.subrace || fields.subrace || '').trim();
  const className = String(
    npc?.charClass || npc?.className || sheet.charClass || fields.class || fields.charClass || npc?.spellcasting?.className || ''
  ).trim();
  const background = String(fields.background || sheet.background || '').trim();
  const raceLabel = race || 'Unspecified';
  const classLabel = className || 'Unspecified';
  const searchText = [npc?.name, npc?.pronouns, race, subrace, className, background, sheet.challenge, npc?.notes]
    .filter(Boolean).join(' ').toLowerCase();
  return {
    race: raceLabel,
    raceKey: raceLabel.toLowerCase(),
    subrace,
    className: classLabel,
    classKey: classLabel.toLowerCase(),
    background,
    searchText
  };
}

function npcDirectoryMatches(npc) {
  const details = npcDirectoryDetails(npc);
  const query = npcSearchQuery.trim().toLowerCase();
  if (query && !details.searchText.includes(query)) return false;
  if (npcRaceFilter !== 'all' && details.raceKey !== npcRaceFilter) return false;
  if (npcClassFilter !== 'all' && details.classKey !== npcClassFilter) return false;
  return true;
}

function filteredNpcDirectory(npcs = Object.values(state?.npcs || {})) {
  return npcs.filter(npcDirectoryMatches);
}

function npcFilterValues(npcs, property, keyProperty) {
  const values = new Map();
  npcs.forEach(npc => {
    const details = npcDirectoryDetails(npc);
    const key = details[keyProperty];
    if (!values.has(key)) values.set(key, details[property]);
  });
  return [...values.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function refreshNpcViewsAfterFilter(event) {
  const focusedId = event?.target?.id || '';
  const selectionStart = typeof event?.target?.selectionStart === 'number' ? event.target.selectionStart : null;
  renderNpcRoster();
  renderCharacters();
  if (!focusedId) return;
  const focused = document.getElementById(focusedId);
  if (!focused) return;
  focused.focus();
  if (selectionStart !== null && typeof focused.setSelectionRange === 'function') {
    const position = Math.min(selectionStart, focused.value.length);
    focused.setSelectionRange(position, position);
  }
}

function renderNpcFilterControls() {
  if (!state) return;
  const allNpcs = Object.values(state.npcs || {});
  const races = npcFilterValues(allNpcs, 'race', 'raceKey');
  const classes = npcFilterValues(allNpcs, 'className', 'classKey');
  if (npcRaceFilter !== 'all' && !races.some(value => value.key === npcRaceFilter)) npcRaceFilter = 'all';
  if (npcClassFilter !== 'all' && !classes.some(value => value.key === npcClassFilter)) npcClassFilter = 'all';

  [
    { prefix: 'npc-roster', summaryId: null },
    { prefix: 'npc-directory', summaryId: 'npc-directory-filter-summary' }
  ].forEach(({ prefix, summaryId }) => {
    const tools = document.getElementById(`${prefix}-filter-tools`);
    if (!tools) return;
    const search = document.getElementById(`${prefix}-search`);
    const raceFilters = document.getElementById(`${prefix}-race-filters`);
    const classFilter = document.getElementById(`${prefix}-class-filter`);
    const clear = document.getElementById(`${prefix}-clear-filters`);
    if (!search || !raceFilters || !classFilter || !clear) return;

    search.value = npcSearchQuery;
    search.oninput = event => {
      npcSearchQuery = event.target.value;
      refreshNpcViewsAfterFilter(event);
    };

    raceFilters.innerHTML = '';
    const raceOptions = [{ key: 'all', label: 'All races' }, ...races];
    raceOptions.forEach(optionValue => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'npc-filter-chip' + (npcRaceFilter === optionValue.key ? ' active' : '');
      button.dataset.value = optionValue.key;
      button.textContent = optionValue.label;
      button.setAttribute('aria-pressed', String(npcRaceFilter === optionValue.key));
      button.onclick = event => {
        npcRaceFilter = optionValue.key;
        refreshNpcViewsAfterFilter(event);
      };
      raceFilters.appendChild(button);
    });

    classFilter.innerHTML = '';
    const allClassesOption = document.createElement('option');
    allClassesOption.value = 'all';
    allClassesOption.textContent = 'All classes';
    classFilter.appendChild(allClassesOption);
    classes.forEach(optionValue => {
      const option = document.createElement('option');
      option.value = optionValue.key;
      option.textContent = optionValue.label;
      classFilter.appendChild(option);
    });
    classFilter.value = npcClassFilter;
    classFilter.onchange = event => {
      npcClassFilter = event.target.value;
      refreshNpcViewsAfterFilter(event);
    };

    const hasFilters = !!npcSearchQuery.trim() || npcRaceFilter !== 'all' || npcClassFilter !== 'all';
    clear.disabled = !hasFilters;
    clear.onclick = event => {
      npcSearchQuery = '';
      npcRaceFilter = 'all';
      npcClassFilter = 'all';
      refreshNpcViewsAfterFilter(event);
    };
    if (summaryId) {
      const summary = document.getElementById(summaryId);
      const visibleCount = filteredNpcDirectory(allNpcs).length;
      if (summary) summary.textContent = hasFilters ? `Showing ${visibleCount} of ${allNpcs.length} NPCs` : `${allNpcs.length} NPC${allNpcs.length === 1 ? '' : 's'}`;
    }
  });
}

function renderNpcRoster() {
  const roster = document.getElementById('npc-roster');
  if (!roster || !state) return;
  renderNpcFilterControls();
  roster.innerHTML = '';
  const allNpcs = Object.values(state.npcs || {});
  const npcs = filteredNpcDirectory(allNpcs).sort((a, b) => a.name.localeCompare(b.name));
  if (!npcs.length) {
    roster.innerHTML = `<p class="player-sidebar-empty">${allNpcs.length ? 'No NPCs match these filters.' : 'No NPCs created yet.'}</p>`;
    return;
  }
  npcs.forEach(npc => {
    const token = state.tokens.find(entry => entry.npcId === npc.id);
    const details = npcDirectoryDetails(npc);
    const card = document.createElement('article');
    card.className = 'npc-roster-card';
    card.innerHTML = `
      <div class="npc-roster-top">
        <span class="npc-roster-name">${escapeHtml(npc.name)}${npc.pronouns ? ` · ${escapeHtml(npc.pronouns)}` : ''}</span>
        <span class="npc-map-status ${token ? 'on-map' : ''}">${token ? 'On map' : 'Off map'}</span>
      </div>
      <div class="npc-roster-meta">${escapeHtml([details.race, details.className].filter(value => value !== 'Unspecified').join(' · ') || 'No race or class listed')}</div>
      <div class="npc-roster-stats">HP ${Number(token?.hp ?? npc.hp) || 0}/${Number(npc.maxHp) || 0} · AC ${Number(npc.ac) || 0} · Init ${signed(npc.initiativeModifier)}</div>
      <div class="npc-roster-actions">
        <button class="btn-ghost npc-map-btn" type="button">${token ? 'Remove' : 'Place'}</button>
        <button class="btn-ghost npc-combat-btn" type="button" ${token ? '' : 'disabled'}>⚔ Combat</button>
        <button class="btn-ghost npc-edit-btn" type="button">Edit</button>
        <button class="btn-danger-soft npc-delete-btn" type="button">Delete</button>
      </div>
    `;
    card.querySelector('.npc-map-btn').onclick = () => {
      if (token) socket.emit('token:remove', { id: token.id });
      else socket.emit('npc:place', { id: npc.id });
    };
    card.querySelector('.npc-combat-btn').onclick = () => token && openNpcCombatManager(token.id);
    card.querySelector('.npc-edit-btn').onclick = () => editNpc(npc.id);
    card.querySelector('.npc-delete-btn').onclick = () => {
      if (confirm(`Permanently delete ${npc.name}? It will also be removed from every saved scene.`)) socket.emit('npc:delete', { id: npc.id });
    };
    roster.appendChild(card);
  });
}

function renderOnlineUsers() {
  const list = document.getElementById('dm-online-list');
  const count = document.getElementById('dm-online-count');
  if (!list || myRole !== 'dm') return;
  const users = Array.isArray(onlineUsers) ? onlineUsers : [];
  if (count) count.textContent = String(users.length);
  list.innerHTML = '';
  if (!users.length) {
    list.innerHTML = '<p class="player-sidebar-empty">No one is currently connected.</p>';
    return;
  }
  users.forEach(user => {
    const row = document.createElement('div');
    row.className = 'online-user-row';
    const roleLabel = user.role === 'dm' ? 'Dungeon Master' : 'Player';
    const connectionNote = Number(user.connections) > 1 ? ` · ${user.connections} tabs` : '';
    row.innerHTML = `
      <span class="online-user-dot" aria-hidden="true"></span>
      <span class="online-user-copy"><strong>${escapeHtml(user.name)}</strong><small>${roleLabel}${connectionNote}</small></span>
    `;
    list.appendChild(row);
  });
}

function renderPlayerSidebar() {
  const container = document.getElementById('player-character-summary');
  if (!container || !state) return;
  container.innerHTML = '';
  const characters = Object.values(state.characters || {}).filter(character => character.canManage);
  if (!characters.length) {
    container.innerHTML = '<p class="player-sidebar-empty">No character is linked to your account yet. Ask the DM to set your player name or claim your character from the Characters tab.</p>';
    return;
  }
  characters.forEach(character => {
    const species = character.species || character.race || '';
    const charClass = character.charClass || character.className || '';
    const skilled = Object.keys(SKILL_ABILITIES)
      .filter(skill => character.skills?.[skill]?.proficient || character.fields?.[`skill-${skill}-prof`])
      .slice(0, 5)
      .map(skill => `${SKILL_LABELS[skill]} ${signed(characterSkillModifier(character, skill))}`);
    const card = document.createElement('article');
    card.className = 'player-sidebar-card';
    card.innerHTML = `
      <div class="player-sidebar-head">
        <div class="player-sidebar-portrait">${character.portraitUrl ? `<img src="${escapeAttr(character.portraitUrl)}" alt="">` : '🍃'}</div>
        <div><strong>${escapeHtml(character.name)}</strong><div class="player-sidebar-meta">${escapeHtml([character.pronouns, species, charClass, `Level ${Number(character.level) || 1}`].filter(Boolean).join(' · '))}</div></div>
      </div>
      <div class="player-sidebar-vitals">
        <span>HP ${Number(character.hp) || 0}/${Number(character.maxHp) || 0}</span>
        <span>AC ${Number(character.ac) || 0}</span>
      </div>
      <div class="player-sidebar-skills"><strong>Best skills:</strong> ${skilled.length ? escapeHtml(skilled.join(' · ')) : 'No proficiencies marked yet'}</div>
      <div class="player-sidebar-actions">
        <button class="btn-ghost open-sheet" type="button">Sheet</button>
        <button class="btn-ghost open-rolls" type="button">🎲 Roll</button>
        <button class="btn-ghost open-combat" type="button">⚔ Fight</button>
      </div>
    `;
    card.querySelector('.open-sheet').onclick = () => { switchView('characters'); openSheetEditor(character); };
    card.querySelector('.open-rolls').onclick = () => openCharacterRoller(character.name);
    card.querySelector('.open-combat').onclick = () => openCombatManager(character.name);
    container.appendChild(card);
  });
}

