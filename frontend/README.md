# Frontend structure

The browser still receives one classic script (`public/app.js`), but that file
is generated. Edit the TypeScript feature files in `frontend/app/` instead.
This keeps the existing UI and global event flow stable while making the code
small enough to navigate and review.

## Feature map

| Source | Responsibility |
| --- | --- |
| `state.ts` | Shared dependencies, state, and constants |
| `ui/overlays.ts` | Reusable dismissible dialog and popover controllers, exposed as `window.HumblewoodOverlays` |
| `session.ts` | Login, routing, socket synchronization, and account UI |
| `map.ts` | Map tools, pan/zoom, fog, doodles, pointers, and pings |
| `library.ts` | Handouts, folders, broadcasts, and shop bridge |
| `tokens.ts` | Token tray, token editors, NPC roster, and sidebars |
| `characters/sheet.ts` | Character/NPC sheet lifecycle and calculations |
| `characters/inventory.ts` | Inventory editing and drag/drop |
| `characters/attacks.ts` | Attack presets and NPC stat-block imports |
| `characters/spells.ts` | Spell catalog and spell editing |
| `characters/level-up.ts` | Level-up flow |
| `jukebox.ts` | Shared music controls |
| `dice.ts` | Dice roller, roll log, and generated roll controls |
| `combat.ts` | Quick combat, long rests, and spell preparation |
| `initiative.ts` | Initiative order and turn controls |
| `shared.ts` | Shared UI helpers |
| `bootstrap.ts` | One-time initialization and socket connection |

## Commands

- `npm run build:frontend` type-checks and builds `public/app.js`.
- `npm run watch:frontend` rebuilds after a frontend source change.
- `npm run typecheck:frontend` runs TypeScript without writing output.

The file order in `tsconfig.frontend.json` is also the bundle order. Shared
state must appear first and `bootstrap.ts` must remain last. Keep browser startup
out of feature files so a fast socket connection cannot race handler setup.

This is intentionally a staged migration rather than a framework rewrite. New
features can introduce focused interfaces and modules as their data boundaries
stabilize; a framework can be evaluated later if component/state reuse makes it
worth the runtime and rewrite cost.
