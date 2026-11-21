const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRoom } = require('../src/server/room');

async function run() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'humblewood-room-state-'));
  const dataDir = path.join(temp, 'data');
  const uploadDir = path.join(temp, 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  const room = createRoom({
    dataDir,
    uploadDir,
    dmPin: 'test-pin',
    io: { emit() {} }
  });

  await room.db.execute('CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT)');
  await room.db.execute({
    sql: 'INSERT INTO state (id, data) VALUES (1, ?)',
    args: [JSON.stringify({
      scene: { mapUrl: '/uploads/missing-map.png' },
      library: {
        folders: [],
        files: [{ id: 'missing-file', name: 'Missing file', url: '/uploads/missing-file.pdf' }]
      },
      characters: {
        Wren: { name: 'Wren', portraitUrl: '/uploads/missing-portrait.png', fields: {} }
      },
      npcs: {
        missingNpc: { id: 'missingNpc', name: 'Missing NPC', imageUrl: '/uploads/missing-npc.png' }
      },
      tokens: [{ id: 'missing-token', label: 'Missing token', imageUrl: '/uploads/missing-token.png' }]
    })]
  });

  await room.ready;
  assert.equal(room.state.scene.mapUrl, null);
  assert.equal(room.state.library.files.length, 0);
  assert.equal(room.state.characters.Wren.portraitUrl, null);
  assert.equal(room.state.npcs.missingNpc.imageUrl, null);
  assert.equal(room.state.tokens[0].imageUrl, null);

  await room.close();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      fs.rmSync(temp, { recursive: true, force: true });
      break;
    } catch (error) {
      if (error.code !== 'EPERM' || attempt === 19) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  console.log('Room state checks passed: missing local uploads are pruned during restore.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
