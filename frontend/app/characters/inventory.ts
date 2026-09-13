/** Nested inventory normalization, drag-and-drop ordering, containers, and item editing. */

function normalizeInventory(inventory) {
  const source = Array.isArray(inventory)
    ? inventory
    : typeof inventory === 'string' && inventory.trim()
      ? inventory.split(/\n|,/).map(name => ({ name, qty: 1 }))
      : [];
  const seen = new Set();
  const items = source.map((item, index) => {
    if (!item || typeof item !== 'object') return null;
    let id = String(item.id || `item-${Date.now()}-${index}`);
    if (!id || seen.has(id)) id = `item-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
    seen.add(id);
    const quantity = item.qty === 0 ? 0 : Number(item.qty);
    const name = String(item.name || '').trim();
    return {
      id,
      name,
      qty: Math.max(0, Math.min(9999, Number.isFinite(quantity) ? quantity : 1)),
      location: item.location === 'carried' ? 'carried' : 'backpack',
      isContainer: !!(item.isContainer ?? item.container) || /(?:backpack|bag|pouch|chest|satchel|quiver|case|pack)$/i.test(name),
      containerId: String(item.containerId || '').trim() || null
    };
  }).filter(item => item && item.name);
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

function inventoryChildren(itemId) {
  return editingInventory.filter(item => item.containerId === itemId);
}

function inventoryIsInSubtree(itemId, rootId) {
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

function inventorySubtree(itemId) {
  return editingInventory.filter(item => item.id === itemId || inventoryIsInSubtree(item.id, itemId));
}

function clearInventoryDropIndicators() {
  document.querySelectorAll('.inventory-item.inventory-drop-before, .inventory-item.inventory-drop-after, .inventory-item.inventory-drop-inside, .inventory-group.inventory-drop-group').forEach(element => {
    element.classList.remove('inventory-drop-before', 'inventory-drop-after', 'inventory-drop-inside', 'inventory-drop-group');
    delete element.dataset.dropMode;
  });
}

function inventoryDragId(event) {
  return event.dataTransfer?.getData('text/plain') || inventoryDraggingId;
}

function inventoryCanDropOn(sourceId, targetId) {
  return !!sourceId && !!targetId && sourceId !== targetId && !inventoryIsInSubtree(targetId, sourceId);
}

function inventoryMoveSubtree(sourceId, mode, target = null, location = null) {
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

function inventoryDropMode(event, item) {
  const rect = item.getBoundingClientRect();
  const ratio = rect.height ? (event.clientY - rect.top) / rect.height : 0.5;
  if (item.dataset.isContainer === 'true' && ratio > 0.25 && ratio < 0.75) return 'inside';
  return ratio < 0.5 ? 'before' : 'after';
}

function inventoryEffectiveLocation(item) {
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
  const select = document.getElementById('inv-item-container');
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

function removeInventoryItem(item) {
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

function moveInventoryItem(item) {
  const effectiveLocation = inventoryEffectiveLocation(item);
  if (item.containerId) {
    item.containerId = null;
    item.location = effectiveLocation === 'carried' ? 'backpack' : 'carried';
  } else {
    item.location = item.location === 'carried' ? 'backpack' : 'carried';
  }
  renderInventoryEditor();
}

function renderInventoryItem(item) {
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
      const mode = row.dataset.dropMode || inventoryDropMode(event, row);
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
  const move = document.createElement('button');
  move.type = 'button'; move.textContent = '↔'; move.title = item.containerId ? 'Take out of container' : 'Move between carried and backpack';
  move.disabled = !editingCanEdit;
  move.onclick = () => moveInventoryItem(item);
  const remove = document.createElement('button');
  remove.type = 'button'; remove.className = 'del'; remove.textContent = '×'; remove.title = 'Remove item';
  remove.disabled = !editingCanEdit;
  remove.onclick = () => removeInventoryItem(item);
  controls.append(decrease, quantity, increase, move, remove);
  row.append(summary, controls);

  const wrapper = document.createDocumentFragment();
  wrapper.appendChild(row);
  if (children.length && inventoryExpandedContainers.has(item.id)) {
    const childList = document.createElement('div');
    childList.className = 'inventory-item-children';
    children.forEach(child => childList.appendChild(renderInventoryItem(child)));
    wrapper.appendChild(childList);
  }
  return wrapper;
}

function renderInventoryEditor() {
  const list = document.getElementById('inventory-list');
  if (!list) return;
  list.innerHTML = '';
  renderInventoryContainerOptions();
  ['carried', 'backpack'].forEach(location => {
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

document.getElementById('inv-add-btn').onclick = () => {
  const nameInput = document.getElementById('inv-item-name');
  const qtyInput = document.getElementById('inv-item-qty');
  const locationInput = document.getElementById('inv-item-location');
  const containerInput = document.getElementById('inv-item-container');
  const containerFlag = document.getElementById('inv-item-is-container');
  const name = nameInput.value.trim();
  if (!name) return;
  const parent = editingInventory.find(item => item.id === containerInput.value && item.isContainer);
  const quantity = Number(qtyInput.value);
  const location = parent ? inventoryEffectiveLocation(parent) : (locationInput.value === 'carried' ? 'carried' : 'backpack');
  const item = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    qty: Math.max(0, Math.min(9999, Number.isFinite(quantity) ? quantity : 1)),
    location,
    isContainer: !!containerFlag.checked,
    containerId: parent?.id || null
  };
  editingInventory.push(item);
  if (parent) inventoryExpandedContainers.add(parent.id);
  nameInput.value = '';
  qtyInput.value = 1;
  containerInput.value = '';
  containerFlag.checked = false;
  renderInventoryEditor();
};
