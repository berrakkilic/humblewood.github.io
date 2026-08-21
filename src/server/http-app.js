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
  const app = express();

  app.set('trust proxy', config.proxyTrust);
  app.use(express.json());
  app.use(express.static(config.publicDir));

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
