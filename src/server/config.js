const path = require('path');

function loadConfig(rootDir) {
  const proxyTrust = process.env.TRUST_PROXY
    ? `loopback, linklocal, uniquelocal, ${process.env.TRUST_PROXY}`
    : 'loopback, linklocal, uniquelocal';

  return {
    port: Number(process.env.PORT) || 3000,
    dmPin: String(process.env.DM_PIN || 'humblewood'),
    dataDir: process.env.DATA_DIR || path.join(rootDir, 'data'),
    uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, 'public', 'uploads'),
    publicDir: path.join(rootDir, 'public'),
    proxyTrust,
    rootDir
  };
}

module.exports = { loadConfig };
