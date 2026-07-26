# The Humblewood Table

A cozy, cottagecore virtual tabletop for running the Humblewood campaign online.

## Running it locally

Req: [Node.js](https://nodejs.org) installed (v18+).

```bash
npm install
npm start
```

Then open `http://localhost:3000` in your browser. (just dm view)

## Playing with the group

Everyone needs to reach the same running server. Running it on your laptop only works for people on the same network unless deployed. 

1. Open the site, enter your name, pick **Dungeon Master** or **Player**, and click "Enter the Wood."
2. DM-only controls (uploading maps, adding tokens, doodling, editing the playlist) are hidden from players automatically.

## Deploying so players can join from anywhere

Pages only serves static files unf :( but this app needs a live Node process for Socket.io to sync everyone in real time.

The filesystem resets on redeploy, so uploaded map/token images will get wiped when the service restarts or redeploys.

## What's built so far (the skeleton)

- **Map & tokens**: DM uploads a battle map image; tokens for NPCs, items, and PCs live in a tray and can be dragged around the map. Positions sync to everyone.
- **Doodle layer**: DM can freehand-draw on the map. Clearable.
- **Jukebox**: add tracks by direct audio URL, playlist syncs playback position/play/pause across all clients.
- **Character sheets**: a basic 5e-style sheet (abilities, HP/AC, inventory, notes) per character, editable by anyone (will restrict this later).
- **Cottagecore Humblewood aesthetic**: parchment and forest tones, vine dividers, soft rounded shapes.

## Known limitations to build out next

- State lives in server memory only.
- No authentication so anyone with the link can join as anyone. 
- Music playback requires direct audio file URLs. Self-hosted MP3s or a service like SoundCloud's direct stream links also work.
- Token art and maps upload to the server's local disk.
