/** Shared player doodle corner canvas. */
const doodleCornerCanvas = document.getElementById('doodle-corner-canvas') as HTMLCanvasElement;
const doodleCornerContext = doodleCornerCanvas.getContext('2d');
let doodleCornerDrawing = false;
let doodleCornerPath: any = null;
let doodleCornerErasing = false;
let doodleCornerLastErasePoint: any = null;
let doodleCornerOpen = false;
let doodleCornerTool = 'draw';
let doodleCornerDrag: any = null;

const doodleCornerPanel = document.getElementById('doodle-corner');
const doodleCornerToggle = document.getElementById('doodle-corner-toggle');
const doodleCornerDragHandle = document.getElementById('doodle-corner-drag-handle');
const doodleCornerDrawButton = document.getElementById('doodle-corner-draw-btn');
const doodleCornerEraserButton = document.getElementById('doodle-corner-eraser-btn');

function setDoodleCornerOpen(open) {
  doodleCornerOpen = !!open;
  doodleCornerPanel.classList.toggle('hidden', !doodleCornerOpen);
  doodleCornerToggle.setAttribute('aria-expanded', String(doodleCornerOpen));
}

function setDoodleCornerTool(tool) {
  doodleCornerTool = tool === 'eraser' ? 'eraser' : 'draw';
  doodleCornerDrawButton.classList.toggle('active', doodleCornerTool === 'draw');
  doodleCornerEraserButton.classList.toggle('active', doodleCornerTool === 'eraser');
  doodleCornerCanvas.classList.toggle('erasing', doodleCornerTool === 'eraser');
}

function renderDoodleCorner() {
  if (!doodleCornerContext || !state) return;
  doodleCornerContext.clearRect(0, 0, doodleCornerCanvas.width, doodleCornerCanvas.height);
  (state.scene.doodleCornerPaths || []).forEach(path => drawDoodleCornerPath(path));
}

function drawDoodleCornerPath(path) {
  if (!doodleCornerContext || !Array.isArray(path?.points) || path.points.length < 2) return;
  doodleCornerContext.strokeStyle = path.color || '#d98a9e';
  doodleCornerContext.lineWidth = Number(path.width) || 3;
  doodleCornerContext.lineCap = 'round';
  doodleCornerContext.lineJoin = 'round';
  doodleCornerContext.beginPath();
  path.points.forEach((point, index) => {
    if (index === 0) doodleCornerContext.moveTo(point.x, point.y);
    else doodleCornerContext.lineTo(point.x, point.y);
  });
  doodleCornerContext.stroke();
}

function doodleCornerPoint(event) {
  const rect = doodleCornerCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * doodleCornerCanvas.width / rect.width,
    y: (event.clientY - rect.top) * doodleCornerCanvas.height / rect.height
  };
}

doodleCornerCanvas.onpointerdown = event => {
  if (!state || !joined) return;
  event.preventDefault();
  if (doodleCornerTool === 'eraser') {
    doodleCornerErasing = true;
    doodleCornerLastErasePoint = doodleCornerPoint(event);
    doodleCornerCanvas.setPointerCapture(event.pointerId);
    socket.emit('scene:doodleCorner:erase', doodleCornerLastErasePoint);
    return;
  }
  doodleCornerDrawing = true;
  doodleCornerCanvas.setPointerCapture(event.pointerId);
  doodleCornerPath = {
    color: document.getElementById('doodle-corner-color').value,
    width: 3,
    points: [doodleCornerPoint(event)]
  };
};

doodleCornerCanvas.onpointermove = event => {
  if (doodleCornerErasing) {
    const point = doodleCornerPoint(event);
    if (Math.hypot(point.x - doodleCornerLastErasePoint.x, point.y - doodleCornerLastErasePoint.y) >= 3) {
      doodleCornerLastErasePoint = point;
      socket.emit('scene:doodleCorner:erase', point);
    }
    return;
  }
  if (!doodleCornerDrawing || !doodleCornerPath) return;
  const point = doodleCornerPoint(event);
  const previous = doodleCornerPath.points[doodleCornerPath.points.length - 1];
  if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1) return;
  doodleCornerPath.points.push(point);
  drawDoodleCornerPath(doodleCornerPath);
};

function finishDoodleCorner(event) {
  if (doodleCornerErasing) {
    doodleCornerErasing = false;
    doodleCornerLastErasePoint = null;
    if (event) doodleCornerCanvas.releasePointerCapture?.(event.pointerId);
    return;
  }
  if (!doodleCornerDrawing || !doodleCornerPath) return;
  doodleCornerDrawing = false;
  if (doodleCornerPath.points.length > 1) socket.emit('scene:doodleCorner:add', doodleCornerPath);
  doodleCornerPath = null;
  if (event) doodleCornerCanvas.releasePointerCapture?.(event.pointerId);
}

doodleCornerCanvas.onpointerup = finishDoodleCorner;
doodleCornerCanvas.onpointercancel = finishDoodleCorner;
doodleCornerDrawButton.onclick = () => setDoodleCornerTool('draw');
doodleCornerEraserButton.onclick = () => setDoodleCornerTool('eraser');
doodleCornerToggle.onclick = () => setDoodleCornerOpen(!doodleCornerOpen);
document.getElementById('doodle-corner-undo-btn').onclick = () => socket.emit('scene:doodleCorner:undo');
document.getElementById('doodle-corner-clear-btn').onclick = () => socket.emit('scene:doodleCorner:clear');

doodleCornerDragHandle.onpointerdown = event => {
  if (event.target.closest('button, input')) return;
  const rect = doodleCornerPanel.getBoundingClientRect();
  doodleCornerPanel.style.position = 'fixed';
  doodleCornerPanel.style.left = `${rect.left}px`;
  doodleCornerPanel.style.top = `${rect.top}px`;
  doodleCornerPanel.style.margin = '0';
  doodleCornerDrag = { clientX: event.clientX, clientY: event.clientY, left: rect.left, top: rect.top };
  doodleCornerDragHandle.setPointerCapture(event.pointerId);
};
doodleCornerDragHandle.onpointermove = event => {
  if (!doodleCornerDrag) return;
  doodleCornerPanel.style.left = `${doodleCornerDrag.left + event.clientX - doodleCornerDrag.clientX}px`;
  doodleCornerPanel.style.top = `${doodleCornerDrag.top + event.clientY - doodleCornerDrag.clientY}px`;
};
doodleCornerDragHandle.onpointerup = () => { doodleCornerDrag = null; };
doodleCornerDragHandle.onpointercancel = () => { doodleCornerDrag = null; };

socket.on('scene:doodleCorner:add', path => {
  if (!state) return;
  state.scene.doodleCornerPaths.push(path);
  drawDoodleCornerPath(path);
});
socket.on('scene:doodleCorner:redrawAll', paths => {
  if (!state) return;
  state.scene.doodleCornerPaths = Array.isArray(paths) ? paths : [];
  renderDoodleCorner();
});
socket.on('scene:doodleCorner:clear', () => {
  if (!state) return;
  state.scene.doodleCornerPaths = [];
  renderDoodleCorner();
});
