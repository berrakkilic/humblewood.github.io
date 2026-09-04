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

function expectNoEvent(socket, event, predicate = () => true, timeout = 350) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      resolve();
    }, timeout);
    const handler = data => {
      if (!predicate(data)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      reject(new Error(`Unexpected ${event}: ${JSON.stringify(data)}`));
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

  for (const route of ['/map', '/characters', '/almanac', '/jukebox', '/library', '/dice']) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 200, `${route} should load the frontend shell`);
    const html = await response.text();
    assert.match(html, /The Humblewood Table/);
    assert.match(html, /js\/map-geometry\.js/);
    assert.match(html, /js\/combat-state\.js/);
    assert.match(html, /id="zoom-fit"/);
    assert.match(html, /id="spell-form-range"/);
    assert.match(html, /id="spell-form-effect"/);
    assert.match(html, /id="spell-form-attack"/);
    assert.match(html, /id="spell-form-damage"/);
    assert.match(html, /id="spell-preset-select"/);
    assert.match(html, /id="dm-private-roll-toggle"/);
    assert.match(html, /id="dm-private-roll-banner"/);
    assert.match(html, /id="new-npc-sheet-btn"/);
    assert.match(html, /id="npc-statblock-import-btn"/);
    assert.match(html, /id="npc-directory-search"/);
    assert.match(html, /id="npc-directory-race-filters"/);
    assert.match(html, /id="npc-directory-class-filter"/);
    assert.match(html, /id="npc-roster-search"/);
    assert.match(html, /id="sf-pronouns"/);
    assert.match(html, /id="token-pronouns"/);
    assert.match(html, /id="track-preset-select"/);
    assert.match(html, /id="track-file"/);
    assert.match(html, /id="library-file-input"/);
    assert.match(html, /id="library-folder-list"/);
    assert.match(html, /id="shared-handout-overlay"/);
    assert.match(html, /id="attack-preset-select"/);
    assert.match(html, /js\/phb-spell-presets\.js/);
    assert.match(html, /js\/creation-presets\.js/);
    assert.match(html, /id="combat-spells"/);
    assert.match(html, /id="level-up-overlay"/);
    assert.match(html, /id="level-up-btn"/);
    assert.match(html, /id="sf-ac-method"/);
    assert.match(html, /id="sf-spells-prepared"/);
    assert.match(html, /id="view-almanac"/);
    assert.match(html, /id="almanac-search"/);
    assert.match(html, /js\/almanac-data\.js/);
    assert.match(html, /The Humble Almanac/);
    assert.doesNotMatch(html, /Mossbound Almanac/i);
  }
  const appSource = await (await fetch(`http://127.0.0.1:${port}/app.js`)).text();
  assert.match(appSource, /function tokenHoverText\(token\)/);
  assert.match(appSource, /Pronouns: \$\{pronouns\}/);
  assert.match(appSource, /function uploadAudioFile\(file\)/);
  assert.match(appSource, /fetch\('\/api\/music'\)/);
  assert.match(appSource, /function renderLibrary\(\)/);
  assert.match(appSource, /library:broadcast/);
  assert.match(appSource, /function uploadLibraryFile\(file\)/);
  assert.match(appSource, /function npcDirectoryMatches\(npc\)/);
  assert.match(appSource, /npcRaceFilter/);
  const musicResponse = await fetch(`http://127.0.0.1:${port}/api/music`);
  assert.equal(musicResponse.status, 200);
  const musicCatalog = await musicResponse.json();
  assert(musicCatalog.tracks.some(track => track.url === '/music/farm.mp3' && track.source === 'Built-in'));
  const badUpload = new FormData();
  badUpload.append('file', new Blob(['not an mp3'], { type: 'text/plain' }), 'notes.txt');
  const badUploadResponse = await fetch(`http://127.0.0.1:${port}/api/upload/audio`, {
    method: 'POST', body: badUpload
  });
  assert.equal(badUploadResponse.status, 400);
  const audioUpload = new FormData();
  audioUpload.append('file', new Blob(['fake mp3 bytes'], { type: 'audio/mpeg' }), 'uploaded-forest.mp3');
  const audioUploadResponse = await fetch(`http://127.0.0.1:${port}/api/upload/audio`, {
    method: 'POST', body: audioUpload
  });
  assert.equal(audioUploadResponse.status, 200);
  const uploadedAudio = await audioUploadResponse.json();
  assert.match(uploadedAudio.url, /^\/uploads\/\d+-uploaded-forest\.mp3$/);
  const uploadedTrackResponse = await fetch(`http://127.0.0.1:${port}${uploadedAudio.url}`);
  assert.equal(uploadedTrackResponse.status, 200);
  const updatedMusicCatalog = await (await fetch(`http://127.0.0.1:${port}/api/music`)).json();
  assert(updatedMusicCatalog.tracks.some(track => track.url === uploadedAudio.url && track.source === 'Uploaded'));
  const unsupportedLibraryUpload = new FormData();
  unsupportedLibraryUpload.append('file', new Blob(['binary'], { type: 'application/octet-stream' }), 'archive.zip');
  const unsupportedLibraryResponse = await fetch(`http://127.0.0.1:${port}/api/upload/library`, {
    method: 'POST', body: unsupportedLibraryUpload
  });
  assert.equal(unsupportedLibraryResponse.status, 400);
  const libraryUpload = new FormData();
  libraryUpload.append('file', new Blob(['A secret clue'], { type: 'text/plain' }), 'secret-clue.txt');
  const libraryUploadResponse = await fetch(`http://127.0.0.1:${port}/api/upload/library`, {
    method: 'POST', body: libraryUpload
  });
  assert.equal(libraryUploadResponse.status, 200);
  const uploadedLibrary = await libraryUploadResponse.json();
  assert.match(uploadedLibrary.url, /^\/uploads\/\d+-secret-clue\.txt$/);
  assert.equal((await (await fetch(`http://127.0.0.1:${port}${uploadedLibrary.url}`)).text()), 'A secret clue');
  const routerResponse = await fetch(`http://127.0.0.1:${port}/js/router.js`);
  assert.equal(routerResponse.status, 200);
  assert.match(await routerResponse.text(), /createRouter/);
  const geometryResponse = await fetch(`http://127.0.0.1:${port}/js/map-geometry.js`);
  assert.equal(geometryResponse.status, 200);
  assert.match(await geometryResponse.text(), /gridMeasurement/);
  const combatStateResponse = await fetch(`http://127.0.0.1:${port}/js/combat-state.js`);
  assert.equal(combatStateResponse.status, 200);
  assert.match(await combatStateResponse.text(), /toggleCondition/);
  const characterRulesResponse = await fetch(`http://127.0.0.1:${port}/js/character-rules.js`);
  assert.equal(characterRulesResponse.status, 200);
  const characterRulesSource = await characterRulesResponse.text();
  assert.match(characterRulesSource, /validatePlayerCharacter/);
  assert.match(characterRulesSource, /levelUpGains/);
  assert.match(characterRulesSource, /spellSlotsFor/);
  assert.match(characterRulesSource, /armorClass/);
  assert.match(characterRulesSource, /automaticClassFeatureText/);
  const creationPresetsResponse = await fetch(`http://127.0.0.1:${port}/js/creation-presets.js`);
  assert.equal(creationPresetsResponse.status, 200);
  assert.match(await creationPresetsResponse.text(), /parseStatBlock/);
  const phbSpellPresetsResponse = await fetch(`http://127.0.0.1:${port}/js/phb-spell-presets.js`);
  assert.equal(phbSpellPresetsResponse.status, 200);
  const phbSpellPresetsSource = await phbSpellPresetsResponse.text();
  assert.match(phbSpellPresetsSource, /Goodberry/);
  assert.match(phbSpellPresetsSource, /Player's Handbook \(2014\)/);
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
  assert.equal(dm.state.scene.fogEnabled, true);
  assert.equal(dm.state.scene.snapToGrid, true);
  const playerOne = await identify(io, {
    role: 'player', authMode: 'register', username: 'hazel', password: 'password-1', name: 'Hazel'
  });
  const playerTwo = await identify(io, {
    role: 'player', authMode: 'register', username: 'moss', password: 'password-2', name: 'Moss'
  });
  let pending;
  assert.equal(dm.state.library.broadcast, null);
  assert.equal(playerOne.state.library.broadcast, null);
  assert.equal(playerOne.state.library.files, undefined, 'Players must not receive the private library catalogue');

  pending = once(dm.socket, 'library:update', library => library.folders.some(folder => folder.name === 'Puzzles'));
  dm.socket.emit('library:folder:create', { name: 'Puzzles' });
  const libraryWithFolder = await pending;
  const puzzlesFolder = libraryWithFolder.folders.find(folder => folder.name === 'Puzzles');
  assert(puzzlesFolder);
  pending = once(dm.socket, 'library:update', library => library.files.some(file => file.name === 'secret-clue.txt'));
  const playerLibraryUpdate = expectNoEvent(playerOne.socket, 'library:update');
  dm.socket.emit('library:file:add', {
    name: uploadedLibrary.name, url: uploadedLibrary.url, mimeType: uploadedLibrary.mimeType,
    size: uploadedLibrary.size, folderId: puzzlesFolder.id
  });
  const libraryWithFile = await pending;
  await playerLibraryUpdate;
  const clueFile = libraryWithFile.files.find(file => file.name === 'secret-clue.txt');
  assert.equal(clueFile.folderId, puzzlesFolder.id);
  const playerBroadcastPromise = once(playerOne.socket, 'library:broadcast', broadcast => broadcast?.fileId === clueFile.id);
  const dmBroadcastPromise = once(dm.socket, 'library:broadcast', broadcast => broadcast?.fileId === clueFile.id);
  dm.socket.emit('library:broadcast', { fileId: clueFile.id, duration: 60 });
  const [playerBroadcast, dmBroadcast] = await Promise.all([playerBroadcastPromise, dmBroadcastPromise]);
  assert.equal(playerBroadcast.name, 'secret-clue.txt');
  assert.equal(playerBroadcast.kind, 'text');
  assert(dmBroadcast.expiresAt > dmBroadcast.startedAt);
  assert.equal(dm.state.scene.mapName, 'No map loaded', 'Broadcasting must not replace the active scene');
  pending = once(playerTwo.socket, 'library:broadcast', broadcast => broadcast === null);
  dm.socket.emit('library:broadcast:clear');
  await pending;

  pending = once(playerOne.socket, 'action:denied', denial => /only the dungeon master can make private rolls/i.test(denial.message));
  playerOne.socket.emit('roll:make', { count: 1, sides: 20, private: true, label: 'Forbidden private roll' });
  await pending;

  const hiddenRandomFromPlayerOne = expectNoEvent(playerOne.socket, 'roll:made', entry => entry.label === 'Secret weather roll');
  const hiddenRandomFromPlayerTwo = expectNoEvent(playerTwo.socket, 'roll:made', entry => entry.label === 'Secret weather roll');
  const hiddenRandomFromSharedDmLog = expectNoEvent(dm.socket, 'roll:made', entry => entry.label === 'Secret weather roll');
  const privateRandomPromise = once(dm.socket, 'roll:private', entry => entry.label === 'Secret weather roll');
  dm.socket.emit('roll:make', {
    count: 1, sides: 20, modifier: 3, private: true, label: 'Secret weather roll', initiativeName: 'Secret weather'
  });
  const privateRandom = await privateRandomPromise;
  assert.equal(privateRandom.private, true);
  assert.equal(privateRandom.name, 'Guide');
  await Promise.all([hiddenRandomFromPlayerOne, hiddenRandomFromPlayerTwo, hiddenRandomFromSharedDmLog]);

  pending = once(playerOne.socket, 'roll:made', entry => entry.label === 'Public weather roll');
  dm.socket.emit('roll:make', { count: 1, sides: 6, private: false, label: 'Public weather roll' });
  assert.equal((await pending).name, 'Guide');

  pending = once(playerOne.socket, 'action:denied', denial => /level.*1 to 20/i.test(denial.message));
  playerOne.socket.emit('character:save', {
    name: 'Impossible Hero',
    fields: {
      species: 'Corvum (birdfolk)', subrace: 'Dusk Corvum', class: 'Rogue', subclass: 'Thief', level: '21',
      str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10'
    }
  });
  await pending;

  const characterSavedPromise = once(playerOne.socket, 'character:update', character => character.name === 'Hazel Finch');
  playerOne.socket.emit('character:save', {
    name: 'Hazel Finch',
    pronouns: 'they/them',
    fields: {
      name: 'Hazel Finch', pronouns: 'they/them', species: 'Corvum (birdfolk)', subrace: 'Dusk Corvum',
      class: 'Rogue', subclass: 'Thief', level: '1', hp: '10', maxhp: '10', ac: '13',
      str: '10', dex: '16', con: '10', int: '10', wis: '10', cha: '10'
    }
  });
  const hazelFinch = await characterSavedPromise;
  assert.equal(hazelFinch.pronouns, 'they/them');
  assert.equal(hazelFinch.fields.pronouns, 'they/them');

  const pcTokenForDmPromise = once(dm.socket, 'token:add', token => token.characterName === 'Hazel Finch');
  const pcTokenForPlayerTwoPromise = once(playerTwo.socket, 'token:add', token => token.characterName === 'Hazel Finch');
  playerOne.socket.emit('token:add', { characterName: 'Hazel Finch' });
  const [hazelToken, playerHazelToken] = await Promise.all([pcTokenForDmPromise, pcTokenForPlayerTwoPromise]);
  assert.equal(playerHazelToken.pronouns, 'they/them');
  pending = once(playerTwo.socket, 'token:remove', removed => removed.id === hazelToken.id);
  playerOne.socket.emit('token:remove', { id: hazelToken.id });
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
  const playerWolfPromise = once(playerOne.socket, 'token:add', token => token.label === 'Wolf');
  dm.socket.emit('token:add', {
    label: 'Wolf', pronouns: 'it/its', kind: 'npc', x: 25, y: 25, hp: 12, maxHp: 12, ac: 13, initiativeModifier: 2
  });
  const wolf = await pending;
  const playerWolf = await playerWolfPromise;
  assert.equal(playerWolf.pronouns, 'it/its');
  pending = once(playerOne.socket, 'action:denied', denial => /only the dungeon master can duplicate/i.test(denial.message));
  playerOne.socket.emit('token:duplicate', { id: wolf.id });
  await pending;
  pending = once(dm.socket, 'token:add', token => token.kind === 'npc' && token.id !== wolf.id);
  dm.socket.emit('token:duplicate', { id: wolf.id });
  const duplicate = await pending;
  assert.equal(duplicate.label, 'Wolf 2');
  assert.equal(duplicate.pronouns, 'it/its');
  assert.notEqual(duplicate.npcId, wolf.npcId);
  assert.equal(duplicate.x, wolf.x + 50);

  const npcRosterPromise = once(dm.socket, 'npcs:update', npcs => Object.values(npcs).some(npc => npc.name === 'Ash Mage'));
  const npcSavedPromise = once(dm.socket, 'npc:saved', result => result.name === 'Ash Mage');
  dm.socket.emit('npc:create', {
    name: 'Ash Mage', pronouns: 'she/her', hp: 33, maxHp: 33, ac: 14, initiativeModifier: 2,
    attacks: [{ name: 'Quarterstaff', bonus: '+4', damage: '1d6+2 bludgeoning', details: 'Reach 5 ft.' }],
    spells: [{ name: 'Fire Bolt', level: 0, attack: 'Ranged spell attack', damage: '1d10 fire', source: 'Core 5e' }],
    spellcasting: { className: 'NPC spellcaster', ability: 'INT', saveDc: 13, attackBonus: 5 },
    combat: { spellSlots: { 1: { total: 4, used: 0 }, 2: { total: 2, used: 0 } } },
    sheet: {
      name: 'Ash Mage', pronouns: 'she/her', challenge: '2', attacks: [{ name: 'Quarterstaff', bonus: '+4', damage: '1d6+2 bludgeoning' }],
      spells: [{ name: 'Fire Bolt', level: 0, attack: 'Ranged spell attack', damage: '1d10 fire' }],
      fields: { name: 'Ash Mage', hp: '33', maxhp: '33', ac: '14', int: '16', 'spell-slots-1': '4', 'spell-slots-2': '2' }
    }
  });
  const [npcRoster, savedNpc] = await Promise.all([npcRosterPromise, npcSavedPromise]);
  const ashMage = Object.values(npcRoster).find(npc => npc.name === 'Ash Mage');
  assert.equal(savedNpc.id, ashMage.id);
  assert.equal(ashMage.pronouns, 'she/her');
  assert.equal(ashMage.sheet.challenge, '2');
  assert.equal(ashMage.spells[0].name, 'Fire Bolt');
  assert.equal(ashMage.combat.spellSlots[1].total, 4);

  const hiddenNpcFromPlayer = expectNoEvent(playerOne.socket, 'roll:made', entry => entry.label === 'Secret Fire Bolt');
  const privateNpcPromise = once(dm.socket, 'roll:private', entry => entry.label === 'Secret Fire Bolt');
  dm.socket.emit('roll:make', {
    count: 1, sides: 20, modifier: 5, mode: 'advantage', npcId: ashMage.id,
    private: true, label: 'Secret Fire Bolt'
  });
  const privateNpcRoll = await privateNpcPromise;
  assert.equal(privateNpcRoll.npcId, ashMage.id);
  assert.equal(privateNpcRoll.name, 'Guide as Ash Mage');
  assert.equal(privateNpcRoll.rolls.length, 2);
  await hiddenNpcFromPlayer;

  pending = once(playerOne.socket, 'roll:made', entry => entry.label === 'Shared Fire Bolt');
  dm.socket.emit('roll:make', {
    count: 1, sides: 20, modifier: 5, npcId: ashMage.id, private: false, label: 'Shared Fire Bolt'
  });
  const sharedNpcRoll = await pending;
  assert.equal(sharedNpcRoll.npcId, ashMage.id);
  assert.equal(sharedNpcRoll.name, 'Guide as Ash Mage');

  pending = once(dm.socket, 'token:add', token => token.npcId === ashMage.id);
  const playerNpcTokenPromise = once(playerOne.socket, 'token:add', token => token.npcId === ashMage.id);
  dm.socket.emit('npc:place', { id: ashMage.id });
  const [ashMageToken, playerAshMageToken] = await Promise.all([pending, playerNpcTokenPromise]);
  assert.equal(ashMageToken.spellcasting.attackBonus, 5);
  assert.equal(ashMageToken.combat.spellSlots[2].total, 2);
  assert.equal(playerAshMageToken.spells, undefined, 'NPC spell lists must remain DM-only');
  assert.equal(playerAshMageToken.attacks, undefined, 'NPC attacks must remain DM-only');
  assert.equal(playerAshMageToken.pronouns, 'she/her', 'NPC pronouns must remain visible to players');
  pending = once(dm.socket, 'token:update', token => token.id === ashMageToken.id && token.combat.spellSlots[1].used === 1);
  dm.socket.emit('token:combat:update', { id: ashMageToken.id, action: 'spellSlot', level: 1, delta: 1 });
  await pending;
  pending = once(dm.socket, 'token:update', token => (
    token.id === ashMageToken.id && token.combat.spellSlots[1].total === 5 && token.combat.spellSlots[1].used === 1
  ));
  dm.socket.emit('npc:update', {
    id: ashMage.id, name: 'Ash Mage', hp: 33, maxHp: 33, ac: 14, initiativeModifier: 2,
    combat: { spellSlots: { 1: { total: 5, used: 1 }, 2: { total: 2, used: 0 } } }
  });
  await pending;
  pending = once(dm.socket, 'token:remove', removed => removed.id === ashMageToken.id);
  dm.socket.emit('token:remove', { id: ashMageToken.id });
  await pending;

  pending = once(playerOne.socket, 'token:update', token => token.id === duplicate.id && token.combat?.conditions?.includes('Prone'));
  dm.socket.emit('token:combat:update', { id: duplicate.id, action: 'condition:toggle', condition: 'Prone' });
  await pending;
  pending = once(playerOne.socket, 'token:update', token => (
    token.id === duplicate.id &&
    token.combat?.conditions?.includes('Prone') &&
    token.combat?.conditions?.includes('Blinded')
  ));
  dm.socket.emit('token:combat:update', { id: duplicate.id, action: 'condition:toggle', condition: 'Blinded' });
  const twoConditions = await pending;
  assert.deepEqual(twoConditions.combat.conditions, ['Prone', 'Blinded']);
  pending = once(playerOne.socket, 'token:update', token => (
    token.id === duplicate.id &&
    !token.combat?.conditions?.includes('Prone') &&
    token.combat?.conditions?.includes('Blinded')
  ));
  dm.socket.emit('token:combat:update', { id: duplicate.id, action: 'condition:toggle', condition: 'Prone' });
  assert.deepEqual((await pending).combat.conditions, ['Blinded']);

  pending = once(dm.socket, 'state:full', fullState => (
    fullState.scene.gridOffsetX === 13 &&
    fullState.scene.gridOffsetY === 7 &&
    fullState.scene.gridColor === '#ffffff' &&
    fullState.scene.snapToGrid === true
  ));
  dm.socket.emit('scene:setGrid', {
    gridSize: 50,
    gridVisible: true,
    gridColor: '#ffffff',
    snapToGrid: true,
    fitTokensToGrid: true,
    gridOffsetX: 13,
    gridOffsetY: 7
  });
  const offsetGridState = await pending;
  assert(offsetGridState.rollLog.some(entry => entry.label === 'Public weather roll'));
  assert(offsetGridState.rollLog.some(entry => entry.label === 'Shared Fire Bolt'));
  assert(!offsetGridState.rollLog.some(entry => entry.label === 'Secret weather roll'));
  assert(!offsetGridState.rollLog.some(entry => entry.label === 'Secret Fire Bolt'));
  assert(!offsetGridState.initiative.entries.some(entry => entry.name === 'Secret weather'));
  const offsetWolf = offsetGridState.tokens.find(token => token.id === wolf.id);
  assert.equal((offsetWolf.x - 13 - 25) % 50, 0);
  assert.equal((offsetWolf.y - 7 - 25) % 50, 0);

  pending = once(dm.socket, 'token:add', token => token.label === 'Offset Marker');
  dm.socket.emit('token:add', { label: 'Offset Marker', kind: 'item' });
  const offsetMarker = await pending;
  assert.equal(offsetMarker.x, 38);
  assert.equal(offsetMarker.y, 32);
  pending = once(playerOne.socket, 'token:remove', removed => removed.id === offsetMarker.id);
  dm.socket.emit('token:remove', { id: offsetMarker.id });
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
  assert.equal(restored.scene.gridOffsetX, 13);
  assert.equal(restored.scene.gridOffsetY, 7);
  assert.equal(restored.scene.gridColor, '#ffffff');
  assert.equal(restored.scene.snapToGrid, true);
  assert.equal(restored.tokens.length, 2);
  restored.tokens.forEach(token => {
    assert.equal((token.x - restored.scene.gridOffsetX - 25) % 50, 0);
    assert.equal((token.y - restored.scene.gridOffsetY - 25) % 50, 0);
  });
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
