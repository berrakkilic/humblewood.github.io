# The Humblewood Table

A cozy, cottagecore virtual tabletop for running the Humblewood campaign online.

![Logo](images/logo.jpeg)

## Running it locally

Req: [Node.js](https://nodejs.org) installed (v18+).

```bash
npm ci
npm start
```

Then open `http://localhost:3000` in your browser. 

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

Now hosted on `https://humblewood.sfseeger.de/` !! Yippie 

1. Open the site, enter your name, pick **Dungeon Master** or **Player** and click "Enter the Wood."
2. DM-only controls (uploading maps, adding tokens, editing the playlist) are hidden from players.

## What's built so far 

- **Map & tokens**: DM uploads the battle map image. Tokens for NPCs, items and PCs live in a tray and can be moved, snapped to the grid, hidden from players and given one-by-one HP adjustments. Pan and zoom controls work for everyone. Doodles and NPC/item names can be enabled by DM. Distance can be measured with the Ruler. Battle Fog can be drawn with rectangles. Conditions show up on tokens with its starting letters. 
- **Initiative tracker**: turn order and rounds of NPCs and player characters are all visible directly beside the map (initiative table can be toggled on and off). DM can manually edit and reorder initiatives and their order. NPCs can enter the initiative tracker and have very basic battle functions. May extend this later.
- **Jukebox**: add tracks by direct audio URL, playlist syncs playback position/play/pause across all clients. Adding track name for each track could get tiring?
- **Character sheets**: a basic 5e-style sheet (abilities, HP/AC, inventory, notes) per character, added Humblewood characteristics. A tiny reminder of your character can be found on the sidebar of the map page.
- **Character-specific dice**: Select a character to roll ability checks, saving throws, skills, initiative, attacks, spell attacks etc. with the stored modifiers. d20 rolls support advantage and disadvantage and sync to the shared roll log. Spell and combat rolls are accessible on the combat page. To unlock damage rolls on spells, simply write its roll (for example 1d10) in the spell description.
- **Cottagecore Humblewood aesthetic**: parchment and forest tones, vine dividers, soft rounded shapes.
- **Access restrictions**: DM access is PIN-gated. Character ownership is tied to the "Player" field in character sheet. Players must log in with username and password. Password can be changed by DM upon request, however, username shall stay known. Token movement/character rolls are checked server-side.
- **Function automation and Shortcuts**: Long-rest automation. NPC Duplication. Fit map to grid. Middle button of mouse to move around.
- **Not tested yet - Scene saving as DM**

## Known limitations to work out next
- Music playback requires direct audio file URLs. Self-hosted MP3s or a service like SoundCloud's direct stream links also work.
- More humblewood specific vibes? 
- look up summons waa
- bug: spellcasting save DC does not change after establishing int/cha/wis once and then changing to another one
- if: certain species, then only those species' subrace allowed. same with class. characters can only level up to 20. characters only have ability scores up to 20. 
- information lookup search page?
- ruler does not work on mobile
