const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(projectRoot, 'tsconfig.frontend.json'), 'utf8'));
const sourceFiles = config.files.filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'));
const bundle = fs.readFileSync(path.join(projectRoot, 'public', 'app.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(projectRoot, 'frontend', 'app', 'bootstrap.ts'), 'utf8');

assert.strictEqual(sourceFiles.length, 16, 'The frontend manifest should include every feature and bootstrap file.');
assert.match(bundle, /^\/\/ GENERATED FILE/, 'public/app.js must be generated from the TypeScript sources.');
assert.strictEqual((bootstrap.match(/socket\.connect\(\)/g) || []).length, 1, 'Bootstrap should connect its socket exactly once.');
assert.ok(bundle.lastIndexOf('socket.connect()') > bundle.lastIndexOf('initializeAttackPresetControls()'), 'The initial socket connection must remain after feature initialization.');
assert.match(bundle, /function openSpellPreparation\(/, 'The generated app is missing spell preparation.');
assert.match(bundle, /function renderMap\(/, 'The generated app is missing the map feature.');

for (const relativeFile of sourceFiles) {
  const source = fs.readFileSync(path.join(projectRoot, relativeFile), 'utf8');
  const lineCount = source.split(/\r?\n/).length;
  assert.ok(lineCount <= 1000, `${relativeFile} has grown past 1,000 lines; split the feature before adding more.`);
}

console.log(`Frontend structure checks passed for ${sourceFiles.length} TypeScript files.`);
