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
| `characters/inventory.ts` | Inventory editing, descriptions, usage tracking, and drag/drop |
| `characters/attacks.ts` | Attack presets and NPC stat-block imports |
| `characters/reactions.ts` | Reaction presets and reaction editing |
| `characters/spells.ts` | Spell catalog and spell editing |
| `characters/level-up.ts` | Level-up flow |
| `jukebox.ts` | Shared music controls |
| `dice.ts` | Dice roller, roll log, and generated roll controls |
| `combat.ts` | Quick combat, long rests, and spell preparation |
| `initiative.ts` | Initiative order and turn controls |
| `shared.ts` | Shared UI helpers and typed required-element accessors |
| `bootstrap.ts` | One-time initialization and socket connection |

## Commands

- `npm run build:frontend` type-checks and builds `public/app.js`.
- `npm run watch:frontend` rebuilds after a frontend source change.
- `npm run typecheck:frontend` runs TypeScript without writing output.
- `npm run typecheck:frontend:strict` checks the modules migrated to strict
  implicit-`any` rules.

The file order in `tsconfig.frontend.json` is also the bundle order. Shared
state must appear first and `bootstrap.ts` must remain last. Keep browser startup
out of feature files so a fast socket connection cannot race handler setup.

This is intentionally a staged migration rather than a framework rewrite. New
features can introduce focused interfaces and modules as their data boundaries
stabilize; a framework can be evaluated later if component/state reuse makes it
worth the runtime and rewrite cost.

Use the typed `getRequiredButton`, `getRequiredInput`, and `getRequiredSelect`
helpers for controls that are required by the page shell. They fail explicitly
when markup and feature code drift apart; optional elements should continue to
use a null check.

## Strict typing migration

The frontend is moving toward `noImplicitAny` one feature boundary at a time.
The regular typecheck remains green during the transition; migrated files are
also listed in `tsconfig.frontend.strict.json` so the stricter check can prevent
regressions. The dialog and popover controllers, initiative tracker, jukebox,
shared helpers, session and routing, map controls and doodle tools, combat
controls and spell preparation, dice rolls and roll logs, character attack,
reaction, level-up, inventory, spell, and sheet editors, plus token, NPC, and
library controls, are the migrated slices.

The staged feature migration is complete. Explicit `any` types were replaced
with named contracts for local form data, timers, pending rolls, and the browser
module APIs. The remaining explicit `any` is centralized in `LegacyRecord` for
open-ended legacy payload fields whose server contracts are not yet formalized.
For each slice, define narrow payload and DOM types at its boundary, add the file
to the strict config, and remove its implicit-`any` diagnostics before moving
on. Avoid blanket casts or `@ts-ignore`; keep explicit `any` replacement as a
separate task where runtime data contracts need more investigation.

For interface decisions and visual implementation, follow
[`../docs/UI_UX_BEST_PRACTICES.md`](../docs/UI_UX_BEST_PRACTICES.md).

For network, bundle, DOM, canvas, asset, and rendering performance, follow
[`../docs/FRONTEND_PERFORMANCE_BEST_PRACTICES.md`](../docs/FRONTEND_PERFORMANCE_BEST_PRACTICES.md).

For CSS structure, responsive layout, JavaScript style, state boundaries,
event handling, and dynamic HTML safety, follow
[`../docs/FRONTEND_CODING_BEST_PRACTICES.md`](../docs/FRONTEND_CODING_BEST_PRACTICES.md).
