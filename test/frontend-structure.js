const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(projectRoot, 'tsconfig.frontend.json'), 'utf8'));
const sourceFiles = config.files.filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'));
const bundle = fs.readFileSync(path.join(projectRoot, 'public', 'app.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(projectRoot, 'frontend', 'app', 'bootstrap.ts'), 'utf8');
const indexHtml = fs.readFileSync(path.join(projectRoot, 'public', 'index.html'), 'utf8');
const stoneTablets = fs.readFileSync(path.join(projectRoot, 'public', 'handouts', 'stone-tablets.html'), 'utf8');

assert.strictEqual(sourceFiles.length, 17, 'The frontend manifest should include every feature and bootstrap file.');
assert.match(bundle, /^\/\/ GENERATED FILE/, 'public/app.js must be generated from the TypeScript sources.');
assert.strictEqual((bootstrap.match(/socket\.connect\(\)/g) || []).length, 1, 'Bootstrap should connect its socket exactly once.');
assert.ok(bundle.lastIndexOf('socket.connect()') > bundle.lastIndexOf('initializeAttackPresetControls()'), 'The initial socket connection must remain after feature initialization.');
assert.match(bundle, /function openSpellPreparation\(/, 'The generated app is missing spell preparation.');
assert.match(bundle, /function renderMap\(/, 'The generated app is missing the map feature.');
assert.match(bundle, /function createDialogController\(/, 'The generated app is missing the dialog utility.');
assert.match(bundle, /function createPopoverController\(/, 'The generated app is missing the popover utility.');
assert.match(indexHtml, /<dialog[^>]+id="shared-handout-overlay"/, 'Shared handouts should use a native dialog.');
assert.match(indexHtml, /data-dialog-close="dismiss"/, 'Shared handouts need a dismiss control.');
assert.match(stoneTablets, /<dialog[^>]+id="puzzle-dialog"/, 'The Stone Tablets handout needs a native puzzle dialog.');
assert.match(stoneTablets, /id="instructions-popover" popover/, 'The Stone Tablets handout needs Popover API instructions.');
assert.match(stoneTablets, /id="fullscreen-puzzle"/, 'The Stone Tablets handout should offer a full-screen view.');
assert.match(bundle, /setAttribute\("allowfullscreen", ""\)/, 'HTML handouts should be allowed to enter full screen.');
assert.match(stoneTablets, /humblewood:puzzle-complete/, 'The Stone Tablets handout should report completion to its host.');
assert.strictEqual((stoneTablets.match(/id: 'tablet-\d'/g) || []).length, 8, 'The Stone Tablets puzzle should contain eight movable pieces.');
assert.doesNotMatch(stoneTablets, /(?:src|href)="https?:\/\//, 'The Stone Tablets handout must remain self-contained.');

for (const relativeFile of sourceFiles) {
  const source = fs.readFileSync(path.join(projectRoot, relativeFile), 'utf8');
  const lineCount = source.split(/\r?\n/).length;
  assert.ok(lineCount <= 1000, `${relativeFile} has grown past 1,000 lines; split the feature before adding more.`);
}

console.log(`Frontend structure checks passed for ${sourceFiles.length} TypeScript files.`);
