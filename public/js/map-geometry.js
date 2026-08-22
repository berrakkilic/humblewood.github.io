(function attachMapGeometry(global) {
  const MIN_SCALE = 0.05;
  const MAX_SCALE = 4;

  function clampScale(value) {
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, Number(value) || 1));
  }

  function zoomAroundPoint({ pan, scale, nextScale, anchor }) {
    const clampedScale = clampScale(nextScale);
    const stagePoint = {
      x: (anchor.x - pan.x) / scale,
      y: (anchor.y - pan.y) / scale
    };
    return {
      scale: clampedScale,
      pan: {
        x: anchor.x - stagePoint.x * clampedScale,
        y: anchor.y - stagePoint.y * clampedScale
      }
    };
  }

  function positionStagePoint({ stagePoint, anchor, nextScale }) {
    const scale = clampScale(nextScale);
    return {
      scale,
      pan: {
        x: anchor.x - stagePoint.x * scale,
        y: anchor.y - stagePoint.y * scale
      }
    };
  }

  function fitStageInViewport({ stageWidth, stageHeight, viewportWidth, viewportHeight, padding = 24 }) {
    if (!stageWidth || !stageHeight || !viewportWidth || !viewportHeight) {
      return { scale: 1, pan: { x: 0, y: 0 } };
    }
    const availableWidth = Math.max(1, viewportWidth - padding * 2);
    const availableHeight = Math.max(1, viewportHeight - padding * 2);
    const scale = clampScale(Math.min(availableWidth / stageWidth, availableHeight / stageHeight));
    return {
      scale,
      pan: {
        x: (viewportWidth - stageWidth * scale) / 2,
        y: (viewportHeight - stageHeight * scale) / 2
      }
    };
  }

  function snapCoordinateToCell(value, gridSize, gridOffset = 0) {
    const size = Math.max(1, Number(gridSize) || 1);
    const offset = Number(gridOffset) || 0;
    return Math.floor(((Number(value) || 0) - offset) / size) * size + size / 2 + offset;
  }

  function gridMeasurement(start, end, gridSize, gridOffsetX = 0, gridOffsetY = 0) {
    const size = Math.max(1, Number(gridSize) || 1);
    const offsetX = Number(gridOffsetX) || 0;
    const offsetY = Number(gridOffsetY) || 0;
    const startCell = {
      x: Math.floor((start.x - offsetX) / size),
      y: Math.floor((start.y - offsetY) / size)
    };
    const endCell = {
      x: Math.floor((end.x - offsetX) / size),
      y: Math.floor((end.y - offsetY) / size)
    };
    const horizontalSquares = Math.abs(endCell.x - startCell.x);
    const verticalSquares = Math.abs(endCell.y - startCell.y);
    const squares = horizontalSquares + verticalSquares;
    return {
      horizontalSquares,
      verticalSquares,
      squares,
      feet: squares * 5,
      start: {
        x: startCell.x * size + size / 2 + offsetX,
        y: startCell.y * size + size / 2 + offsetY
      },
      end: {
        x: endCell.x * size + size / 2 + offsetX,
        y: endCell.y * size + size / 2 + offsetY
      }
    };
  }

  global.HumblewoodMapGeometry = {
    MAX_SCALE,
    MIN_SCALE,
    clampScale,
    fitStageInViewport,
    gridMeasurement,
    positionStagePoint,
    snapCoordinateToCell,
    zoomAroundPoint
  };
})(window);
