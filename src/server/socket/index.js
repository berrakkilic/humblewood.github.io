const { registerAuthHandlers } = require('./auth');
const { registerCharacterHandlers } = require('./characters');
const { registerInitiativeHandlers } = require('./initiative');
const { registerJukeboxHandlers } = require('./jukebox');
const { registerLibraryHandlers } = require('./library');
const { registerPresenceHandlers } = require('./presence');
const { registerRollHandlers } = require('./rolls');
const { registerSceneHandlers } = require('./scenes');
const { registerTokenHandlers } = require('./tokens');

function registerSocketHandlers(io, room) {
  io.on('connection', socket => {
    registerAuthHandlers(socket, room);
    registerSceneHandlers(socket, room);
    registerTokenHandlers(socket, room);
    registerJukeboxHandlers(socket, room);
    registerLibraryHandlers(socket, room);
    registerCharacterHandlers(socket, room);
    registerRollHandlers(socket, room);
    registerInitiativeHandlers(socket, room);
    registerPresenceHandlers(socket, room);
  });
}

module.exports = { registerSocketHandlers };
