/** Map doodle drawing, erasing, and canvas rendering. */
let isDrawing = false;
let isErasing = false;
let currentPath = null;
let lastErasePoint = null;
let doodleTouchId = null;
const doodleCanvas = document.getElementById('doodle-canvas');
const doodleCtx = doodleCanvas.getContext('2d');

doodleCanvas.onmousedown = (event) => {
  if (event.button !== 0) return;
  startDoodle(getCanvasPos(event));
};
doodleCanvas.onmousemove = event => continueDoodle(getCanvasPos(event));
document.addEventListener('mouseup', () => finishDoodle());

doodleCanvas.addEventListener('touchstart', event => {
  if (selectedTool !== 'doodle' && selectedTool !== 'eraser') return;
  if (event.touches.length !== 1) {
    cancelDoodle();
    return;
  }
  const touch = event.touches[0];
  event.preventDefault();
  if (startDoodle(getCanvasPos(touch))) doodleTouchId = touch.identifier;
}, { passive: false });
doodleCanvas.addEventListener('touchmove', event => {
  if ((!isDrawing && !isErasing) || doodleTouchId === null) return;
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
  if ((!isDrawing && !isErasing) || doodleTouchId === null) return;
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
  if (!canDoodle()) return false;
  if (selectedTool === 'eraser') {
    isErasing = true;
    lastErasePoint = point;
    socket.emit('scene:doodle:erase', point);
    return true;
  }
  if (selectedTool !== 'doodle') return false;
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
  if (isErasing) {
    if (lastErasePoint && Math.hypot(point.x - lastErasePoint.x, point.y - lastErasePoint.y) >= 3) {
      lastErasePoint = point;
      socket.emit('scene:doodle:erase', point);
    }
    return;
  }
  if (!isDrawing || !currentPath) return;
  const previous = currentPath.points[currentPath.points.length - 1];
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.25) return;
  currentPath.points.push(point);
  drawDoodlePath(currentPath);
}

function finishDoodle() {
  if (isErasing) {
    isErasing = false;
    lastErasePoint = null;
    doodleTouchId = null;
    return;
  }
  if (isDrawing && currentPath && currentPath.points.length > 1) socket.emit('scene:doodle:add', currentPath);
  isDrawing = false;
  currentPath = null;
  doodleTouchId = null;
}

function cancelDoodle() {
  if (!isDrawing && !isErasing && doodleTouchId === null) return;
  isDrawing = false;
  isErasing = false;
  currentPath = null;
  lastErasePoint = null;
  doodleTouchId = null;
  if (state?.scene) redrawAllDoodles();
}

function getCanvasPos(event) {
  const rect = doodleCanvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) / mapScale, y: (event.clientY - rect.top) / mapScale };
}

function drawDoodlePath(path) {
  doodleCtx.strokeStyle = path.color;
  doodleCtx.lineWidth = path.width;
  doodleCtx.lineCap = 'round';
  doodleCtx.lineJoin = 'round';
  doodleCtx.beginPath();
  path.points.forEach((point, index) => {
    if (index === 0) doodleCtx.moveTo(point.x, point.y); else doodleCtx.lineTo(point.x, point.y);
  });
  doodleCtx.stroke();
}

function clearDoodleCanvas() {
  doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
}
function redrawAllDoodles() {
  clearDoodleCanvas();
  state.scene.doodlePaths.forEach(path => drawDoodlePath(path));
}
