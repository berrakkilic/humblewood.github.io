const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const targets = [
  path.join(projectRoot, 'server.js'),
  path.join(projectRoot, 'src', 'server'),
  path.join(projectRoot, 'public'),
  path.join(projectRoot, 'test')
];

function javascriptFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith('.js') ? [target] : [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap(entry =>
    javascriptFiles(path.join(target, entry.name))
  );
}

const files = targets.flatMap(javascriptFiles).sort();
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Syntax checks passed for ${files.length} JavaScript files.`);
