const path = require('path');

function loadConfig(rootDir) {
  const dataDir = process.env.DATA_DIR || path.join(rootDir, 'data');
  const proxyTrust = process.env.TRUST_PROXY
    ? `loopback, linklocal, uniquelocal, ${process.env.TRUST_PROXY}`
    : 'loopback, linklocal, uniquelocal';

  return {
    port: Number(process.env.PORT) || 3000,
    dmPin: String(process.env.DM_PIN || 'humblewood'),
    dataDir,
    musicDir: process.env.MUSIC_DIR || path.join(dataDir, 'music'),
    uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, 'public', 'uploads'),
    publicDir: path.join(rootDir, 'public'),
    proxyTrust,
    rootDir
  };
}

module.exports = { loadConfig };
