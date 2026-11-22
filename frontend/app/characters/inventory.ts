/** Nested inventory normalization, drag-and-drop ordering, containers, and item editing. */

function isUsageReset(value: string): value is UsageReset {
  return value === 'long-rest' || value === 'short-rest' || value === 'manual';
}

function normalizeInventory(inventory: unknown): InventoryItem[] {
  const source: unknown[] = Array.isArray(inventory)
    ? inventory
    : typeof inventory === 'string' && inventory.trim()
      ? inventory.split(/\n|,/).map(name => ({ name, qty: 1 }))
      : [];
  const seen = new Set();
  const items = source.map((item, index) => {
    if (!item || typeof item !== 'object') return null;
    const fields = item as Record<string, unknown>;
    let id = String(fields.id || `item-${Date.now()}-${index}`);
    if (!id || seen.has(id)) id = `item-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
    seen.add(id);
    const quantity = fields.qty === 0 ? 0 : Number(fields.qty);
    const name = String(fields.name || '').trim();
    const rawUsage = fields.usage && typeof fields.usage === 'object' ? fields.usage as Record<string, unknown> : {};
    const rawMax = rawUsage.max ?? fields.usageMax ?? fields.maxUses ?? fields.maxCharges ?? 0;
    const max = Math.max(0, Math.min(999, Math.floor(Number(rawMax) || 0)));
    const rawRemaining = rawUsage.remaining ?? fields.usageRemaining ?? fields.chargesRemaining;
    const rawUsed = rawUsage.used ?? fields.usageUsed;
    const remainingValue = rawRemaining !== undefined
      ? Number(rawRemaining)
      : rawUsed !== undefined ? max - (Number(rawUsed) || 0) : max;
    const resetValue = String(rawUsage.reset ?? fields.usageReset ?? '').trim().toLowerCase();
    const reset: UsageReset = ['long-rest', 'short-rest', 'manual'].includes(resetValue)
      ? resetValue as UsageReset
      : max > 0 ? 'long-rest' : 'manual';
    return {
      id,
      name,
      description: String(fields.description || '').trim().slice(0, 4000),
      qty: Math.max(0, Math.min(9999, Number.isFinite(quantity) ? quantity : 1)),
      location: fields.location === 'carried' ? 'carried' : 'backpack',
      isContainer: !!(fields.isContainer ?? fields.container) || /(?:backpack|bag|pouch|chest|satchel|quiver|case|pack)$/i.test(name),
      containerId: String(fields.containerId || '').trim() || null,
      usage: {
        max,
        remaining: Math.max(0, Math.min(max, Math.floor(Number.isFinite(remainingValue) ? remainingValue : max))),
        reset
      }
    };
  }).filter((item): item is InventoryItem => item !== null && !!item.name);
  const byId = new Map(items.map(item => [item.id, item]));
  items.forEach(item => {
    if (!item.containerId || item.containerId === item.id) {
      item.containerId = null;
      return;
    }
    const visited = new Set([item.id]);
    let parent = byId.get(item.containerId);
    while (parent) {
      if (visited.has(parent.id) || !parent.isContainer) {
        item.containerId = null;
        break;
      }
      visited.add(parent.id);
      parent = parent.containerId ? byId.get(parent.containerId) : null;
    }
    if (item.containerId && !byId.has(item.containerId)) item.containerId = null;
  });
  return items;
}

function normalizeFeatureUses(features: unknown): FeatureUse[] {
  const source = Array.isArray(features) ? features : [];
  const seen = new Set();
  return source.slice(0, 80).map((feature, index) => {
    if (!feature || typeof feature !== 'object') return null;
    const fields = feature as Record<string, unknown>;
    let id = String(fields.id || `feature-${index}`).trim().slice(0, 140);
    if (!id || seen.has(id)) id = `feature-${index}-${Math.random().toString(36).slice(2, 7)}`;
    seen.add(id);
    const max = Math.max(0, Math.min(999, Math.floor(Number(fields.max) || 0)));
    const resetValue = String(fields.reset || '').trim();
    const reset: UsageReset = ['long-rest', 'short-rest', 'manual'].includes(resetValue)
      ? resetValue as UsageReset
      : 'long-rest';
    return {
      id,
      name: String(fields.name || '').trim().slice(0, 100),
      max,
      remaining: Math.max(0, Math.min(max, Math.floor(Number(fields.remaining) || 0))),
      reset
    };
  }).filter((feature): feature is FeatureUse => feature !== null && !!feature.name);
}

function featureResetLabel(reset: UsageReset): string {
  if (reset === 'long-rest') return 'Long rest';
  if (reset === 'short-rest') return 'Short rest';
  return 'Manual';
}

function renderFeatureUsageEditor() {
  const container = getElementById('feature-usage-editor');
  if (!container) return;
  container.innerHTML = '';
  editingFeatureUses.forEach(feature => {
    const row = document.createElement('div');
    row.className = 'feature-usage-row';
    const label = document.createElement('strong');
    label.textContent = feature.name;
    const count = document.createElement('span');
    count.textContent = `${feature.remaining}/${feature.max} · ${featureResetLabel(feature.reset)}`;
    const spend = document.createElement('button');
    spend.type = 'button';
    spend.className = 'counter-btn';
    spend.textContent = '−';
    spend.disabled = feature.remaining <= 0;
    spend.onclick = () => {
      feature.remaining = Math.max(0, feature.remaining - 1);
      renderFeatureUsageEditor();
    };
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'counter-btn';
    restore.textContent = '+';
    restore.disabled = feature.remaining >= feature.max;
    restore.onclick = () => {
      feature.remaining = Math.min(feature.max, feature.remaining + 1);
      renderFeatureUsageEditor();
    };
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-ghost';
    remove.textContent = 'Remove';
    remove.onclick = () => {
      editingFeatureUses = editingFeatureUses.filter(entry => entry.id !== feature.id);
      renderFeatureUsageEditor();
    };
    row.append(label, count, spend, restore, remove);
    container.appendChild(row);
  });
}

function inventoryChildren(itemId: string): InventoryItem[] {
  return editingInventory.filter(item => item.containerId === itemId);
}

function inventoryIsInSubtree(itemId: string, rootId: string): boolean {
  if (!itemId || !rootId || itemId === rootId) return itemId === rootId;
  const visited = new Set();
  let current = editingInventory.find(item => item.id === itemId);
  while (current?.containerId && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.containerId === rootId) return true;
    current = editingInventory.find(item => item.id === current.containerId);
  }
  return false;
}

function inventorySubtree(itemId: string): InventoryItem[] {
  return editingInventory.filter(item => item.id === itemId || inventoryIsInSubtree(item.id, itemId));
}

function clearInventoryDropIndicators() {
  document.querySelectorAll('.inventory-item.inventory-drop-before, .inventory-item.inventory-drop-after, .inventory-item.inventory-drop-inside, .inventory-group.inventory-drop-group').forEach(element => {
    element.classList.remove('inventory-drop-before', 'inventory-drop-after', 'inventory-drop-inside', 'inventory-drop-group');
    delete element.dataset.dropMode;
  });
}

function inventoryDragId(event: DragEvent): string {
  return event.dataTransfer?.getData('text/plain') || inventoryDraggingId;
}

function inventoryCanDropOn(sourceId: string, targetId: string): boolean {
  return !!sourceId && !!targetId && sourceId !== targetId && !inventoryIsInSubtree(targetId, sourceId);
}

function inventoryMoveSubtree(
  sourceId: string,
  mode: 'inside' | 'before' | 'after' | 'group',
  target: InventoryItem | null = null,
  location: InventoryLocation | null = null
): boolean {
  const source = editingInventory.find(item => item.id === sourceId);
  if (!source || !editingCanEdit) return false;
  if (target && !inventoryCanDropOn(sourceId, target.id)) return false;

  const targetLocation = target ? inventoryEffectiveLocation(target) : (location === 'carried' ? 'carried' : 'backpack');
  const moving = inventorySubtree(sourceId);
  const movingIds = new Set(moving.map(item => item.id));
  const remaining = editingInventory.filter(item => !movingIds.has(item.id));

  source.containerId = mode === 'inside' ? target.id : (target?.containerId || null);
  source.location = source.containerId ? targetLocation : (target ? target.location : targetLocation);

  let insertAt = remaining.length;
  if (target) {
    const targetIndex = remaining.findIndex(item => item.id === target.id);
    if (targetIndex < 0) return false;
    if (mode === 'inside') {
      let lastDescendant = targetIndex;
      for (let index = targetIndex + 1; index < remaining.length; index += 1) {
        if (inventoryIsInSubtree(remaining[index].id, target.id)) lastDescendant = index;
      }
      insertAt = lastDescendant + 1;
    } else {
      insertAt = targetIndex + (mode === 'after' ? 1 : 0);
    }
  } else {
    // A drop on a group appends after the last root (and its descendants) in that group.
    let lastRootEnd = -1;
    remaining.forEach((item, index) => {
      if (!item.containerId && item.location === targetLocation) {
        lastRootEnd = index;
        for (let descendantIndex = index + 1; descendantIndex < remaining.length; descendantIndex += 1) {
          if (inventoryIsInSubtree(remaining[descendantIndex].id, item.id)) lastRootEnd = descendantIndex;
        }
      }
    });
    insertAt = lastRootEnd >= 0 ? lastRootEnd + 1 : remaining.length;
  }

  remaining.splice(insertAt, 0, ...moving);
  editingInventory = remaining;
  if (mode === 'inside') inventoryExpandedContainers.add(target.id);
  clearInventoryDropIndicators();
  renderInventoryEditor();
  return true;
}

function inventoryDropMode(event: DragEvent, item: HTMLElement): 'inside' | 'before' | 'after' {
  const rect = item.getBoundingClientRect();
  const ratio = rect.height ? (event.clientY - rect.top) / rect.height : 0.5;
  if (item.dataset.isContainer === 'true' && ratio > 0.25 && ratio < 0.75) return 'inside';
  return ratio < 0.5 ? 'before' : 'after';
}

function inventoryEffectiveLocation(item: InventoryItem): InventoryLocation {
  let current = item;
  const visited = new Set();
  while (current?.containerId && !visited.has(current.id)) {
    visited.add(current.id);
    const parent = editingInventory.find(candidate => candidate.id === current.containerId);
    if (!parent) break;
    current = parent;
  }
  return current?.location === 'carried' ? 'carried' : 'backpack';
}

function renderInventoryContainerOptions() {
  const select = getElementById('inv-item-container');
  if (!select) return;
  const selected = select.value;
  select.innerHTML = '<option value="">No container</option>';
  editingInventory.filter(item => item.isContainer).forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `Inside ${item.name}`;
    select.appendChild(option);
  });
  select.value = editingInventory.some(item => item.id === selected && item.isContainer) ? selected : '';
}

function removeInventoryItem(item: InventoryItem): void {
  const parent = item.containerId ? editingInventory.find(candidate => candidate.id === item.containerId) : null;
  editingInventory = editingInventory
    .filter(entry => entry.id !== item.id)
    .map(entry => entry.containerId === item.id
      ? { ...entry, containerId: parent?.id || null, location: parent ? inventoryEffectiveLocation(parent) : item.location }
      : entry);
  inventoryExpandedContainers.delete(item.id);
  renderInventoryContainerOptions();
  renderInventoryEditor();
}

function moveInventoryItem(item: InventoryItem): void {
  const effectiveLocation = inventoryEffectiveLocation(item);
  if (item.containerId) {
    item.containerId = null;
    item.location = effectiveLocation === 'carried' ? 'backpack' : 'carried';
  } else {
    item.location = item.location === 'carried' ? 'backpack' : 'carried';
  }
  renderInventoryEditor();
}

function inventoryResetLabel(reset: UsageReset): string {
  if (reset === 'long-rest') return 'long rest';
  if (reset === 'short-rest') return 'short rest (manual)';
  return 'manual reset';
}

function inventoryUsage(item: InventoryItem): InventoryUsage {
  const usage = item.usage;
  const max = Math.max(0, Math.min(999, Math.floor(Number(usage.max) || 0)));
  const remaining = Math.max(0, Math.min(max, Math.floor(Number(usage.remaining) || 0)));
  return { max, remaining, reset: isUsageReset(usage.reset) ? usage.reset : 'manual' };
}

function renderInventoryEditForm(item: InventoryItem, children: InventoryItem[]): HTMLElement {
  const usage = inventoryUsage(item);
  const form = document.createElement('div');
  form.className = 'inventory-item-edit-form';

  const nameField = document.createElement('label');
  nameField.className = 'inventory-edit-name';
  nameField.textContent = 'Item name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = item.name;
  nameInput.maxLength = 200;
  nameField.appendChild(nameInput);

  const descriptionField = document.createElement('label');
  descriptionField.className = 'inventory-edit-description';
  descriptionField.textContent = 'Description';
  const descriptionInput = document.createElement('textarea');
  descriptionInput.rows = 2;
  descriptionInput.maxLength = 4000;
  descriptionInput.placeholder = 'What does this item look like or do?';
  descriptionInput.value = item.description || '';
  descriptionField.appendChild(descriptionInput);

  const maxField = document.createElement('label');
  maxField.textContent = 'Max uses / charges';
  const maxInput = document.createElement('input');
  maxInput.type = 'number';
  maxInput.min = '0';
  maxInput.max = '999';
  maxInput.step = '1';
  maxInput.value = String(usage.max);
  maxField.appendChild(maxInput);

  const remainingField = document.createElement('label');
  remainingField.textContent = 'Uses remaining';
  const remainingInput = document.createElement('input');
  remainingInput.type = 'number';
  remainingInput.min = '0';
  remainingInput.max = '999';
  remainingInput.step = '1';
  remainingInput.value = String(usage.remaining);
  remainingField.appendChild(remainingInput);

  const resetField = document.createElement('label');
  resetField.textContent = 'Reset';
  const resetInput = document.createElement('select');
  const resetOptions: [UsageReset, string][] = [
    ['long-rest', 'Long rest'],
    ['short-rest', 'Short rest (manual)'],
    ['manual', 'Manual']
  ];
  resetOptions.forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    resetInput.appendChild(option);
  });
  resetInput.value = usage.reset;
  resetField.appendChild(resetInput);

  const actions = document.createElement('div');
  actions.className = 'inventory-edit-actions';
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn-primary';
  save.textContent = 'Save item';
  save.onclick = () => {
    const name = nameInput.value.trim();
    if (!name) return showToast('Give the item a name first.');
    const max = Math.max(0, Math.min(999, Math.floor(Number(maxInput.value) || 0)));
    const remaining = Math.max(0, Math.min(max, Math.floor(Number(remainingInput.value) || 0)));
    item.name = name;
    item.isContainer = item.isContainer || /(?:backpack|bag|pouch|chest|satchel|quiver|case|pack)$/i.test(name);
    item.description = descriptionInput.value.trim().slice(0, 4000);
    item.usage = { max, remaining, reset: isUsageReset(resetInput.value) ? resetInput.value : 'manual' };
    inventoryEditingId = '';
    renderInventoryEditor();
  };
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn-ghost';
  cancel.textContent = 'Cancel';
  cancel.onclick = () => {
    inventoryEditingId = '';
    renderInventoryEditor();
  };
  actions.append(save, cancel);
  form.append(nameField, descriptionField, maxField, remainingField, resetField, actions);
  if (children.length) {
    const note = document.createElement('small');
    note.className = 'inventory-edit-note';
    note.textContent = 'This item contains other items; its container status cannot be changed here.';
    form.appendChild(note);
  }
  return form;
}

function renderInventoryItem(item: InventoryItem): DocumentFragment {
  const children = inventoryChildren(item.id);
  const row = document.createElement('div');
  row.className = 'inventory-item';
  row.dataset.itemId = item.id;
  row.dataset.isContainer = item.isContainer ? 'true' : 'false';
  row.draggable = !!editingCanEdit;
  if (editingCanEdit) {
    row.addEventListener('dragstart', event => {
      inventoryDraggingId = item.id;
      event.dataTransfer?.setData('text/plain', item.id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
      row.classList.add('inventory-dragging');
    });
    row.addEventListener('dragend', () => {
      inventoryDraggingId = '';
      row.classList.remove('inventory-dragging');
      clearInventoryDropIndicators();
    });
    row.addEventListener('dragover', event => {
      const sourceId = inventoryDragId(event);
      if (!inventoryCanDropOn(sourceId, item.id)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      clearInventoryDropIndicators();
      const mode = inventoryDropMode(event, row);
      row.dataset.dropMode = mode;
      row.classList.add(mode === 'inside' ? 'inventory-drop-inside' : mode === 'before' ? 'inventory-drop-before' : 'inventory-drop-after');
    });
    row.addEventListener('dragleave', event => {
      if (!row.contains(event.relatedTarget as Node | null)) {
        row.classList.remove('inventory-drop-before', 'inventory-drop-after', 'inventory-drop-inside');
        delete row.dataset.dropMode;
      }
    });
    row.addEventListener('drop', event => {
      const sourceId = inventoryDragId(event);
      if (!inventoryCanDropOn(sourceId, item.id)) return;
      event.preventDefault();
        const mode = row.dataset.dropMode === 'inside' || row.dataset.dropMode === 'before' || row.dataset.dropMode === 'after'
          ? row.dataset.dropMode
          : inventoryDropMode(event, row);
      inventoryMoveSubtree(sourceId, mode, item);
    });
  }

  const summary = document.createElement('div');
  summary.className = 'inventory-item-summary';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'inventory-item-toggle';
  toggle.setAttribute('aria-label', children.length ? `Toggle contents of ${item.name}` : 'No contents');
  toggle.textContent = children.length ? (inventoryExpandedContainers.has(item.id) ? '▾' : '▸') : '·';
  toggle.disabled = !children.length;
  toggle.onclick = () => {
    if (inventoryExpandedContainers.has(item.id)) inventoryExpandedContainers.delete(item.id);
    else inventoryExpandedContainers.add(item.id);
    renderInventoryEditor();
  };

  const main = document.createElement('div');
  main.className = 'inventory-item-main';
  const name = document.createElement('div');
  name.className = 'inventory-item-name';
  name.textContent = item.name;
  if (item.isContainer) {
    const badge = document.createElement('span');
    badge.className = 'inventory-container-badge';
    badge.textContent = 'container';
    name.appendChild(badge);
  }
  const meta = document.createElement('div');
  meta.className = 'inventory-item-meta';
  meta.textContent = item.containerId ? `Inside ${editingInventory.find(parent => parent.id === item.containerId)?.name || 'container'}` : (item.location === 'carried' ? 'Carried / on character' : 'Backpack');
  main.append(name, meta);
  if (item.description) {
    const description = document.createElement('div');
    description.className = 'inventory-item-description';
    description.textContent = item.description;
    main.appendChild(description);
  }
  const usage = inventoryUsage(item);
  if (usage.max > 0) {
    const usageRow = document.createElement('div');
    usageRow.className = 'inventory-item-usage';
    const usageLabel = document.createElement('span');
    usageLabel.textContent = `Uses ${usage.remaining}/${usage.max} · ${inventoryResetLabel(usage.reset)}`;
    const spend = document.createElement('button');
    spend.type = 'button';
    spend.textContent = '−';
    spend.title = `Spend one use of ${item.name}`;
    spend.disabled = !editingCanEdit || usage.remaining <= 0;
    spend.onclick = () => {
      item.usage.remaining = Math.max(0, usage.remaining - 1);
      renderInventoryEditor();
    };
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.textContent = '+';
    restore.title = `Restore one use of ${item.name}`;
    restore.disabled = !editingCanEdit || usage.remaining >= usage.max;
    restore.onclick = () => {
      item.usage.remaining = Math.min(usage.max, usage.remaining + 1);
      renderInventoryEditor();
    };
    usageRow.append(usageLabel, spend, restore);
    main.appendChild(usageRow);
  }
  summary.append(toggle, main);

  const controls = document.createElement('div');
  controls.className = 'inventory-item-controls';
  const decrease = document.createElement('button');
  decrease.type = 'button'; decrease.textContent = '−'; decrease.title = 'Use one';
  decrease.disabled = !editingCanEdit || item.qty <= 0;
  decrease.onclick = () => { item.qty = Math.max(0, item.qty - 1); renderInventoryEditor(); };
  const quantity = document.createElement('span');
  quantity.className = 'qty'; quantity.textContent = `×${item.qty}`;
  const increase = document.createElement('button');
  increase.type = 'button'; increase.textContent = '+'; increase.title = 'Add one';
  increase.disabled = !editingCanEdit || item.qty >= 9999;
  increase.onclick = () => { item.qty = Math.min(9999, item.qty + 1); renderInventoryEditor(); };
  const edit = document.createElement('button');
  edit.type = 'button'; edit.textContent = '✎'; edit.title = `Edit ${item.name}`;
  edit.disabled = !editingCanEdit;
  edit.onclick = () => {
    inventoryEditingId = inventoryEditingId === item.id ? '' : item.id;
    renderInventoryEditor();
  };
  const move = document.createElement('button');
  move.type = 'button'; move.textContent = '↔'; move.title = item.containerId ? 'Take out of container' : 'Move between carried and backpack';
  move.disabled = !editingCanEdit;
  move.onclick = () => moveInventoryItem(item);
  const remove = document.createElement('button');
  remove.type = 'button'; remove.className = 'del'; remove.textContent = '×'; remove.title = 'Remove item';
  remove.disabled = !editingCanEdit;
  remove.onclick = () => removeInventoryItem(item);
  controls.append(decrease, quantity, increase, edit, move, remove);
  row.append(summary, controls);

  const wrapper = document.createDocumentFragment();
  wrapper.appendChild(row);
  if (inventoryEditingId === item.id && editingCanEdit) wrapper.appendChild(renderInventoryEditForm(item, children));
  if (children.length && inventoryExpandedContainers.has(item.id)) {
    const childList = document.createElement('div');
    childList.className = 'inventory-item-children';
    children.forEach(child => childList.appendChild(renderInventoryItem(child)));
    wrapper.appendChild(childList);
  }
  return wrapper;
}

function renderInventoryEditor() {
  const list = getElementById('inventory-list');
  if (!list) return;
  list.innerHTML = '';
  renderInventoryContainerOptions();
  (['carried', 'backpack'] as InventoryLocation[]).forEach(location => {
    const group = document.createElement('section');
    group.className = 'inventory-group';
    group.dataset.location = location;
    if (editingCanEdit) {
      group.addEventListener('dragover', event => {
        if (event.target.closest('.inventory-item')) return;
        const sourceId = inventoryDragId(event);
        if (!sourceId || !editingInventory.some(item => item.id === sourceId)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        clearInventoryDropIndicators();
        group.dataset.dropMode = 'group';
        group.classList.add('inventory-drop-group');
      });
      group.addEventListener('dragleave', event => {
        if (!group.contains(event.relatedTarget as Node | null)) {
          group.classList.remove('inventory-drop-group');
          delete group.dataset.dropMode;
        }
      });
      group.addEventListener('drop', event => {
        if (event.target.closest('.inventory-item')) return;
        const sourceId = inventoryDragId(event);
        if (!sourceId || !editingInventory.some(item => item.id === sourceId)) return;
        event.preventDefault();
        inventoryMoveSubtree(sourceId, 'group', null, location);
      });
    }
    const heading = document.createElement('h4');
    heading.className = 'inventory-group-title';
    heading.textContent = location === 'carried' ? 'Carried / on character' : 'Backpack';
    group.appendChild(heading);
    const roots = editingInventory.filter(item => !item.containerId && item.location === location);
    if (!roots.length) {
      const empty = document.createElement('p');
      empty.className = 'inventory-group-empty';
      empty.textContent = location === 'carried' ? 'Nothing carried or held.' : 'Nothing in the backpack.';
      group.appendChild(empty);
    } else roots.forEach(item => group.appendChild(renderInventoryItem(item)));
    list.appendChild(group);
  });
}

getElementById('inv-add-btn').onclick = () => {
  const nameInput = getElementById('inv-item-name');
  const qtyInput = getElementById('inv-item-qty');
  const locationInput = getElementById('inv-item-location');
  const containerInput = getElementById('inv-item-container');
  const containerFlag = getElementById('inv-item-is-container');
  const descriptionInput = getElementById('inv-item-description');
  const usageMaxInput = getElementById('inv-item-usage-max');
  const usageResetInput = getElementById('inv-item-usage-reset');
  const name = nameInput.value.trim();
  if (!name) return;
  const parent = editingInventory.find(item => item.id === containerInput.value && item.isContainer);
  const quantity = Number(qtyInput.value);
  const usageMax = Math.max(0, Math.min(999, Math.floor(Number(usageMaxInput.value) || 0)));
  const usageReset = usageResetInput.value;
  const location = parent ? inventoryEffectiveLocation(parent) : (locationInput.value === 'carried' ? 'carried' : 'backpack');
  const item = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    description: descriptionInput.value.trim().slice(0, 4000),
    qty: Math.max(0, Math.min(9999, Number.isFinite(quantity) ? quantity : 1)),
    location,
    isContainer: !!containerFlag.checked,
    containerId: parent?.id || null,
    usage: { max: usageMax, remaining: usageMax, reset: isUsageReset(usageReset) ? usageReset : 'long-rest' }
  };
  editingInventory.push(item);
  if (parent) inventoryExpandedContainers.add(parent.id);
  nameInput.value = '';
  qtyInput.value = '1';
  containerInput.value = '';
  containerFlag.checked = false;
  descriptionInput.value = '';
  usageMaxInput.value = '0';
  usageResetInput.value = 'long-rest';
  renderInventoryEditor();
};
