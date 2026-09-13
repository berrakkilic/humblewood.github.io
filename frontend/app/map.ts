/** Map rendering, token positioning, gestures, grid, fog, doodles, pointers, and zoom. */

// ================= MAP =================
const mapUpload = document.getElementById('map-upload');
mapUpload.onchange = async () => {
  const file = mapUpload.files[0];
  if (!file) return;
  const url = await uploadFile(file);
  socket.emit('scene:setMap', { mapUrl: url, mapName: file.name });
};

function renderMap() {
  const img = document.getElementById('map-image');
  const empty = document.getElementById('empty-map');
  const grid = document.getElementById('grid-overlay');
  const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
  const gridOffsetX = Number(state.scene.gridOffsetX) || 0;
  const gridOffsetY = Number(state.scene.gridOffsetY) || 0;
  const gridColor = /^#[0-9a-f]{6}$/i.test(String(state.scene.gridColor || ''))
    ? state.scene.gridColor
    : '#3a2e25';
  grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  grid.style.backgroundPosition = `${gridOffsetX}px ${gridOffsetY}px`;
  grid.style.setProperty('--grid-color', gridColor);
  grid.classList.toggle('visible', !!state.scene.gridVisible);
  document.getElementById('grid-toggle').checked = !!state.scene.gridVisible;
  document.getElementById('grid-size').value = gridSize;
  document.getElementById('grid-color').value = gridColor;
  document.getElementById('snap-toggle').checked = state.scene.snapToGrid !== false;
  document.getElementById('fit-token-toggle').checked = state.scene.fitTokensToGrid !== false;
  if (!Array.isArray(state.scene.doodlePaths)) state.scene.doodlePaths = [];
  if (!Array.isArray(state.scene.fogShapes)) state.scene.fogShapes = [];
  updateMapPermissionControls();
  applyMapTransform();
  if (state.scene.mapUrl) {
    const sizeMapStage = () => {
      const stage = document.getElementById('map-stage');
      stage.style.width = img.naturalWidth + 'px';
      stage.style.height = img.naturalHeight + 'px';
      img.style.width = img.naturalWidth + 'px';
      img.style.height = img.naturalHeight + 'px';
      const canvas = document.getElementById('doodle-canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const fogCanvas = document.getElementById('fog-canvas');
      fogCanvas.width = img.naturalWidth;
      fogCanvas.height = img.naturalHeight;
      redrawAllDoodles();
      renderFog();
      renderMapTokens();
      if (lastFittedMapUrl !== state.scene.mapUrl) {
        lastFittedMapUrl = state.scene.mapUrl;
        fitMapToViewport();
      }
    };
    img.onload = sizeMapStage;
    img.src = state.scene.mapUrl;
    img.style.display = 'block';
    empty.style.display = 'none';
    if (img.complete && img.naturalWidth) sizeMapStage();
  } else {
    lastFittedMapUrl = null;
    img.style.display = 'none';
    empty.style.display = 'flex';
    renderFog();
    renderMapTokens();
  }
}

function renderMapTokens() {
  document.querySelectorAll('.token-on-map').forEach(el => el.remove());
  const stage = document.getElementById('map-stage');
  const current = currentInitiativeEntry();
  state.tokens.forEach(t => {
    if (myRole === 'player' && t.visibleToPlayers === false) return;
    const el = document.createElement('div');
    el.className = 'token-on-map kind-' + t.kind;
    if (!t.canControl) el.classList.add('locked-token');
    if (current && current.tokenId === t.id) el.classList.add('current-turn');
    if (t.visibleToPlayers === false) el.classList.add('hidden-token');
    el.dataset.id = t.id;
    el.tabIndex = 0;
    const displayLabel = visibleTokenLabel(t);
    const hoverLabel = tokenHoverText(t);
    el.title = hoverLabel;
    el.setAttribute('aria-label', `${hoverLabel}${t.canControl ? ', your token' : ', locked token'}`);
    el.style.left = t.x + 'px';
    el.style.top = t.y + 'px';
    const renderSize = tokenRenderSize(t);
    el.style.width = renderSize + 'px';
    el.style.height = renderSize + 'px';
    el.style.fontSize = Math.max(12, Math.round(renderSize * 0.45)) + 'px';
    const linkedCharacter = t.characterName ? state.characters[t.characterName] : null;
    const canManageCombat = !!linkedCharacter?.canManage || (myRole === 'dm' && t.kind === 'npc');
    const controls = [
      canManageCombat ? '<button type="button" data-action="combat" title="Open combat controls">⚔</button>' : '',
      myRole === 'dm' && !linkedCharacter && t.maxHp ? '<button type="button" data-action="damage" title="Lose 1 HP">−</button><button type="button" data-action="heal" title="Heal 1 HP">+</button>' : '',
      myRole === 'dm' ? '<button type="button" data-action="size-down" title="Make token smaller">↙</button><button type="button" data-action="size-up" title="Make token larger">↗</button>' : '',
      myRole === 'dm' ? '<button type="button" data-action="duplicate" title="Duplicate token">⧉</button>' : '',
      myRole === 'dm' ? `<button type="button" data-action="visibility" title="Show or hide from players">${t.visibleToPlayers === false ? '🙈' : '👁'}</button>` : '',
      myRole === 'dm' ? `<button type="button" data-action="remove" title="Remove ${t.kind === 'item' ? 'item token' : 'token'} from this scene">×</button>` : ''
    ].join('');
    el.innerHTML = `
      ${displayLabel ? `<div class="label">${escapeHtml(displayLabel)}</div>` : ''}
      ${t.imageUrl ? `<img src="${escapeAttr(t.imageUrl)}" alt="">` : emojiFor(t.kind)}
      ${t.maxHp ? `<div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, (t.hp / t.maxHp) * 100)}%"></div></div>` : ''}
      ${renderTokenConditionBadges(t, linkedCharacter)}
      ${controls ? `<div class="token-controls">${controls}</div>` : ''}
    `;
    el.onmousedown = (e) => startDragToken(e, t.id);
    el.addEventListener('touchstart', event => {
      if (event.target.closest?.('.token-controls') || selectedTool !== 'move') return;
      if (event.touches.length !== 1) {
        cancelDraggedToken();
        return;
      }
      const touch = event.touches[0];
      event.preventDefault();
      event.stopPropagation();
      el.focus({ preventScroll: true });
      if (startDragTokenAt(touch.clientX, touch.clientY, el, t.id)) {
        draggingTokenTouchId = touch.identifier;
      }
    }, { passive: false });
    el.onkeydown = event => {
      if ((event.key === 'Enter' || event.key === ' ') && canManageCombat) {
        event.preventDefault();
        if (linkedCharacter) openCombatManager(t.characterName);
        else openNpcCombatManager(t.id);
      }
    };
    el.querySelectorAll('.token-controls button').forEach(button => {
      button.onmousedown = (e) => e.stopPropagation();
      button.ontouchstart = (e) => e.stopPropagation();
      button.onclick = (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        if (action === 'combat') {
          if (linkedCharacter) openCombatManager(t.characterName);
          else openNpcCombatManager(t.id);
        }
        if (action === 'damage') socket.emit('token:update', { id: t.id, hp: Math.max(0, Number(t.hp) - 1) });
        if (action === 'heal') socket.emit('token:update', { id: t.id, hp: Math.min(Number(t.maxHp), Number(t.hp) + 1) });
        if (action === 'size-down') adjustTokenScale(t, -0.15);
        if (action === 'size-up') adjustTokenScale(t, 0.15);
        if (action === 'duplicate') socket.emit('token:duplicate', { id: t.id });
        if (action === 'visibility') socket.emit('token:update', { id: t.id, visibleToPlayers: t.visibleToPlayers === false });
        if (action === 'remove') socket.emit('token:remove', { id: t.id });
      };
    });
    stage.appendChild(el);
  });
}

function visibleTokenLabel(token) {
  if (myRole === 'dm' || state.scene.showTokenLabelsToPlayers !== false || token.kind === 'pc') return token.label;
  return '';
}

function tokenPronouns(token) {
  const direct = String(token?.pronouns || '').trim();
  if (direct) return direct;
  if (token?.characterName) {
    const character = state.characters?.[token.characterName];
    return String(character?.pronouns || character?.fields?.pronouns || '').trim();
  }
  if (token?.npcId) {
    const npc = state.npcs?.[token.npcId];
    return String(npc?.pronouns || npc?.sheet?.pronouns || npc?.sheet?.fields?.pronouns || '').trim();
  }
  return '';
}

function tokenHoverText(token) {
  const visibleName = visibleTokenLabel(token);
  const fallback = token.kind === 'pc' ? 'Player character' : token.kind === 'npc' ? 'NPC' : 'Item';
  const pronouns = tokenPronouns(token);
  return [visibleName || fallback, pronouns ? `Pronouns: ${pronouns}` : ''].filter(Boolean).join(' · ');
}

function renderTokenConditionBadges(token, linkedCharacter) {
  const combat = linkedCharacter?.combat || token.combat || token.conditionBadges || {};
  const badges = (combat.conditions || []).slice(0, 4).map(condition => ({
    text: condition.slice(0, 2).toUpperCase(), title: condition
  }));
  if (combat.concentration) badges.push({ text: '◎', title: 'Concentrating' });
  if (Number(combat.exhaustion)) badges.push({ text: `E${Number(combat.exhaustion)}`, title: `Exhaustion ${Number(combat.exhaustion)}` });
  if (!badges.length) return '';
  return `<div class="token-condition-badges">${badges.map(badge => `<span title="${escapeAttr(badge.title)}">${escapeHtml(badge.text)}</span>`).join('')}</div>`;
}

function tokenRenderSize(token) {
  const scale = Math.max(0.35, Math.min(3, Number(token.sizeScale) || 1));
  if (state.scene.fitTokensToGrid === false) return Math.max(12, Math.min(360, Math.round((Number(token.size) || 44) * scale)));
  const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
  const ratio = token.kind === 'item' ? 0.62 : 0.84;
  return Math.max(12, Math.min(360, Math.round(gridSize * ratio * scale)));
}

function adjustTokenScale(token, delta) {
  const current = Math.max(0.35, Math.min(3, Number(token.sizeScale) || 1));
  const next = Math.max(0.35, Math.min(3, Math.round((current + delta) * 100) / 100));
  socket.emit('token:update', { id: token.id, sizeScale: next });
}

function emojiFor(kind) {
  return kind === 'pc' ? '🧝' : kind === 'npc' ? '🦊' : '🌸';
}

function startDragToken(e, id) {
  if (e.button !== 0) return;
  if (!startDragTokenAt(e.clientX, e.clientY, e.currentTarget, id)) return;
  e.preventDefault();
}

function startDragTokenAt(clientX, clientY, element, id) {
  if (selectedTool !== 'move') return false;
  const token = state.tokens.find(entry => entry.id === id);
  if (!token?.canControl) {
    showToast('You can only move your own character token.');
    return false;
  }
  draggingToken = id;
  const rect = element.getBoundingClientRect();
  dragOffset.x = (clientX - (rect.left + rect.width / 2)) / mapScale;
  dragOffset.y = (clientY - (rect.top + rect.height / 2)) / mapScale;
  return true;
}

function moveDraggedToken(clientX, clientY) {
  if (!draggingToken) return;
  const stage = document.getElementById('map-stage');
  const rect = stage.getBoundingClientRect();
  const x = (clientX - rect.left) / mapScale - dragOffset.x;
  const y = (clientY - rect.top) / mapScale - dragOffset.y;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) {
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
}

function finishDraggedToken() {
  if (!draggingToken) return;
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (el) {
    let x = parseFloat(el.style.left);
    let y = parseFloat(el.style.top);
    if (document.getElementById('snap-toggle').checked) {
      const size = Math.max(10, Number(state.scene.gridSize) || 50);
      x = snapCoordinateToCell(x, size, state.scene.gridOffsetX);
      y = snapCoordinateToCell(y, size, state.scene.gridOffsetY);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    }
    socket.emit('token:move', { id: draggingToken, x, y });
  }
  draggingToken = null;
  draggingTokenTouchId = null;
}

function cancelDraggedToken() {
  if (!draggingToken) return;
  const token = state?.tokens?.find(entry => entry.id === draggingToken);
  const el = document.querySelector(`.token-on-map[data-id="${draggingToken}"]`);
  if (token && el) {
    el.style.left = token.x + 'px';
    el.style.top = token.y + 'px';
  }
  draggingToken = null;
  draggingTokenTouchId = null;
}

document.addEventListener('mousemove', (e) => {
  moveDraggedToken(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => finishDraggedToken());
document.addEventListener('touchmove', event => {
  if (!draggingToken || draggingTokenTouchId === null) return;
  const touch = Array.from(event.touches).find(entry => entry.identifier === draggingTokenTouchId);
  if (!touch) return;
  event.preventDefault();
  moveDraggedToken(touch.clientX, touch.clientY);
}, { passive: false });
document.addEventListener('touchend', event => {
  if (!draggingToken || draggingTokenTouchId === null) return;
  const ended = Array.from(event.changedTouches).some(entry => entry.identifier === draggingTokenTouchId);
  if (!ended) return;
  event.preventDefault();
  finishDraggedToken();
}, { passive: false });
document.addEventListener('touchcancel', event => {
  if (!draggingToken || draggingTokenTouchId === null) return;
  const cancelled = Array.from(event.changedTouches).some(entry => entry.identifier === draggingTokenTouchId);
  if (cancelled) cancelDraggedToken();
}, { passive: false });

// ---- Tool toggle ----
document.getElementById('tool-move').onclick = () => setTool('move');
document.getElementById('tool-pan').onclick = () => setTool('pan');
document.getElementById('tool-grid-move').onclick = () => setTool('grid-move');
document.getElementById('tool-ruler').onclick = () => setTool('ruler');
document.getElementById('tool-ping').onclick = () => setTool('ping');
document.getElementById('tool-doodle').onclick = () => setTool('doodle');
document.getElementById('tool-fog-reveal').onclick = () => setTool('fog-reveal');
document.getElementById('tool-fog-hide').onclick = () => setTool('fog-hide');
function setTool(tool) {
  if (tool === 'doodle' && !canDoodle()) return showToast('Player doodling is not enabled for this scene.');
  if (tool.startsWith('fog-') && (myRole !== 'dm' || !state.scene.fogEnabled)) return showToast('Enable fog of war first.');
  if (tool === 'grid-move' && myRole !== 'dm') return;
  const previousTool = selectedTool;
  selectedTool = tool;
  if (previousTool === 'doodle' && tool !== 'doodle') cancelDoodle();
  ['move', 'pan', 'grid-move', 'ruler', 'ping', 'doodle', 'fog-reveal', 'fog-hide'].forEach(name => {
    document.getElementById(`tool-${name}`)?.classList.toggle('active', tool === name);
  });
  const stage = document.getElementById('map-stage');
  stage.classList.toggle('doodling', tool === 'doodle');
  stage.classList.toggle('panning', tool === 'pan');
  stage.classList.toggle('grid-moving', tool === 'grid-move');
  stage.classList.toggle('measuring', tool === 'ruler');
  stage.classList.toggle('pinging', tool === 'ping');
  stage.classList.toggle('fog-editing', tool.startsWith('fog-'));
  if (previousTool === 'ping' && tool !== 'ping') socket.emit('pointer:hide');
  if (tool !== 'ruler') clearRuler();
  if (tool === 'ruler' && previousTool !== 'ruler') showToast('Drag to measure, or if you\'re on mobile, tap a start square and then an end square.');
  clearMapAreaSelection();
}

function canDoodle() {
  return myRole === 'dm' || !!state?.scene?.playerDoodlingEnabled;
}

function updateMapPermissionControls() {
  if (!state) return;
  document.getElementById('player-doodling-toggle').checked = !!state.scene.playerDoodlingEnabled;
  document.getElementById('token-labels-toggle').checked = state.scene.showTokenLabelsToPlayers !== false;
  document.getElementById('fog-enabled-toggle').checked = !!state.scene.fogEnabled;
  document.querySelectorAll('.doodle-control').forEach(element => element.classList.toggle('hidden', !canDoodle()));
  document.querySelectorAll('.fog-tool').forEach(element => element.classList.toggle('hidden', myRole !== 'dm' || !state.scene.fogEnabled));
  if (selectedTool === 'doodle' && !canDoodle()) setTool('move');
  if (selectedTool.startsWith('fog-') && !state.scene.fogEnabled) setTool('move');
}

document.getElementById('clear-doodles-btn').onclick = () => socket.emit('scene:doodle:clear');
document.getElementById('undo-doodle-btn').onclick = () => socket.emit('scene:doodle:undo');
document.getElementById('player-doodling-toggle').onchange = event => socket.emit('scene:setPlayerDoodling', { enabled: event.target.checked });
document.getElementById('token-labels-toggle').onchange = event => socket.emit('scene:setTokenLabels', { visible: event.target.checked });
document.getElementById('fog-enabled-toggle').onchange = event => socket.emit('scene:setFog', { enabled: event.target.checked });
document.getElementById('undo-fog-btn').onclick = () => socket.emit('scene:fog:undo');
document.getElementById('reset-fog-btn').onclick = () => {
  if (confirm('Reset fog to fully covered?')) socket.emit('scene:fog:reset');
};

const mapStageWrap = document.getElementById('map-stage-wrap');
mapStageWrap.addEventListener('mousedown', (e) => {
  const canStartPan = (selectedTool === 'pan' && e.button === 0) || e.button === 1 || (spacePanPressed && e.button === 0);
  if (selectedTool === 'grid-move' && e.button === 0 && myRole === 'dm' && isMapGestureTarget(e.target)) {
    e.preventDefault();
    gridMoveStart = {
      clientX: e.clientX, clientY: e.clientY,
      offsetX: Number(state.scene.gridOffsetX) || 0,
      offsetY: Number(state.scene.gridOffsetY) || 0
    };
    return;
  }
  if (!canStartPan || !isMapGestureTarget(e.target)) return;
  e.preventDefault();
  panStart = { clientX: e.clientX, clientY: e.clientY, x: mapPan.x, y: mapPan.y };
  mapStageWrap.classList.add('is-panning');
});
document.addEventListener('mousemove', (e) => {
  if (gridMoveStart) {
    const grid = document.getElementById('grid-overlay');
    const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
    const dx = (e.clientX - gridMoveStart.clientX) / mapScale;
    const dy = (e.clientY - gridMoveStart.clientY) / mapScale;
    const previewX = (((gridMoveStart.offsetX + dx) % gridSize) + gridSize) % gridSize;
    const previewY = (((gridMoveStart.offsetY + dy) % gridSize) + gridSize) % gridSize;
    grid.style.backgroundPosition = `${previewX}px ${previewY}px`;
    gridMoveStart.currentX = previewX;
    gridMoveStart.currentY = previewY;
    return;
  }
  if (!panStart) return;
  mapPan.x = panStart.x + e.clientX - panStart.clientX;
  mapPan.y = panStart.y + e.clientY - panStart.clientY;
  applyMapTransform();
});
document.addEventListener('mouseup', () => {
  if (gridMoveStart) {
    if (gridMoveStart.currentX !== undefined) {
      socket.emit('scene:setGrid', {
        gridSize: Number(document.getElementById('grid-size').value) || 50,
        gridVisible: document.getElementById('grid-toggle').checked,
        gridColor: document.getElementById('grid-color').value,
        snapToGrid: document.getElementById('snap-toggle').checked,
        fitTokensToGrid: document.getElementById('fit-token-toggle').checked,
        gridOffsetX: gridMoveStart.currentX,
        gridOffsetY: gridMoveStart.currentY
      });
    }
    gridMoveStart = null;
  }
  panStart = null;
  mapStageWrap.classList.remove('is-panning');
});

document.addEventListener('keydown', event => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (event.code !== 'Space' || typing) return;
  spacePanPressed = true;
  mapStageWrap.classList.add('space-pan-ready');
  if (document.getElementById('view-map').classList.contains('active')) event.preventDefault();
});
document.addEventListener('keyup', event => {
  if (event.code !== 'Space') return;
  spacePanPressed = false;
  mapStageWrap.classList.remove('space-pan-ready');
});

mapStageWrap.addEventListener('wheel', event => {
  if (!isMapGestureTarget(event.target)) return;
  event.preventDefault();
  const sensitivity = event.ctrlKey ? 0.006 : 0.0015;
  const nextScale = mapScale * Math.exp(-event.deltaY * sensitivity);
  setMapZoom(nextScale, { clientX: event.clientX, clientY: event.clientY });
}, { passive: false });

mapStageWrap.addEventListener('touchstart', event => {
  if (!isMapGestureTarget(event.target)) return;
  if (event.touches.length >= 2) {
    event.preventDefault();
    cancelDraggedToken();
    cancelDoodle();
    if (touchGesture?.type === 'ruler' || rulerAnchorPoint) clearRuler();
    touchGesture = createPinchGesture(event.touches);
  } else if (event.touches.length === 1 && selectedTool === 'ruler') {
    event.preventDefault();
    const touch = event.touches[0];
    const point = getCanvasPos(touch);
    const completingTap = !!rulerAnchorPoint;
    touchGesture = {
      type: 'ruler',
      start: completingTap ? rulerAnchorPoint : point,
      startClientX: touch.clientX,
      startClientY: touch.clientY,
      moved: false,
      completingTap
    };
    updateRuler(touchGesture.start, point);
  } else if (event.touches.length === 1 && selectedTool === 'pan') {
    event.preventDefault();
    const touch = event.touches[0];
    touchGesture = {
      type: 'pan',
      clientX: touch.clientX,
      clientY: touch.clientY,
      pan: { ...mapPan }
    };
    mapStageWrap.classList.add('is-panning');
  }
}, { passive: false });

mapStageWrap.addEventListener('touchmove', event => {
  if (event.touches.length >= 2) {
    event.preventDefault();
    cancelDraggedToken();
    cancelDoodle();
    if (touchGesture?.type === 'ruler' || rulerAnchorPoint) clearRuler();
    if (touchGesture?.type !== 'pinch') touchGesture = createPinchGesture(event.touches);
    const current = touchMetrics(event.touches);
    const wrapperRect = mapStageWrap.getBoundingClientRect();
    const anchor = {
      x: current.center.x - wrapperRect.left,
      y: current.center.y - wrapperRect.top
    };
    const next = positionStagePoint({
      stagePoint: touchGesture.stagePoint,
      anchor,
      nextScale: touchGesture.scale * (current.distance / Math.max(1, touchGesture.distance))
    });
    mapScale = next.scale;
    mapPan = next.pan;
    applyMapTransform();
  } else if (event.touches.length === 1 && touchGesture?.type === 'ruler') {
    event.preventDefault();
    const touch = event.touches[0];
    if (Math.hypot(touch.clientX - touchGesture.startClientX, touch.clientY - touchGesture.startClientY) >= 8) {
      touchGesture.moved = true;
    }
    updateRuler(touchGesture.start, getCanvasPos(touch));
  } else if (event.touches.length === 1 && touchGesture?.type === 'pan') {
    event.preventDefault();
    const touch = event.touches[0];
    mapPan.x = touchGesture.pan.x + touch.clientX - touchGesture.clientX;
    mapPan.y = touchGesture.pan.y + touch.clientY - touchGesture.clientY;
    applyMapTransform();
  }
}, { passive: false });

mapStageWrap.addEventListener('touchend', event => {
  if (touchGesture?.type === 'ruler') {
    event.preventDefault();
    const touch = event.changedTouches[0];
    const end = touch ? getCanvasPos(touch) : touchGesture.start;
    if (!touchGesture.moved && !touchGesture.completingTap) {
      rulerAnchorPoint = touchGesture.start;
      updateRuler(rulerAnchorPoint, rulerAnchorPoint);
      showToast('Start placed. Tap the ending square.');
    } else {
      updateRuler(touchGesture.start, end);
      rulerAnchorPoint = null;
    }
    touchGesture = null;
  } else if (event.touches.length === 1 && selectedTool === 'pan') {
    const touch = event.touches[0];
    touchGesture = {
      type: 'pan',
      clientX: touch.clientX,
      clientY: touch.clientY,
      pan: { ...mapPan }
    };
  } else if (event.touches.length < 2) {
    touchGesture = null;
    mapStageWrap.classList.remove('is-panning');
  }
}, { passive: false });
mapStageWrap.addEventListener('touchcancel', () => {
  if (touchGesture?.type === 'ruler') {
    if (rulerAnchorPoint) updateRuler(rulerAnchorPoint, rulerAnchorPoint);
    else clearRuler();
  }
  touchGesture = null;
  mapStageWrap.classList.remove('is-panning');
});

function isMapGestureTarget(target) {
  return !!target.closest?.('#map-stage, #empty-map') && !target.closest('button, input, select, textarea, label');
}

function touchMetrics(touches) {
  const first = touches[0];
  const second = touches[1];
  return {
    center: {
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2
    },
    distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
  };
}

function createPinchGesture(touches) {
  const metrics = touchMetrics(touches);
  const wrapperRect = mapStageWrap.getBoundingClientRect();
  const anchor = {
    x: metrics.center.x - wrapperRect.left,
    y: metrics.center.y - wrapperRect.top
  };
  mapStageWrap.classList.add('is-panning');
  return {
    type: 'pinch',
    distance: metrics.distance,
    scale: mapScale,
    stagePoint: {
      x: (anchor.x - mapPan.x) / mapScale,
      y: (anchor.y - mapPan.y) / mapScale
    }
  };
}

const mapStage = document.getElementById('map-stage');
mapStage.addEventListener('mousedown', event => {
  if (event.button !== 0) return;
  const point = getCanvasPos(event);
  if (selectedTool === 'ruler') {
    event.preventDefault();
    rulerAnchorPoint = null;
    rulerStartPoint = point;
    updateRuler(point, point);
  } else if (selectedTool === 'ping') {
    event.preventDefault();
    socket.emit('pointer:ping', point);
  } else if (selectedTool === 'fog-reveal' || selectedTool === 'fog-hide') {
    event.preventDefault();
    mapAreaDrag = { start: point, current: point, mode: selectedTool === 'fog-reveal' ? 'reveal' : 'hide' };
    updateMapAreaSelection(mapAreaDrag);
  }
});

mapStage.addEventListener('mousemove', event => {
  if (selectedTool !== 'ping') return;
  const now = Date.now();
  if (now - lastPointerSentAt < 45) return;
  lastPointerSentAt = now;
  socket.emit('pointer:move', getCanvasPos(event));
});

mapStage.addEventListener('mouseleave', () => {
  if (selectedTool === 'ping') socket.emit('pointer:hide');
});

document.addEventListener('mousemove', event => {
  if (rulerStartPoint) updateRuler(rulerStartPoint, getCanvasPos(event));
  if (mapAreaDrag) {
    mapAreaDrag.current = getCanvasPos(event);
    updateMapAreaSelection(mapAreaDrag);
  }
});

document.addEventListener('mouseup', event => {
  if (rulerStartPoint) {
    updateRuler(rulerStartPoint, getCanvasPos(event));
    rulerStartPoint = null;
  }
  if (mapAreaDrag) {
    const current = getCanvasPos(event);
    const x = Math.min(mapAreaDrag.start.x, current.x);
    const y = Math.min(mapAreaDrag.start.y, current.y);
    const width = Math.abs(current.x - mapAreaDrag.start.x);
    const height = Math.abs(current.y - mapAreaDrag.start.y);
    if (width >= 3 && height >= 3) socket.emit('scene:fog:add', { mode: mapAreaDrag.mode, x, y, width, height });
    mapAreaDrag = null;
    clearMapAreaSelection();
  }
});

function updateRuler(start, end) {
  const overlay = document.getElementById('ruler-overlay');
  const line = document.getElementById('ruler-line');
  const startDot = document.getElementById('ruler-start');
  const endDot = document.getElementById('ruler-end');
  const label = document.getElementById('ruler-label');
  const gridSize = Math.max(10, Number(state.scene.gridSize) || 50);
  const measurement = gridMeasurement(
    start,
    end,
    gridSize,
    state.scene.gridOffsetX,
    state.scene.gridOffsetY
  );
  overlay.classList.add('visible');
  line.setAttribute('x1', measurement.start.x); line.setAttribute('y1', measurement.start.y);
  line.setAttribute('x2', measurement.end.x); line.setAttribute('y2', measurement.end.y);
  startDot.setAttribute('cx', measurement.start.x); startDot.setAttribute('cy', measurement.start.y);
  endDot.setAttribute('cx', measurement.end.x); endDot.setAttribute('cy', measurement.end.y);
  label.setAttribute('x', (measurement.start.x + measurement.end.x) / 2);
  label.setAttribute('y', (measurement.start.y + measurement.end.y) / 2 - 10);
  const squareLabel = measurement.squares === 1 ? 'square' : 'squares';
  label.textContent = `${measurement.squares} ${squareLabel} · ${measurement.feet} ft`;
}

function clearRuler() {
  rulerStartPoint = null;
  rulerAnchorPoint = null;
  document.getElementById('ruler-overlay').classList.remove('visible');
}

function updateMapAreaSelection(drag) {
  const selection = document.getElementById('map-area-selection');
  const x = Math.min(drag.start.x, drag.current.x);
  const y = Math.min(drag.start.y, drag.current.y);
  selection.style.left = `${x}px`;
  selection.style.top = `${y}px`;
  selection.style.width = `${Math.abs(drag.current.x - drag.start.x)}px`;
  selection.style.height = `${Math.abs(drag.current.y - drag.start.y)}px`;
  selection.className = `visible ${drag.mode}`;
}

function clearMapAreaSelection() {
  mapAreaDrag = null;
  const selection = document.getElementById('map-area-selection');
  selection.className = '';
  selection.style.width = '0';
  selection.style.height = '0';
}

document.getElementById('grid-toggle').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    gridColor: document.getElementById('grid-color').value,
    snapToGrid: document.getElementById('snap-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('grid-size').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    gridColor: document.getElementById('grid-color').value,
    snapToGrid: document.getElementById('snap-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('grid-color').oninput = event => {
  document.getElementById('grid-overlay').style.setProperty('--grid-color', event.target.value);
};
document.getElementById('grid-color').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    gridColor: document.getElementById('grid-color').value,
    snapToGrid: document.getElementById('snap-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('snap-toggle').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    gridColor: document.getElementById('grid-color').value,
    snapToGrid: document.getElementById('snap-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('fit-token-toggle').onchange = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    gridColor: document.getElementById('grid-color').value,
    snapToGrid: document.getElementById('snap-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked
  });
};
document.getElementById('grid-offset-reset').onclick = () => {
  socket.emit('scene:setGrid', {
    gridSize: Number(document.getElementById('grid-size').value) || 50,
    gridVisible: document.getElementById('grid-toggle').checked,
    gridColor: document.getElementById('grid-color').value,
    snapToGrid: document.getElementById('snap-toggle').checked,
    fitTokensToGrid: document.getElementById('fit-token-toggle').checked,
    gridOffsetX: 0,
    gridOffsetY: 0
  });
};

document.getElementById('zoom-in').onclick = () => setMapZoom(mapScale * 1.2, viewportCenter());
document.getElementById('zoom-out').onclick = () => setMapZoom(mapScale / 1.2, viewportCenter());
document.getElementById('zoom-reset').onclick = () => {
  mapScale = 1;
  mapPan = { x: 0, y: 0 };
  applyMapTransform();
};
document.getElementById('zoom-fit').onclick = fitMapToViewport;

document.getElementById('toggle-initiative-btn').onclick = () => {
  const mapView = document.getElementById('view-map');
  const collapsed = mapView.classList.toggle('initiative-collapsed');
  document.getElementById('toggle-initiative-btn').setAttribute('aria-expanded', String(!collapsed));
};

function setMapZoom(value, clientPoint = viewportCenter()) {
  const wrapperRect = mapStageWrap.getBoundingClientRect();
  const anchor = {
    x: clientPoint.clientX - wrapperRect.left,
    y: clientPoint.clientY - wrapperRect.top
  };
  const next = zoomAroundPoint({
    pan: mapPan,
    scale: mapScale,
    nextScale: clampScale(Math.round(value * 1000) / 1000),
    anchor
  });
  mapScale = next.scale;
  mapPan = next.pan;
  applyMapTransform();
}

function viewportCenter() {
  const rect = mapStageWrap.getBoundingClientRect();
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
}

function fitMapToViewport() {
  const stage = document.getElementById('map-stage');
  const stageWidth = stage.offsetWidth;
  const stageHeight = stage.offsetHeight;
  if (!stageWidth || !stageHeight) return;
  const fitted = fitStageInViewport({
    stageWidth,
    stageHeight,
    viewportWidth: mapStageWrap.clientWidth,
    viewportHeight: mapStageWrap.clientHeight,
    padding: 24
  });
  mapScale = fitted.scale;
  mapPan = fitted.pan;
  applyMapTransform();
}

function applyMapTransform() {
  const stage = document.getElementById('map-stage');
  if (!stage) return;
  stage.style.transform = `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapScale})`;
  document.getElementById('zoom-level').textContent = Math.round(mapScale * 100) + '%';
}

// ---- Doodling ----
let isDrawing = false;
let currentPath = null;
let doodleTouchId = null;
const doodleCanvas = document.getElementById('doodle-canvas');
const doodleCtx = doodleCanvas.getContext('2d');

doodleCanvas.onmousedown = (e) => {
  if (e.button !== 0) return;
  startDoodle(getCanvasPos(e));
};
doodleCanvas.onmousemove = (e) => {
  continueDoodle(getCanvasPos(e));
};
document.addEventListener('mouseup', () => finishDoodle());

doodleCanvas.addEventListener('touchstart', event => {
  if (selectedTool !== 'doodle') return;
  if (event.touches.length !== 1) {
    cancelDoodle();
    return;
  }
  const touch = event.touches[0];
  event.preventDefault();
  if (startDoodle(getCanvasPos(touch))) doodleTouchId = touch.identifier;
}, { passive: false });
doodleCanvas.addEventListener('touchmove', event => {
  if (!isDrawing || doodleTouchId === null) return;
  if (event.touches.length !== 1) {
    cancelDoodle();
    return;
  }
  const touch = Array.from(event.touches as TouchList).find(entry => entry.identifier === doodleTouchId);
  if (!touch) return;
  event.preventDefault();
  continueDoodle(getCanvasPos(touch));
}, { passive: false });
doodleCanvas.addEventListener('touchend', event => {
  if (!isDrawing || doodleTouchId === null) return;
  const touch = Array.from(event.changedTouches as TouchList).find(entry => entry.identifier === doodleTouchId);
  if (!touch) return;
  event.preventDefault();
  continueDoodle(getCanvasPos(touch));
  finishDoodle();
}, { passive: false });
doodleCanvas.addEventListener('touchcancel', event => {
  if (doodleTouchId === null) return;
  const cancelled = Array.from(event.changedTouches as TouchList).some(entry => entry.identifier === doodleTouchId);
  if (cancelled) cancelDoodle();
}, { passive: false });

function startDoodle(point) {
  if (selectedTool !== 'doodle' || !canDoodle()) return false;
  isDrawing = true;
  currentPath = {
    id: 'd' + Date.now(),
    color: document.getElementById('doodle-color').value,
    width: 3,
    points: [point]
  };
  return true;
}

function continueDoodle(point) {
  if (!isDrawing || !currentPath) return;
  const previous = currentPath.points[currentPath.points.length - 1];
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.25) return;
  currentPath.points.push(point);
  drawDoodlePath(currentPath, true);
}

function finishDoodle() {
  if (isDrawing && currentPath && currentPath.points.length > 1) {
    socket.emit('scene:doodle:add', currentPath);
  }
  isDrawing = false;
  currentPath = null;
  doodleTouchId = null;
}

function cancelDoodle() {
  if (!isDrawing && doodleTouchId === null) return;
  isDrawing = false;
  currentPath = null;
  doodleTouchId = null;
  if (state?.scene) redrawAllDoodles();
}

function getCanvasPos(e) {
  const rect = doodleCanvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / mapScale, y: (e.clientY - rect.top) / mapScale };
}

function drawDoodlePath(path, liveOnly = false) {
  doodleCtx.strokeStyle = path.color;
  doodleCtx.lineWidth = path.width;
  doodleCtx.lineCap = 'round';
  doodleCtx.lineJoin = 'round';
  doodleCtx.beginPath();
  path.points.forEach((p, i) => {
    if (i === 0) doodleCtx.moveTo(p.x, p.y); else doodleCtx.lineTo(p.x, p.y);
  });
  doodleCtx.stroke();
}

function clearDoodleCanvas() {
  doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
}
function redrawAllDoodles() {
  clearDoodleCanvas();
  state.scene.doodlePaths.forEach(p => drawDoodlePath(p));
}

function renderFog() {
  const canvas = document.getElementById('fog-canvas');
  if (!canvas || !state) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.classList.toggle('active', !!state.scene.fogEnabled);
  if (!state.scene.fogEnabled || !canvas.width || !canvas.height) return;
  const fogColor = myRole === 'dm' ? 'rgba(25, 32, 25, .52)' : 'rgb(18, 23, 19)';
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = fogColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  (state.scene.fogShapes || []).forEach(shape => {
    if (shape.mode === 'reveal') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = fogColor;
    }
    ctx.fillRect(Number(shape.x) || 0, Number(shape.y) || 0, Number(shape.width) || 0, Number(shape.height) || 0);
  });
  ctx.globalCompositeOperation = 'source-over';
}

function renderSharedPointer({ id, name, color, x, y }: any = {}) {
  if (!id || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
  let pointer = findSharedPointer(id);
  if (!pointer) {
    pointer = document.createElement('div');
    pointer.className = 'shared-pointer';
    pointer.dataset.pointerId = id;
    const dot = document.createElement('span');
    dot.className = 'shared-pointer-dot';
    const label = document.createElement('span');
    label.className = 'shared-pointer-label';
    pointer.append(dot, label);
    document.getElementById('map-stage').appendChild(pointer);
  }
  pointer.style.left = `${Number(x)}px`;
  pointer.style.top = `${Number(y)}px`;
  pointer.style.setProperty('--pointer-color', color || '#d98a9e');
  pointer.querySelector('.shared-pointer-label').textContent = name || 'Player';
  pointer.classList.remove('fading');
  clearTimeout(pointerFadeTimers.get(id));
  pointerFadeTimers.set(id, setTimeout(() => pointer.classList.add('fading'), 1200));
}

function removeSharedPointer(id) {
  if (!id) return;
  const pointer = findSharedPointer(id);
  if (pointer) pointer.remove();
  clearTimeout(pointerFadeTimers.get(id));
  pointerFadeTimers.delete(id);
}

function findSharedPointer(id) {
  return [...document.querySelectorAll('.shared-pointer')]
    .find(pointer => pointer.dataset.pointerId === String(id));
}

function renderSharedPing({ name, color, x, y }: any = {}) {
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
  const ping = document.createElement('div');
  ping.className = 'shared-ping';
  ping.style.left = `${Number(x)}px`;
  ping.style.top = `${Number(y)}px`;
  ping.style.setProperty('--pointer-color', color || '#d98a9e');
  const label = document.createElement('span');
  label.textContent = name || 'Player';
  ping.appendChild(label);
  document.getElementById('map-stage').appendChild(ping);
  setTimeout(() => ping.remove(), 1500);
}
