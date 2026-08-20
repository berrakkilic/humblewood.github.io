function createDefaultState() {
  return {
    scene: {
      mapUrl: null,
      mapName: 'No map loaded',
      gridSize: 50,
      gridVisible: false,
      fitTokensToGrid: true,
      playerDoodlingEnabled: false,
      showTokenLabelsToPlayers: true,
      fogEnabled: false,
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
    characters: {},
    rollLog: [],
    initiative: { entries: [], round: 1, currentIndex: -1 }
  };
}

module.exports = { createDefaultState };
