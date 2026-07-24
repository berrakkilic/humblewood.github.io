# The Humblewood Table

A cozy, cottagecore virtual tabletop for running your Humblewood campaign online — maps, tokens, doodling, character sheets, and a synced music jukebox, shared live between you and your players.

## Running it locally

You need [Node.js](https://nodejs.org) installed (v18+).

```bash
npm install
npm start
```

Then open `http://localhost:3000` in your browser. That's your DM view.

## Playing with your group

Everyone needs to reach the **same running server** — running it on your laptop only works for people on your own network unless you deploy it (see below).

1. Open the site, enter your name, pick **Dungeon Master** or **Player**, and click "Enter the Wood."
2. Everything — moving tokens, doodles, music, map changes, character sheets — syncs live to everyone connected, no refresh needed.
3. DM-only controls (uploading maps, adding tokens, doodling, editing the playlist) are hidden from players automatically.

## Getting this onto GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Humblewood Table"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

(Create the empty repo on GitHub first via "New repository" — don't initialize it with a README there, to avoid a merge conflict.)

## Deploying so players can join from anywhere

**Important: GitHub Pages won't work for this.** Pages only serves static files (HTML/CSS/JS, no server), but this app needs a live Node process for Socket.io to sync everyone in real time. You need an actual Node host instead — still free, still connects straight to your GitHub repo:

1. Push this repo to GitHub (see above).
2. Go to [render.com](https://render.com) (or [railway.app](https://railway.app)), sign in with GitHub.
3. "New Web Service" → pick your repo.
4. Build command: `npm install`. Start command: `npm start`. Leave the port setting alone — the platform sets `PORT` automatically and `server.js` already reads it.
5. Deploy. You'll get a public URL like `humblewood-table.onrender.com` — share that with your players.
6. Every time you `git push`, Render/Railway auto-redeploys.

One thing to know about free tiers: the filesystem often resets on redeploy, so uploaded map/token images and the `data/state.json` save file can get wiped when the service restarts or redeploys. Between sessions without redeploying, your table state is safe. For a table that survives redeploys long-term, the next step is swapping local file storage for something persistent (a small hosted SQLite like Turso for state, Cloudflare R2 or S3 for images). Happy to wire that in whenever you're ready.

## What's built so far (the skeleton)

- **Map & tokens** — DM uploads a battle map image; tokens for NPCs, items, and PCs live in a tray and can be dragged around the map. Positions sync to everyone.
- **Doodle layer** — DM can freehand-draw on the map (great for marking areas, paths, or "the ritual circle glows here"). Clearable.
- **Jukebox** — add tracks by direct audio URL, playlist syncs playback position/play/pause across all clients.
- **Character sheets** — a basic 5e-style sheet (abilities, HP/AC, inventory, notes) per character, editable by anyone (you may want to restrict this later).
- **Cottagecore Humblewood aesthetic** — parchment and forest tones, a hand-lettered accent font, vine dividers, soft rounded shapes.

## Known limitations to build out next

- State lives in server memory only — **restarting the server clears the table** (map, tokens, playlist, sheets). Swapping in a small database (SQLite is easiest) is the natural next step.
- No authentication — anyone with the link can join as anyone. Fine for a private table with a link you control; add passwords/accounts before sharing more widely.
- No fog of war, no dice roller, no grid/snap-to-grid yet — the `state.fog` field and grid size are stubbed in `server.js` ready for you (or me, next round) to build on.
- Music playback requires direct audio file URLs (not YouTube/Spotify links) due to those platforms' embedding restrictions — self-hosted MP3s or a service like SoundCloud's direct stream links work.
- Token art and maps upload to the server's local disk — fine for now, but on most hosts (Render free tier especially) uploaded files don't persist across restarts/deploys. For a permanent setup, swap in cloud storage (S3, Cloudflare R2) later.

## Project structure

```
humblewood-table/
  server.js          Express + Socket.io backend, in-memory room state
  public/
    index.html        App shell (join screen, map/characters/jukebox views)
    style.css          Cottagecore theme
    app.js             All client-side logic and socket wiring
    uploads/            Uploaded maps/token art land here
```
