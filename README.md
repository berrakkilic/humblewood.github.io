# The Humblewood Table

A cozy, cottagecore virtual tabletop for running the Humblewood campaign online.

![Logo](images/logo.jpeg)

## Running it locally

Req: [Node.js](https://nodejs.org) installed (v18+).

```bash
npm ci
npm start
```

Then open `http://localhost:3000` in your browser. (just dm view)

## Deploying with Docker
- **`Dockerfile`** — builds the app into a container.
- **`docker-compose.yml`** — runs it with two persistent volumes: one for the database, one for uploaded map/token images.

```bash
docker compose up -d --build
```

Builds the image and starts the container in the background, with the app listening on port 3000.

The app uses SQLite in a file and the `docker-compose.yml` mounts a volume (`humblewood-data`) so that the file persists across restarts and redeploys automatically (hopefuckingfully).

To update the live version after this, I can just push as normal, then on the server we would have to:
```bash
git pull
docker compose up -d --build
```
Or write an automatic redeploy mechanism. 

## Playing with the group

Everyone needs to reach the same running server. Running it on your laptop only works for people on the same network unless deployed. 

1. Open the site, enter your name, pick **Dungeon Master** or **Player**, and click "Enter the Wood."
2. DM-only controls (uploading maps, adding tokens, doodling, editing the playlist) are hidden from players.

## What's built so far (the skeleton)

- **Map & tokens**: DM uploads the battle map image. Tokens for NPCs, items and PCs live in a tray and can be moved, snapped to the grid, hidden from players and given simple HP adjustments. Pan and zoom controls work for everyone.
- **Initiative tracker**: turn order and rounds of NPCs and player characters are all visible directly beside the map (initiative table can be toggled on and off).
- **Jukebox**: add tracks by direct audio URL, playlist syncs playback position/play/pause across all clients. Adding track name for each track could get tiring?
- **Character sheets**: a basic 5e-style sheet (abilities, HP/AC, inventory, notes) per character, added Humblewood characteristics.
- **Character-specific dice**: select a character to roll ability checks, saving throws, skills, initiative, attacks, spell attacks etc. with the stored modifiers. d20 rolls support advantage and disadvantage and sync to the shared roll log.
- **Cottagecore Humblewood aesthetic**: parchment and forest tones, vine dividers, soft rounded shapes.
- **Access restrictions**: DM access is PIN-gated. Character ownership is tied to a persistent browser identity. Token movement/character rolls are checked server-side.
- **Function automation**: Long-rest automation. 

## Known limitations to build out next
- No authentication so anyone with the link can join as anyone. 
- Music playback requires direct audio file URLs. Self-hosted MP3s or a service like SoundCloud's direct stream links also work.
- More humblewood specific vibes? 
