const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const FRONTEND_FILES = ['index.html', 'app.js', 'style.css'];
const APP_ROUTES = ['/', '/map', '/characters', '/almanac', '/jukebox', '/dice'];

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

function createHttpApp(config) {
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
  const app = express();

  app.set('trust proxy', config.proxyTrust);
  app.use(express.json());
  app.use(express.static(config.publicDir));
  app.use('/uploads', express.static(config.uploadDir));

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
