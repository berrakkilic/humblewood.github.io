# Frontend Performance Best Practices

Use these rules when adding or changing frontend code for The Humblewood Table.
The roadmap is adapted from
[roadmap.sh Frontend Performance](https://roadmap.sh/frontend-performance-best-practices)
and tailored to this repository's generated-bundle, Express, Socket.IO, canvas,
and persistent-upload architecture.

## 1. Measure before optimizing

- Reproduce slow behavior in the running app before changing code.
- Check Chrome DevTools Network, Performance, and Lighthouse.
- Measure meaningful outcomes: page load, first interaction, route switches,
  socket updates, map zoom/pan, roll rendering, and large sheet/list updates.
- Avoid optimizing a value that is not a bottleneck.
- Keep changes on the narrowest relevant path; do not replace working browser
  code with a framework or dependency solely for perceived cleanliness.

## 2. Keep the initial payload small

- The browser loads generated `public/app.js`; source changes belong in
  `frontend/app/` and must be built with `npm run build:frontend`.
- Do not import a library for a small utility that can be implemented locally.
- Check `package.json` and `public/app.js` size impact before adding dependencies.
- Reuse existing feature modules and helpers.
- Remove dead code, duplicate event handlers, unused exports, unused CSS, and
  obsolete generated assumptions.

## 3. Preserve fast startup and stable script loading

- Keep `bootstrap.ts` last in the bundle order.
- Initialize shared state and handlers before socket startup can race them.
- Do not add startup work that can wait until a route is visited.
- Avoid blocking long synchronous work during login, route changes, or socket
  synchronization.
- Keep the page shell, HTML, CSS, and generated script paths predictable.

## 4. Minimize network work

- Reuse Socket.IO state updates instead of adding redundant HTTP requests.
- Avoid polling when a socket event or existing state refresh can supply the data.
- Debounce or throttle high-frequency events such as map pointer updates,
  drawing strokes, fog edits, ruler movement, and resize work.
- Batch DOM and state changes for one event where possible.
- Remove unreachable files and stale asset paths; avoid 404s.
- Keep request counts low and cache static assets with appropriate server headers.
- Use HTTPS consistently in production.

## 5. Send only necessary data

- Do not include large state objects in every socket event.
- Return or emit only fields needed by the recipient.
- Keep private DM-only values out of public roll events and public state updates.
- Bound persisted logs and lists. A history must have an explicit retention limit.
- Avoid repeated serialization or deep-copying large maps, scenes, inventories,
  and roll state.

## 6. Render DOM efficiently

- Batch list rebuilds instead of mutating many elements one at a time.
- Use `innerHTML` for complete, small controlled templates only. Escape dynamic
  strings and verify event handlers are attached once.
- After rebuilding a list, set event listeners on the rebuilt elements rather
  than accumulating listeners on a parent or document.
- Avoid repeated `getElementById`, `querySelector`, layout reads, and layout writes
  in a loop.
- Cache stable element references when a feature is initialized once.
- Read layout measurements together, then make DOM/CSS writes together.
- Prefer CSS transforms and `requestAnimationFrame` for animation and continuous
  visual updates.

## 7. Protect route and view performance

- Switch routes by changing the active view, not rebuilding the complete app shell.
- Stop or pause work tied to an inactive view where practical.
- Render only the data needed by the active route.
- Preserve the current route's scroll position unless the user explicitly opens
  a sheet or requests a jump to the top.
- Use one page-level scroll container unless a separate nested scroller provides
  a clear, bounded benefit.

## 8. Optimize images and uploaded media

- Resize and compress map, token, portrait, handout, and uploaded image assets
  before or immediately after upload when it is practical.
- Use an appropriate format: JPEG/WebP for photographic images, PNG for graphics
  requiring precise transparency, and SVG for simple interface artwork.
- Do not use Base64 images for large assets or upload data.
- Display dimensions should match the CSS/container size reasonably closely.
- Set explicit width and height or preserve an aspect ratio for stable layout.
- Lazy-load offscreen images when the page is large and loading them is not
  required for the current task.
- Avoid loading every saved scene image or uploaded media file at page startup.
- The persistent upload and music directories must not turn into a hidden
  startup dependency or accidentally ship repository assets.

## 9. Optimize canvas and map work

- Render map and fog canvases only after image/state changes that require redraw.
- Separate static map, grid, fog, token, ruler, and doodle layers when their
  update frequencies differ.
- Store and update map pointer/drawing data deliberately; avoid emitting every
  intermediate coordinate when a stroke can be batched.
- Use `requestAnimationFrame` for pointer, zoom, pan, and resize rendering.
- Account for device pixel ratio and canvas dimensions when appropriate.
- Clean up animation loops and event listeners when features are removed or
  remounted.

## 10. Optimize CSS and fonts

- Keep styles in the existing CSS files. Avoid repeated inline style mutations
  for dynamic states.
- Remove unused CSS and overly complex selectors.
- Use classes for repeated state changes rather than setting many individual
  properties.
- Avoid deep or universal selectors in hot paths.
- Keep Google Fonts or other font loading from blocking primary interaction.
- Prefer the existing WOFF2 web-font format and a limited font weight range.
- Add `font-display: swap` or equivalent behavior only after verifying it does
  not create disruptive text movement.
- Preconnect only to origins that are actually used.
- Do not inline a large stylesheet or script unless critical startup measurement
  proves it is beneficial.

## 11. Optimize JavaScript hot paths

- Avoid unnecessary full-page recalculation after a small socket update.
- Use bounded arrays for roll logs, notifications, and transient UI histories.
- Sort and filter only when data changes, not for every DOM read.
- Cache derived values such as modifiers and initiative calculations where
  invalidation is clear.
- Avoid repeated deep cloning, JSON serialization, or `Date.now()` work inside
  high-frequency loops.
- TypeScript should describe the real shape of state and events; avoid
  `any`-based code that creates runtime guards and correction work.
- Keep feature modules cohesive; large modules should be split only when the
  split reduces real complexity or change risk.

## 12. Handle asynchronous work safely

- Prevent duplicate submissions from repeated clicks.
- Disable submitted actions and show a clear pending state.
- Add loading and failure handling to fetch, upload, socket, and audio operations.
- Abort or ignore stale async results when a route or selection changes.
- Never assume a socket state update has arrived immediately after a local
  action. Keep local optimistic behavior consistent with server confirmation.
- Clean up timers, observers, animation frames, and listeners to prevent leaks.

## 13. Cache and storage rules

- Set cache headers for immutable/static assets appropriately.
- Do not cache private or per-user API responses as public resources.
- Use browser storage sparingly and only for data that is safe to recreate.
- Do not put secrets, session credentials, or large state dumps into local
  storage.
- Keep cookie size below 4096 bytes and the cookie count small.
- Bound saved server state and browser state. Remove old logs, scenes, caches,
  or media only when the product behavior explicitly permits it.

## 14. Compression and delivery

- Enable GZIP or Brotli compression in the production server/proxy.
- Serve static files over consistent HTTPS paths.
- Minify JavaScript and remove comments, whitespace, and sourcemap data from
  production assets when appropriate.
- Keep dependencies and lockfiles current.
- Use a CDN only when the deployment topology benefits from it.
- Keep third-party scripts off the startup path and verify they do not regress
  Core Web Vitals or security.

## 15. Performance review checklist

Before finishing frontend work:

- [ ] The change starts with a measured bottleneck or a clear bounded-cost feature.
- [ ] No generated `public/app.js` source was edited directly.
- [ ] The generated bundle was rebuilt with `npm run build:frontend`.
- [ ] Large assets are compressed, appropriately sized, and not loaded early.
- [ ] HTTP request count and payload size did not increase unnecessarily.
- [ ] Socket events are targeted and debounced/throttled when high-frequency.
- [ ] The DOM update is batched and avoids repeated layout reads.
- [ ] Lists, logs, state, and transient data have explicit limits.
- [ ] Route/view switching is fast and does not duplicate handlers or timers.
- [ ] Canvas and animation work use request frames and stop when inactive.
- [ ] Loading, pending, stale, and failure states are handled.
- [ ] Static assets avoid 404s and cache correctly.
- [ ] Lighthouse, Network, and Performance are checked for meaningful changes.
- [ ] Desktop and narrow mobile widths remain responsive.
- [ ] `npm test` passes.

## Reference

- [roadmap.sh Frontend Performance](https://roadmap.sh/frontend-performance-best-practices)
- [Chrome Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
