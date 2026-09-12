const { initialShopStock } = require('./shop-catalog');

function createDefaultState() {
  return {
    scene: {
      mapUrl: null,
      mapName: 'No map loaded',
      gridSize: 50,
      gridOffsetX: 0,
      gridOffsetY: 0,
      gridVisible: false,
      gridColor: '#3a2e25',
      snapToGrid: true,
      fitTokensToGrid: true,
      playerDoodlingEnabled: false,
      showTokenLabelsToPlayers: true,
      fogEnabled: true,
      fogShapes: [],
      doodlePaths: []
    },
    tokens: [],
    npcs: {},
    savedScenes: {},
    activeSceneName: null,
    sceneDirty: false,
    jukebox: {
      playlist: [],
      currentIndex: -1,
      isPlaying: false,
      startedAt: 0,
      seek: 0
    },
    library: {
      folders: [],
      files: [],
      broadcast: null
    },
    notifications: [],
    characters: {},
    shopStock: initialShopStock(),
    rollLog: [],
    initiative: { entries: [], round: 1, currentIndex: -1 }
  };
}

module.exports = { createDefaultState };
