const { registerAuthHandlers } = require('./auth');
const { registerCharacterHandlers } = require('./characters');
const { registerInitiativeHandlers } = require('./initiative');
const { registerJukeboxHandlers } = require('./jukebox');
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
    registerCharacterHandlers(socket, room);
    registerRollHandlers(socket, room);
    registerInitiativeHandlers(socket, room);
    registerPresenceHandlers(socket, room);
  });
}

module.exports = { registerSocketHandlers };
