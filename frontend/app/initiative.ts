/** Initiative tracker controls, ordering, and quick-add list. */

// ================= INITIATIVE (MAP PANEL) =================
document.getElementById('init-add-btn').onclick = () => {
  const name = document.getElementById('init-name').value.trim();
  const value = Number(document.getElementById('init-value').value);
  if (!name || !Number.isFinite(value)) return showToast('Add a name and initiative value.');
  const token = state.tokens.find(entry => entry.label.toLowerCase() === name.toLowerCase());
  socket.emit('initiative:add', { name, value, tokenId: token?.id || null });
  document.getElementById('init-name').value = '';
  document.getElementById('init-value').value = '';
};
document.getElementById('init-next-btn').onclick = () => socket.emit('initiative:next');
document.getElementById('init-reset-btn').onclick = () => {
  if (confirm('Clear the turn order and return to round 1?')) socket.emit('initiative:reset');
};

function currentInitiativeEntry() {
  const initiative = state?.initiative;
  if (!initiative || initiative.currentIndex < 0) return null;
  return initiative.entries[initiative.currentIndex] || null;
}

function renderInitiative() {
  if (!state) return;
  const initiative = state.initiative || { entries: [], round: 1, currentIndex: -1 };
  document.getElementById('init-round').textContent = initiative.round || 1;
  document.getElementById('initiative-count').textContent = initiative.entries.length;
  const list = document.getElementById('initiative-list');
  list.innerHTML = '';
  if (!initiative.entries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-roll-options';
    empty.textContent = 'No combatants yet. Roll initiative from the Dice tab or add one here.';
    list.appendChild(empty);
  }
  initiative.entries.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'initiative-item' + (index === initiative.currentIndex ? ' current-turn' : '');
    row.dataset.initiativeId = entry.id;
    if (myRole === 'dm') {
      const dragHandle = document.createElement('span');
      dragHandle.className = 'initiative-drag-handle';
      dragHandle.textContent = '⋮⋮';
      dragHandle.title = 'Drag to reorder';
      dragHandle.draggable = true;
      dragHandle.ondragstart = event => {
        draggedInitiativeId = entry.id;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', entry.id);
        row.classList.add('dragging');
      };
      dragHandle.ondragend = () => {
        draggedInitiativeId = null;
        document.querySelectorAll('.initiative-item').forEach(item => item.classList.remove('dragging', 'drag-over'));
      };
      row.appendChild(dragHandle);
    }
    const value: any = document.createElement(myRole === 'dm' ? 'input' : 'div');
    value.className = 'init-value' + (myRole === 'dm' ? ' init-value-edit' : '');
    if (myRole === 'dm') {
      value.type = 'number';
      value.value = entry.value;
      value.title = `Edit ${entry.name}'s initiative`;
      value.onchange = () => socket.emit('initiative:edit', { id: entry.id, value: Number(value.value) });
    } else {
      value.textContent = entry.value;
    }
    const name = document.createElement('div');
    name.className = 'init-name';
    name.textContent = entry.name;
    if (index === initiative.currentIndex) {
      const meta = document.createElement('span');
      meta.className = 'init-meta';
      meta.textContent = 'Current turn';
      name.appendChild(meta);
    }
    row.append(value, name);
    const character = state.characters[entry.name];
    const npcToken = entry.tokenId ? state.tokens.find(token => token.id === entry.tokenId && token.kind === 'npc') : null;
    if (character?.canManage || (myRole === 'dm' && npcToken)) {
      const combatButton = document.createElement('button');
      combatButton.type = 'button';
      combatButton.className = 'initiative-combat-btn';
      combatButton.textContent = '⚔';
      combatButton.title = `Open combat controls for ${entry.name}`;
      combatButton.onclick = () => npcToken ? openNpcCombatManager(npcToken.id) : openCombatManager(entry.name);
      row.appendChild(combatButton);
    }
    if (myRole === 'dm') {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'del';
      remove.textContent = '×';
      remove.title = `Remove ${entry.name}`;
      remove.onclick = () => socket.emit('initiative:remove', { id: entry.id });
      row.appendChild(remove);
      row.ondragover = event => {
        if (!draggedInitiativeId || draggedInitiativeId === entry.id) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      };
      row.ondragleave = () => row.classList.remove('drag-over');
      row.ondrop = event => {
        event.preventDefault();
        const draggedId = draggedInitiativeId || event.dataTransfer.getData('text/plain');
        row.classList.remove('drag-over');
        if (!draggedId || draggedId === entry.id) return;
        const orderedIds = initiative.entries.map(item => item.id).filter(id => id !== draggedId);
        const targetIndex = orderedIds.indexOf(entry.id);
        const rect = row.getBoundingClientRect();
        const insertAfter = event.clientY > rect.top + rect.height / 2;
        orderedIds.splice(Math.max(0, targetIndex + (insertAfter ? 1 : 0)), 0, draggedId);
        socket.emit('initiative:reorder', { orderedIds });
      };
    }
    list.appendChild(row);
  });
  renderInitiativeQuickAdd();
}

function renderInitiativeQuickAdd() {
  const container = document.getElementById('init-quick-add');
  container.innerHTML = '';
  if (myRole !== 'dm') return;
  const label = document.createElement('span');
  label.className = 'quick-add-label';
  label.textContent = 'Roll initiative:';
  container.appendChild(label);
  Object.values(state.characters).forEach(character => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-ghost quick-add-chip';
    button.textContent = `🎲 ${character.name}`;
    button.onclick = () => rollCharacterInitiative(character, 'normal');
    container.appendChild(button);
  });
  state.tokens.filter(token => token.kind !== 'item' && !state.characters[token.label]).forEach(token => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-ghost quick-add-chip';
    button.textContent = token.label;
    button.onclick = () => {
      if (token.kind === 'npc') rollNpcInitiative(token, 'normal');
      else {
        document.getElementById('init-name').value = token.label;
        document.getElementById('init-value').focus();
      }
    };
    container.appendChild(button);
  });
}
