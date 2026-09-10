const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { AUTH_COOKIE_NAME, cookieValue } = require('./socket/auth');

const FRONTEND_FILES = ['index.html', 'app.js', 'style.css'];
const APP_ROUTES = ['/', '/map', '/characters', '/almanac', '/jukebox', '/library', '/dice'];
const LIBRARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf',
  '.txt', '.md', '.markdown', '.json', '.csv', '.js', '.ts', '.css', '.html', '.xml', '.yaml', '.yml'
]);
const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function authCookie(req, token, maxAge = AUTH_SESSION_MAX_AGE_SECONDS) {
  const secure = req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  return [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token || '')}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${Math.max(0, Number(maxAge) || 0)}`,
    maxAge ? '' : 'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ].filter(Boolean).join('; ');
}

function frontendFile(config, filename) {
  const publicFile = path.join(config.publicDir, filename);
  const rootFile = path.join(config.rootDir, filename);
  return fs.existsSync(publicFile) ? publicFile : rootFile;
}

function humanizeTrackFilename(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/^\d{10,}-/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function listMp3Tracks(directory, urlPrefix, source) {
  let entries = [];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === '.mp3')
    .map(entry => ({
      id: `${source}:${entry.name}`,
      title: humanizeTrackFilename(entry.name),
      url: `${urlPrefix}/${encodeURIComponent(entry.name)}`,
      source
    }));
}

function createHttpApp(config, getRoom = () => null) {
  fs.mkdirSync(config.uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, callback) => callback(null, config.uploadDir),
    filename: (req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      callback(null, `${Date.now()}-${safeName}`);
    }
  });
  const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
  const audioUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, extension === '.mp3');
    }
  });
  const libraryUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      callback(null, LIBRARY_EXTENSIONS.has(path.extname(file.originalname).toLowerCase()));
    }
  });
  const app = express();
  const authAttempts = new Map();

  app.set('trust proxy', config.proxyTrust);
  app.use(express.json());
  app.use(express.static(config.publicDir));
  app.use('/uploads', express.static(config.uploadDir));

  function authAttemptKey(req) {
    return String(req.ip || req.socket?.remoteAddress || 'unknown');
  }

  function tooManyAuthAttempts(req) {
    const key = authAttemptKey(req);
    const cutoff = Date.now() - 10 * 60 * 1000;
    const attempts = (authAttempts.get(key) || []).filter(time => time > cutoff);
    authAttempts.set(key, attempts);
    return attempts.length >= 12;
  }

  function recordAuthFailure(req) {
    const key = authAttemptKey(req);
    authAttempts.set(key, [...(authAttempts.get(key) || []), Date.now()].slice(-12));
  }

  app.post('/api/auth/session', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (tooManyAuthAttempts(req)) {
      return res.status(429).json({ ok: false, message: 'Too many sign-in attempts. Please wait a few minutes.' });
    }
    const room = getRoom();
    if (!room) return res.status(503).json({ ok: false, message: 'The table is still waking up. Please try again.' });
    try {
      const identity = await room.authenticateIdentity(req.body || {});
      if (!identity.ok) {
        recordAuthFailure(req);
        return res.status(401).json({ ok: false, message: identity.message });
      }
      authAttempts.delete(authAttemptKey(req));
      const previousToken = cookieValue(req.headers.cookie, AUTH_COOKIE_NAME);
      if (previousToken) await room.revokeAuthSession(previousToken);
      const session = await room.createAuthSession(identity);
      res.setHeader('Set-Cookie', authCookie(req, session.token));
      return res.json({
        ok: true,
        role: identity.role,
        name: identity.name,
        username: identity.username || null,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error('HTTP sign-in failed:', error.message);
      return res.status(500).json({ ok: false, message: 'The account could not be checked right now. Please try again.' });
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const room = getRoom();
    const token = cookieValue(req.headers.cookie, AUTH_COOKIE_NAME);
    if (!room || !token) return res.status(401).json({ ok: false });
    try {
      const identity = await room.authSessionIdentity(token);
      if (!identity) {
        res.setHeader('Set-Cookie', authCookie(req, '', 0));
        return res.status(401).json({ ok: false });
      }
      return res.json({ ok: true, ...identity });
    } catch (error) {
      console.error('HTTP session check failed:', error.message);
      return res.status(500).json({ ok: false });
    }
  });

  app.delete('/api/auth/session', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const room = getRoom();
    const token = cookieValue(req.headers.cookie, AUTH_COOKIE_NAME);
    try {
      if (room && token) await room.revokeAuthSession(token);
    } catch (error) {
      console.error('Session sign-out failed:', error.message);
    }
    res.setHeader('Set-Cookie', authCookie(req, '', 0));
    return res.status(204).end();
  });

  // Keep repositories that store the three original frontend files at the
  // project root working. Files in /public still take precedence.
  FRONTEND_FILES.forEach(filename => {
    app.get(`/${filename}`, (req, res, next) => {
      const selected = frontendFile(config, filename);
      if (!fs.existsSync(selected)) return next();
      res.sendFile(selected);
    });
  });

  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
  });

  app.post('/api/upload/audio', (req, res) => {
    audioUpload.single('file')(req, res, error => {
      if (error) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({ error: error.message || 'The MP3 could not be uploaded.' });
      }
      if (!req.file) return res.status(400).json({ error: 'Choose an MP3 file.' });
      return res.json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
    });
  });

  app.post('/api/upload/library', (req, res) => {
    libraryUpload.single('file')(req, res, error => {
      if (error) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({ error: error.message || 'The file could not be uploaded.' });
      }
      if (!req.file) return res.status(400).json({ error: 'Choose a supported image, PDF, text or code file.' });
      return res.json({
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      });
    });
  });

  app.get('/api/music', (req, res) => {
    const builtIn = listMp3Tracks(path.join(config.publicDir, 'music'), '/music', 'Built-in');
    const uploaded = listMp3Tracks(config.uploadDir, '/uploads', 'Uploaded');
    res.json({ tracks: [...builtIn, ...uploaded].sort((a, b) => a.title.localeCompare(b.title)) });
  });

  // History API fallback for every client-side page. This makes refreshes and
  // shared links such as /characters behave like normal pages.
  app.get(APP_ROUTES, (req, res, next) => {
    const selected = frontendFile(config, 'index.html');
    if (!fs.existsSync(selected)) return next();
    res.sendFile(selected);
  });

  return app;
}

module.exports = { APP_ROUTES, createHttpApp };
