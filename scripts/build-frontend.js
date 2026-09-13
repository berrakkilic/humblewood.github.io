const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'tsconfig.frontend.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const sourceFiles = config.files.filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'));

const source = sourceFiles.map(file => {
  const absolutePath = path.join(projectRoot, file);
  const contents = fs.readFileSync(absolutePath, 'utf8');
  return `// ---- ${file} ----\n${contents}`;
}).join('\n\n');

esbuild.buildSync({
  stdin: {
    contents: source,
    loader: 'ts',
    resolveDir: projectRoot,
    sourcefile: 'frontend/app.bundle.ts'
  },
  outfile: path.join(projectRoot, 'public', 'app.js'),
  bundle: false,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  legalComments: 'none',
  sourcemap: true,
  banner: {
    js: '// GENERATED FILE — edit frontend/app/**/*.ts, then run npm run build:frontend.'
  }
});

console.log(`Built public/app.js from ${sourceFiles.length} TypeScript feature files.`);
