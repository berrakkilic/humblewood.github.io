/** Attack presets, attack editing, and NPC stat-block importing. */

// ---- Reusable attack editor ----
function normalizeAttack(attack, index = 0) {
  if (!attack || typeof attack !== 'object') return null;
  const name = String(attack.name || '').trim();
  if (!name) return null;
  return {
    id: String(attack.id || `attack-normalized-${index}`),
    name,
    bonus: String(attack.bonus || '').trim(),
    damage: String(attack.damage || '').trim(),
    details: String(attack.details || '').trim(),
    source: String(attack.source || '').trim()
  };
}

function normalizeAttackList(raw) {
  return (Array.isArray(raw) ? raw : []).map(normalizeAttack).filter(Boolean);
}

function initializeAttackPresetControls() {
  const select = document.getElementById('attack-preset-select');
  creationPresets.ATTACK_PRESETS.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.name;
    option.textContent = `${preset.name}${preset.properties ? ` · ${preset.properties}` : ''}`;
    select.appendChild(option);
  });
  document.getElementById('attack-add-btn').onclick = () => openAttackForm(null);
  document.getElementById('attack-form-cancel').onclick = closeAttackForm;
  document.getElementById('attack-preset-load').onclick = () => {
    const preset = creationPresets.ATTACK_PRESETS.find(entry => entry.name === select.value);
    if (!preset) return showToast('Choose an attack preset first.');
    const scores = Object.fromEntries(ABILITIES.map(ability => [ability, document.getElementById(`sf-${ability}`).value]));
    populateAttackForm(creationPresets.attackPresetValues(preset, scores, document.getElementById('sf-prof-bonus').value));
  };
  document.getElementById('attack-form-save').onclick = () => {
    const name = document.getElementById('attack-form-name').value.trim();
    if (!name) return showToast('Give the attack a name first.');
    const value = normalizeAttack({
      id: editingAttackId || `attack-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      bonus: document.getElementById('attack-form-bonus').value,
      damage: document.getElementById('attack-form-damage').value,
      details: document.getElementById('attack-form-details').value,
      source: document.getElementById('attack-add-form').dataset.attackSource || ''
    });
    if (editingAttackId) {
      const index = editingAttacks.findIndex(entry => entry.id === editingAttackId);
      if (index !== -1) editingAttacks[index] = value;
    } else {
      editingAttacks.push(value);
    }
    closeAttackForm();
    renderAttackEditor();
  };
}

function populateAttackForm(value: any = {}) {
  document.getElementById('attack-add-form').dataset.attackSource = value.source || '';
  document.getElementById('attack-form-name').value = value.name || '';
  document.getElementById('attack-form-bonus').value = value.bonus || '';
  document.getElementById('attack-form-damage').value = value.damage || '';
  document.getElementById('attack-form-details').value = value.details || '';
}

function openAttackForm(value) {
  editingAttackId = value?.id || null;
  document.getElementById('attack-add-form').classList.remove('hidden');
  document.getElementById('attack-preset-select').value = '';
  populateAttackForm(value || {});
  document.getElementById('attack-form-name').focus();
}

function closeAttackForm() {
  editingAttackId = null;
  document.getElementById('attack-add-form').classList.add('hidden');
}

function renderAttackEditor() {
  const list = document.getElementById('attack-list');
  list.innerHTML = '';
  if (!editingAttacks.length) {
    list.innerHTML = '<p class="sidebar-help">No attacks configured yet.</p>';
    return;
  }
  editingAttacks.forEach(value => {
    const row = document.createElement('div');
    row.className = 'attack-list-item';
    row.innerHTML = `
      <span class="attack-list-name">${escapeHtml(value.name)}</span>
      <span class="attack-list-value">${escapeHtml(value.bonus || 'No roll')}</span>
      <span class="attack-list-value">${escapeHtml(value.damage || 'No damage')}</span>
      ${value.details ? `<span class="attack-list-details">${escapeHtml(value.details)}</span>` : ''}
      <span class="attack-list-actions">
        <button type="button" class="edit" title="Edit attack">✎</button>
        <button type="button" class="del" title="Remove attack">×</button>
      </span>
    `;
    const edit = row.querySelector('.edit');
    const remove = row.querySelector('.del');
    edit.disabled = !editingCanEdit;
    remove.disabled = !editingCanEdit;
    edit.onclick = () => openAttackForm(value);
    remove.onclick = () => {
      editingAttacks = editingAttacks.filter(entry => entry.id !== value.id);
      renderAttackEditor();
    };
    list.appendChild(row);
  });
}

// ---- NPC preset and pasted stat-block importer ----
function initializeNpcPresetControls() {
  const select = document.getElementById('npc-sheet-preset');
  const groups = new Map();
  creationPresets.NPC_PRESETS.forEach(preset => {
    if (!groups.has(preset.source)) {
      const group = document.createElement('optgroup');
      group.label = preset.source;
      groups.set(preset.source, group);
      select.appendChild(group);
    }
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    groups.get(preset.source).appendChild(option);
  });
  document.getElementById('npc-sheet-preset-load').onclick = () => {
    const preset = creationPresets.NPC_PRESETS.find(entry => entry.id === select.value);
    if (!preset) return showToast('Choose an NPC preset first.');
    applyImportedStatBlock(creationPresets.parseStatBlock(preset.statBlock, {
      name: preset.name,
      spellPresets: allSpellPresets()
    }));
  };
  document.getElementById('npc-statblock-import-btn').onclick = () => {
    const text = document.getElementById('npc-statblock-import').value;
    applyImportedStatBlock(creationPresets.parseStatBlock(text, { spellPresets: allSpellPresets() }));
  };
  document.getElementById('npc-statblock-clear-btn').onclick = () => {
    document.getElementById('npc-statblock-import').value = '';
  };
}

function applyImportedStatBlock(parsed) {
  if (parsed.error) return showToast(parsed.error);
  const form = document.getElementById('sheet-form');
  form.reset();
  const fields = parsed.fields || {};
  form.querySelectorAll('[id^="sf-"]').forEach(input => {
    if (input.type === 'file') return;
    const key = input.id.slice(3);
    if (!Object.prototype.hasOwnProperty.call(fields, key)) return;
    if (input.type === 'checkbox') input.checked = !!fields[key];
    else input.value = fields[key] ?? '';
  });
  setCharacterRuleSelections(fields);
  acMethodManuallySelected = true;
  initiativeManuallyEdited = true;
  editingInventory = [];
  inventoryEditingId = '';
  renderInventoryEditor();
  editingAttacks = normalizeAttackList(parsed.attacks);
  closeAttackForm();
  renderAttackEditor();
  editingReactions = [];
  closeReactionForm();
  renderReactionEditor();
  editingSpells = normalizeSpellList(parsed.spells);
  editingSpellId = null;
  document.getElementById('spell-add-form').classList.add('hidden');
  renderSpellListEditor();
  form.dataset.npcChallenge = parsed.challenge || '';
  refreshCharacterCalculations(false, false);
  document.getElementById('sf-ac').value = fields.ac || '10';
  document.getElementById('sf-ac-method').value = 'manual';
  refreshArmorClass();
  document.getElementById('sf-name').focus();
  showToast(`${parsed.name} imported. Review it, add a portrait if wanted, then save.`);
}
