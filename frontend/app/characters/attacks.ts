/** Attack presets, attack editing, and NPC stat-block importing. */

// ---- Reusable attack editor ----
interface AttackPreset {
  name: string;
  properties?: string;
}

interface NpcPreset {
  id: string;
  name: string;
  source: string;
  statBlock: string;
}

interface ParsedStatBlock {
  error?: string;
  name: string;
  fields?: Record<string, string | boolean>;
  attacks?: unknown[];
  spells?: unknown[];
  challenge?: string;
}

interface AttackPresetApi {
  ATTACK_PRESETS: AttackPreset[];
  NPC_PRESETS: NpcPreset[];
  attackPresetValues: (preset: AttackPreset, scores: Record<string, string>, proficiency: string) => Partial<CharacterAttack>;
  parseStatBlock: (text: string, options?: { name?: string; spellPresets?: unknown[] }) => ParsedStatBlock;
}

const attackPresetApi = creationPresets as AttackPresetApi;

function normalizeAttack(attack: unknown, index = 0): CharacterAttack | null {
  if (!attack || typeof attack !== 'object') return null;
  const fields = attack as Record<string, unknown>;
  const name = String(fields.name || '').trim();
  if (!name) return null;
  return {
    id: String(fields.id || `attack-normalized-${index}`),
    name,
    bonus: String(fields.bonus || '').trim(),
    damage: String(fields.damage || '').trim(),
    details: String(fields.details || '').trim(),
    source: String(fields.source || '').trim()
  };
}

function normalizeAttackList(raw: unknown): CharacterAttack[] {
  return (Array.isArray(raw) ? raw : []).map(normalizeAttack)
    .filter((attack): attack is CharacterAttack => attack !== null);
}

function initializeAttackPresetControls() {
  const select = getElementById('attack-preset-select');
  attackPresetApi.ATTACK_PRESETS.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.name;
    option.textContent = `${preset.name}${preset.properties ? ` · ${preset.properties}` : ''}`;
    select.appendChild(option);
  });
  applyPresetSearch('attack-preset-select', 'attack-preset-search');
  getElementById('attack-add-btn').onclick = () => openAttackForm(null);
  getElementById('attack-form-cancel').onclick = closeAttackForm;
  getElementById('attack-preset-load').onclick = () => {
    const preset = attackPresetApi.ATTACK_PRESETS.find(entry => entry.name === select.value);
    if (!preset) return showToast('Choose an attack preset first.');
    const scores = Object.fromEntries(ABILITIES.map(ability => [ability, getElementById(`sf-${ability}`).value]));
    populateAttackForm(attackPresetApi.attackPresetValues(preset, scores, getElementById('sf-prof-bonus').value));
  };
  getElementById('attack-form-save').onclick = () => {
    const name = getElementById('attack-form-name').value.trim();
    if (!name) return showToast('Give the attack a name first.');
    const value = normalizeAttack({
      id: editingAttackId || `attack-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      bonus: getElementById('attack-form-bonus').value,
      damage: getElementById('attack-form-damage').value,
      details: getElementById('attack-form-details').value,
      source: getElementById('attack-add-form').dataset.attackSource || ''
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

function populateAttackForm(value: Partial<CharacterAttack> = {}) {
  getElementById('attack-add-form').dataset.attackSource = value.source || '';
  getElementById('attack-form-name').value = value.name || '';
  getElementById('attack-form-bonus').value = value.bonus || '';
  getElementById('attack-form-damage').value = value.damage || '';
  getElementById('attack-form-details').value = value.details || '';
}

function openAttackForm(value: Partial<CharacterAttack> | null) {
  editingAttackId = value?.id || null;
  getElementById('attack-add-form').classList.remove('hidden');
  getElementById('attack-preset-select').value = '';
  populateAttackForm(value || {});
  getElementById('attack-form-name').focus();
}

function closeAttackForm() {
  editingAttackId = null;
  getElementById('attack-add-form').classList.add('hidden');
}

function renderAttackEditor() {
  const list = getElementById('attack-list');
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
    const edit = row.querySelector<HTMLButtonElement>('.edit');
    const remove = row.querySelector<HTMLButtonElement>('.del');
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
  const select = getElementById('npc-sheet-preset');
  const groups = new Map();
  attackPresetApi.NPC_PRESETS.forEach(preset => {
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
  applyPresetSearch('npc-sheet-preset', 'npc-preset-search');
  getElementById('npc-sheet-preset-load').onclick = () => {
    const preset = attackPresetApi.NPC_PRESETS.find(entry => entry.id === select.value);
    if (!preset) return showToast('Choose an NPC preset first.');
    applyImportedStatBlock(creationPresets.parseStatBlock(preset.statBlock, {
      name: preset.name,
      spellPresets: allSpellPresets()
    }));
  };
  getElementById('npc-statblock-import-btn').onclick = () => {
    const text = getElementById('npc-statblock-import').value;
    applyImportedStatBlock(creationPresets.parseStatBlock(text, { spellPresets: allSpellPresets() }));
  };
  getElementById('npc-statblock-clear-btn').onclick = () => {
    getElementById('npc-statblock-import').value = '';
  };
}

function applyImportedStatBlock(parsed: ParsedStatBlock) {
  if (parsed.error) return showToast(parsed.error);
  const form = getElementById('sheet-form');
  form.reset();
  const fields = parsed.fields || {};
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[id^="sf-"]').forEach(input => {
    if (input instanceof HTMLInputElement && input.type === 'file') return;
    const key = input.id.slice(3);
    if (!Object.prototype.hasOwnProperty.call(fields, key)) return;
    if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = !!fields[key];
    else input.value = String(fields[key] ?? '');
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
  getElementById('spell-add-form').classList.add('hidden');
  renderSpellListEditor();
  form.dataset.npcChallenge = parsed.challenge || '';
  refreshCharacterCalculations(false, false);
  getElementById('sf-ac').value = String(fields.ac || '10');
  getElementById('sf-ac-method').value = 'manual';
  refreshArmorClass();
  getElementById('sf-name').focus();
  showToast(`${parsed.name} imported. Review it, add a portrait if wanted, then save.`);
}
