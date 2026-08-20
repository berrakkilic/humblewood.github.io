const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const window = {};
const source = fs.readFileSync(path.resolve(__dirname, '../public/js/map-geometry.js'), 'utf8');
vm.runInNewContext(source, { window });
const geometry = window.HumblewoodMapGeometry;

const zoomed = geometry.zoomAroundPoint({
  pan: { x: 10, y: 20 },
  scale: 1,
  nextScale: 2,
  anchor: { x: 100, y: 100 }
});
assert.equal(zoomed.scale, 2);
assert.deepEqual({ ...zoomed.pan }, { x: -80, y: -60 });

const pinched = geometry.positionStagePoint({
  stagePoint: { x: 90, y: 80 },
  anchor: { x: 120, y: 110 },
  nextScale: 2
});
assert.equal(pinched.scale, 2);
assert.deepEqual({ ...pinched.pan }, { x: -60, y: -50 });

const fitted = geometry.fitStageInViewport({
  stageWidth: 2000,
  stageHeight: 1000,
  viewportWidth: 1000,
  viewportHeight: 800,
  padding: 40
});
assert.equal(fitted.scale, 0.46);
assert.deepEqual({ ...fitted.pan }, { x: 40, y: 170 });

const horizontal = geometry.gridMeasurement({ x: 10, y: 10 }, { x: 110, y: 10 }, 50);
assert.equal(horizontal.squares, 2);
assert.equal(horizontal.feet, 10);

const diagonal = geometry.gridMeasurement({ x: 10, y: 10 }, { x: 60, y: 60 }, 50);
assert.equal(diagonal.horizontalSquares, 1);
assert.equal(diagonal.verticalSquares, 1);
assert.equal(diagonal.squares, 2);
assert.equal(diagonal.feet, 10);
assert.deepEqual({ ...diagonal.start }, { x: 25, y: 25 });
assert.deepEqual({ ...diagonal.end }, { x: 75, y: 75 });

console.log('Map geometry checks passed: anchored wheel/pinch zoom, fit-to-view, and square-counting ruler.');
