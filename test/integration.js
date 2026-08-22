const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const project = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'humblewood-integration-'));
const port = 22000 + (process.pid % 10000);
const clients = [];
let serverError = '';

const server = spawn(process.execPath, ['server.js'], {
  cwd: project,
  env: {
    ...process.env,
    PORT: String(port),
    DM_PIN: 'test-pin',
    DATA_DIR: path.join(temp, 'data'),
    UPLOAD_DIR: path.join(temp, 'uploads')
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stderr.on('data', data => { serverError += String(data); });

function serverReady() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server startup timed out.\n${serverError}`)), 5000);
    server.stdout.on('data', data => {
      if (!String(data).includes('running at')) return;
      clearTimeout(timer);
      resolve();
    });
    server.once('exit', code => reject(new Error(`Server exited early (${code}).\n${serverError}`)));
  });
}

function once(socket, event, predicate = () => true, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for ${event}.`));
    }, timeout);
    const handler = data => {
      if (!predicate(data)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(data);
    };
    socket.on(event, handler);
  });
}

async function identify(io, payload) {
  const socket = io(`http://127.0.0.1:${port}`, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  await once(socket, 'connect');
  const resultPromise = once(socket, 'identify:result');
  const statePromise = once(socket, 'state:full');
  socket.emit('identify', payload);
  const result = await resultPromise;
  assert.equal(result.ok, true);
  return { socket, state: await statePromise };
}

async function run() {
  await serverReady();

  for (const route of ['/map', '/characters', '/almanac', '/jukebox', '/dice']) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 200, `${route} should load the frontend shell`);
    const html = await response.text();
    assert.match(html, /The Humblewood Table/);
    assert.match(html, /js\/map-geometry\.js/);
    assert.match(html, /id="zoom-fit"/);
    assert.match(html, /id="spell-form-range"/);
    assert.match(html, /id="spell-form-effect"/);
    assert.match(html, /id="spell-form-attack"/);
    assert.match(html, /id="spell-form-damage"/);
    assert.match(html, /id="spell-preset-select"/);
    assert.match(html, /id="combat-spells"/);
    assert.match(html, /id="view-almanac"/);
    assert.match(html, /id="almanac-search"/);
    assert.match(html, /js\/almanac-data\.js/);
    assert.match(html, /The Humble Almanac/);
    assert.doesNotMatch(html, /Mossbound Almanac/i);
  }
  const routerResponse = await fetch(`http://127.0.0.1:${port}/js/router.js`);
  assert.equal(routerResponse.status, 200);
  assert.match(await routerResponse.text(), /createRouter/);
  const geometryResponse = await fetch(`http://127.0.0.1:${port}/js/map-geometry.js`);
  assert.equal(geometryResponse.status, 200);
  assert.match(await geometryResponse.text(), /gridMeasurement/);
  const characterRulesResponse = await fetch(`http://127.0.0.1:${port}/js/character-rules.js`);
  assert.equal(characterRulesResponse.status, 200);
  assert.match(await characterRulesResponse.text(), /validatePlayerCharacter/);
  const humblewoodMapResponse = await fetch(`http://127.0.0.1:${port}/images/humblewood-expanded-nohex-v0.3.png`);
  assert.equal(humblewoodMapResponse.status, 200);
  assert.match(humblewoodMapResponse.headers.get('content-type') || '', /image\/png/);
  assert((await humblewoodMapResponse.arrayBuffer()).byteLength > 1000000);

  global.window = global;
  global.self = global;
  global.location = { protocol: 'http:', host: `127.0.0.1:${port}` };
  global.navigator = { userAgent: 'node' };
  const io = require('../node_modules/socket.io/client-dist/socket.io.js');

  const dm = await identify(io, { role: 'dm', name: 'Guide', dmPin: 'test-pin' });
  const playerOne = await identify(io, {
    role: 'player', authMode: 'register', username: 'hazel', password: 'password-1', name: 'Hazel'
  });
  const playerTwo = await identify(io, {
    role: 'player', authMode: 'register', username: 'moss', password: 'password-2', name: 'Moss'
  });

  let pending = once(playerOne.socket, 'action:denied', denial => /level.*1 to 20/i.test(denial.message));
  playerOne.socket.emit('character:save', {
    name: 'Impossible Hero',
    fields: {
      species: 'Corvum (birdfolk)', subrace: 'Dusk Corvum', class: 'Rogue', subclass: 'Thief', level: '21',
      str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10'
    }
  });
  await pending;

  pending = once(playerOne.socket, 'scene:update', scene => scene.playerDoodlingEnabled === true);
  dm.socket.emit('scene:setPlayerDoodling', { enabled: true });
  await pending;

  pending = once(playerTwo.socket, 'scene:doodle:add');
  playerOne.socket.emit('scene:doodle:add', {
    color: '#123456', width: 4, points: [{ x: 10, y: 20 }, { x: 30, y: 40 }]
  });
  const playerStroke = await pending;
  assert.equal(playerStroke.authorKey, undefined);

  pending = once(playerTwo.socket, 'action:denied', denial => /drawing stroke/i.test(denial.message));
  playerTwo.socket.emit('scene:doodle:undo');
  await pending;
  pending = once(playerTwo.socket, 'scene:doodle:redrawAll', paths => paths.length === 0);
  playerOne.socket.emit('scene:doodle:undo');
  await pending;
  pending = once(playerOne.socket, 'scene:doodle:add');
  dm.socket.emit('scene:doodle:add', { color: '#abcdef', points: [{ x: 1, y: 2 }, { x: 5, y: 8 }] });
  await pending;

  pending = once(playerOne.socket, 'action:denied', denial => /only the dungeon master can control fog/i.test(denial.message));
  playerOne.socket.emit('scene:setFog', { enabled: true });
  await pending;
  pending = once(playerOne.socket, 'scene:fog:update', fog => fog.enabled === true);
  dm.socket.emit('scene:setFog', { enabled: true });
  await pending;
  pending = once(playerOne.socket, 'scene:fog:update', fog => fog.shapes.length === 1);
  dm.socket.emit('scene:fog:add', { mode: 'reveal', x: 50, y: 60, width: 100, height: 120 });
  assert.equal((await pending).shapes[0].mode, 'reveal');

  pending = once(playerOne.socket, 'scene:update', scene => scene.showTokenLabelsToPlayers === false);
  dm.socket.emit('scene:setTokenLabels', { visible: false });
  await pending;

  pending = once(dm.socket, 'token:add', token => token.label === 'Wolf');
  dm.socket.emit('token:add', {
    label: 'Wolf', kind: 'npc', x: 25, y: 25, hp: 12, maxHp: 12, ac: 13, initiativeModifier: 2
  });
  const wolf = await pending;
  pending = once(playerOne.socket, 'action:denied', denial => /only the dungeon master can duplicate/i.test(denial.message));
  playerOne.socket.emit('token:duplicate', { id: wolf.id });
  await pending;
  pending = once(dm.socket, 'token:add', token => token.kind === 'npc' && token.id !== wolf.id);
  dm.socket.emit('token:duplicate', { id: wolf.id });
  const duplicate = await pending;
  assert.equal(duplicate.label, 'Wolf 2');
  assert.notEqual(duplicate.npcId, wolf.npcId);
  assert.equal(duplicate.x, wolf.x + 50);

  pending = once(playerOne.socket, 'token:update', token => token.id === duplicate.id && token.combat?.conditions?.includes('Prone'));
  dm.socket.emit('token:combat:update', { id: duplicate.id, action: 'condition:toggle', condition: 'Prone' });
  await pending;

  pending = once(dm.socket, 'initiative:update', initiative => initiative.entries.length === 1);
  dm.socket.emit('initiative:add', { name: 'Wolf', value: 18, tokenId: wolf.id });
  await pending;
  pending = once(dm.socket, 'initiative:update', initiative => initiative.entries.length === 2);
  dm.socket.emit('initiative:add', { name: 'Wolf 2', value: 12, tokenId: duplicate.id });
  let initiative = await pending;
  const wolfEntry = initiative.entries.find(entry => entry.tokenId === wolf.id);
  const duplicateEntry = initiative.entries.find(entry => entry.tokenId === duplicate.id);
  pending = once(playerOne.socket, 'action:denied', denial => /only the dungeon master can edit initiative/i.test(denial.message));
  playerOne.socket.emit('initiative:edit', { id: wolfEntry.id, value: 99 });
  await pending;
  pending = once(dm.socket, 'initiative:update', value => value.entries.find(entry => entry.id === wolfEntry.id)?.value === 21);
  dm.socket.emit('initiative:edit', { id: wolfEntry.id, value: 21 });
  await pending;
  pending = once(dm.socket, 'initiative:update', value => value.entries[0]?.id === duplicateEntry.id);
  dm.socket.emit('initiative:reorder', { orderedIds: [duplicateEntry.id, wolfEntry.id] });
  initiative = await pending;
  assert.deepEqual(initiative.entries.map(entry => entry.id), [duplicateEntry.id, wolfEntry.id]);

  pending = once(dm.socket, 'pointer:move', pointer => pointer.name === 'Hazel' && pointer.x === 111);
  playerOne.socket.emit('pointer:move', { x: 111, y: 222 });
  assert.equal((await pending).y, 222);
  pending = once(dm.socket, 'pointer:ping', pointer => pointer.name === 'Moss' && pointer.x === 333);
  playerTwo.socket.emit('pointer:ping', { x: 333, y: 444 });
  assert.equal((await pending).y, 444);

  pending = once(playerOne.socket, 'scene:dirty', value => value.dirty === false);
  const saved = once(dm.socket, 'scene:saved', scene => scene.name === 'HumbleBar');
  dm.socket.emit('scene:save', { name: 'HumbleBar' });
  await Promise.all([pending, saved]);
  pending = once(playerOne.socket, 'scene:dirty', value => value.dirty === true);
  dm.socket.emit('scene:fog:reset');
  await pending;
  pending = once(playerOne.socket, 'state:full', value => value.activeSceneName === 'HumbleBar');
  dm.socket.emit('scene:load', { name: 'HumbleBar' });
  const restored = await pending;
  assert.equal(restored.sceneDirty, false);
  assert.equal(restored.scene.fogEnabled, true);
  assert.equal(restored.scene.fogShapes.length, 1);
  assert.equal(restored.scene.doodlePaths.length, 1);
  assert.equal(restored.scene.showTokenLabelsToPlayers, false);
  assert.equal(restored.tokens.length, 2);
  assert.deepEqual(restored.initiative.entries.map(entry => entry.id), [duplicateEntry.id, wolfEntry.id]);
  assert.equal(restored.savedScenes.length, 0);
  assert.deepEqual(restored.npcs, {});

  console.log('Integration checks passed: frontend routes, permissions, drawings, fog, token duplication, badges, initiative editing, pointers, and scene persistence.');
}

run().catch(error => {
  console.error(error.stack);
  process.exitCode = 1;
}).finally(() => {
  clients.forEach(client => client.close());
  server.kill('SIGTERM');
  const cleanupTimer = setTimeout(() => server.kill('SIGKILL'), 3000);
  server.once('exit', () => {
    clearTimeout(cleanupTimer);
    fs.rmSync(temp, { recursive: true, force: true });
  });
});
