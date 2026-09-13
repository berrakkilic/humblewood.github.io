const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const frontendRoot = path.join(projectRoot, 'frontend');
let timer = null;
let building = false;
let queued = false;

function build() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const result = spawnSync('npm', ['run', 'build:frontend'], {
    cwd: projectRoot,
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });
  building = false;
  if (result.status !== 0) console.error('Frontend build failed; watching for the next change.');
  if (queued) {
    queued = false;
    build();
  }
}

function scheduleBuild() {
  clearTimeout(timer);
  timer = setTimeout(build, 120);
}

build();
console.log('Watching frontend TypeScript. Press Ctrl+C to stop.');
fs.watch(frontendRoot, { recursive: true }, scheduleBuild);
fs.watch(path.join(projectRoot, 'tsconfig.frontend.json'), scheduleBuild);
