const http = require('http');
const { Server } = require('socket.io');
const { loadConfig } = require('./src/server/config');
const { createHttpApp } = require('./src/server/http-app');
const { createRoom } = require('./src/server/room');
const { registerSocketHandlers } = require('./src/server/socket');

const config = loadConfig(__dirname);
const app = createHttpApp(config);
const server = http.createServer(app);
const io = new Server(server);
const room = createRoom({ dataDir: config.dataDir, uploadDir: config.uploadDir, dmPin: config.dmPin, io });

registerSocketHandlers(io, room);

room.ready.then(() => {
  server.listen(config.port, () => {
    console.log(`Humblewood Table running at http://localhost:${config.port}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await room.flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
