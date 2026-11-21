# Copilot UI/UX Instructions

When creating or changing UI code, read and follow:

- [`docs/UI_UX_BEST_PRACTICES.md`](../docs/UI_UX_BEST_PRACTICES.md)
- [`docs/FRONTEND_PERFORMANCE_BEST_PRACTICES.md`](../docs/FRONTEND_PERFORMANCE_BEST_PRACTICES.md)
- [`docs/FRONTEND_CODING_BEST_PRACTICES.md`](../docs/FRONTEND_CODING_BEST_PRACTICES.md)
- [`docs/BACKEND_PERFORMANCE_BEST_PRACTICES.md`](../docs/BACKEND_PERFORMANCE_BEST_PRACTICES.md)
- [`docs/BACKEND_CODING_BEST_PRACTICES.md`](../docs/BACKEND_CODING_BEST_PRACTICES.md)

Additional repository rules:

- Edit frontend TypeScript in `frontend/app/`; do not edit `public/app.js`
  directly.
- Preserve the existing parchment, forest, moss, rose, and gold visual language.
- Prefer focused changes and reuse existing components, patterns, and CSS.
- Keep one clear primary action per view or section.
- Minimize text: do not repeat labels or add explanatory copy for obvious UI.
- Use real buttons and links, visible keyboard focus, accessible names, and
  sufficient contrast.
- Align controls used together and center icons geometrically, preferably with
  flex/grid or inline SVG rather than font-dependent Unicode symbols.
- Keep fixed, floating, and scrollable surfaces clear of toolbars, tabs, and
  system UI.
- Limit long lists and persisted logs to a small, explicit retention count.
- Verify changes in the running app at desktop and mobile widths.
- Run `npm test` after frontend changes.
