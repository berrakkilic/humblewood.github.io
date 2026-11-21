# UI and UX Best Practices

Use these rules when designing or changing interface code for The Humblewood Table.
They are practical implementation guidance derived from
[Laws of UX](https://lawsofux.com/), a reference by Jon Yablonski.

## 1. Start with the user's task

- Make the current task obvious. Put the primary heading, current location,
  primary action, and next step near the top of the relevant view.
- Prefer direct controls over explanatory text. Remove copy only after the
  interface is still understandable without it.
- Do not add text that repeats a visible label or restates basic behavior.
- Preserve the user's place: opening a sheet, dialog, route, or panel should
  scroll or focus only when necessary, and should restore context on close.

## 2. Reduce choices and cognitive load

- Apply [Hick's Law](https://lawsofux.com/hicks-law/) and
  [Choice Overload](https://lawsofux.com/choice-overload/): show common actions
  immediately and put uncommon or advanced actions behind sensible grouping.
- Use progressive disclosure, tabs, accordions, filters, and presets when they
  make a dense workflow easier.
- Do not hide essential information or frequently repeated actions.
- Limit long toolbars and lists. Group related controls and separate destructive
  actions visually and behaviorally.
- Use defaults that are safe and match the most common choice.

## 3. Use familiar patterns

- Follow [Jakob's Law](https://lawsofux.com/jakobs-law/) and established web
  conventions: navigation at the top or left, close affordances that remain
  predictable, standard form controls, and recognizable icon meanings.
- Do not invent a novel pattern when a familiar one works.
- Use familiar words such as **Save**, **Close**, **Delete**, **Next**, and
  **Previous** unless a concise domain term is clearer.
- Add `aria-label` or tooltips to icon-only controls so their purpose is clear.

## 4. Make structure visible

- Use [common region](https://lawsofux.com/law-of-common-region/),
  [proximity](https://lawsofux.com/law-of-proximity/),
  [similarity](https://lawsofux.com/law-of-similarity/), and
  [uniform connectedness](https://lawsofux.com/law-of-uniform-connectedness/)
  to communicate relationships.
- Keep controls that belong together close together.
- Use consistent spacing, border treatment, typography, and color for repeated
  content such cards, rows, form sections, and status badges.
- A panel or boundary is valuable when it explains grouping; remove boundaries
  that only add visual noise.

## 5. Make hierarchy simple

- Apply [Prägnanz](https://lawsofux.com/law-of-pr%C3%A4gnanz/) and
  [Occam's Razor](https://lawsofux.com/occams-razor/): use the simplest layout
  that communicates the content clearly.
- Use one dominant heading, one primary action, and a limited number of
  supporting actions in each view or dialog.
- Build hierarchy with size, weight, spacing, and grouping rather than many
  competing colors or decorative effects.
- Keep the visual style consistent with the existing parchment, forest, moss,
  rose, and gold palette. Novel colors require a clear semantic purpose.

## 6. Respect Fitts's Law

- Make primary actions large enough to acquire and keep them close to the
  content they affect.
- Use at least roughly 44px targets for touch controls where practical.
- Align control heights when they are used side by side.
- Use padding and exact flex/grid centering for symbols. Prefer inline SVG
  shapes over font-dependent Unicode symbols when geometric accuracy matters.
- Do not place fixed controls over unrelated content or across the edge of a
  taskbar, toolbar, tab, or viewport boundary.

## 7. Keep feedback immediate and stable

- Follow [Doherty Threshold](https://lawsofux.com/doherty-threshold/): target
  interactions below 400ms, and show clear progress for slower operations.
- Disable the submitted action, show a pending state, and prevent duplicate
  submissions.
- Keep successful, loading, and failed states close to the action that caused
  them. Use toasts for brief global feedback, not as the only place for important
  validation errors.
- Avoid layout shifts during loading, saving, and route changes.
- Preserve input on validation failure. Do not reset the entire form unless the
  user explicitly confirms it.

## 8. Chunk and label information

- Apply [Chunking](https://lawsofux.com/chunking/) and
  [Miller's Law](https://lawsofux.com/millers-law/): divide dense content into
  meaningful sections and keep short lists short.
- Put labels above or beside their controls consistently.
- Use meaningful labels, summaries, and headings; avoid unexplained abbreviations
  unless the users already understand the domain.
- A large table or log should be bounded or paginated rather than allowed to grow
  indefinitely in the interface and persisted state.

## 9. Support mental models and interruption

- Follow [Mental Model](https://lawsofux.com/mental-model/) and
  [Tesler's Law](https://lawsofux.com/teslers-law/): keep the system vocabulary
  consistent with what users expect.
- Do not move or rename controls without a clear reason.
- Make state explicit. Show whether a setting applies globally, locally,
  privately, publicly, or to one roll/item.
- Preserve unsaved form state within an active editing session.
- Do not trap a user in a modal or nested scroll area without an obvious exit.

## 10. Make destructive actions deliberate

- Separate destructive actions from the main positive action.
- Name the object and consequence in confirmation text:
  `Delete Greatclub from blep?` is clearer than `Are you sure?`
- Prefer undo for reversible mistakes. Require confirmation for irreversible
  deletion or account changes.
- Keep delete controls visually distinct and do not make them the default action.

## 11. Use feedback to guide attention

- [Selective Attention](https://lawsofux.com/selective-attention/) means the
  interface should emphasize the one or two items relevant to the current goal.
- Reserve strong color and motion for active state, validation, success, warning,
  or primary action.
- Avoid continuously animated elements, flashing content, or decorative motion
  that competes with task completion.
- Use hover for enhancement, never for information that is necessary on touch or
  keyboard devices.

## 12. Design for the full interaction lifecycle

- [The Peak-End Rule](https://lawsofux.com/peak-end-rule/) and
  [the Serial Position Effect](https://lawsofux.com/serial-position-effect/)
  suggest users remember strong moments and the beginning/end of a flow.
- Make important outcomes unambiguous. The completed state should clearly confirm
  what changed.
- Keep navigation and completion actions visible at the end of long flows.
- Do not let an error or empty state erase the rest of the user's context.
- Provide useful empty states that explain the next action.

## 13. Design for scroll and fixed surfaces

- One main scroll container is preferable to nested page and panel scrolling.
- Keep navigation, headers, and action bars fixed only when that improves
  repeated use. Otherwise let the content scroll normally.
- Add enough inset around scrollbars and fixed surfaces so controls are never
  visually flush against them.
- Nested scrolling is acceptable for self-contained lists or dialogs, but it
  must have a visible boundary and a clear keyboard/touch path.
- Never cover a toolbar, tab bar, browser/task bar edge, or important content
  with a floating panel.

## 14. Accessibility is required, not optional

- Use real buttons for actions and real links for navigation.
- Every control needs an accessible name. Labels must describe the control,
  not the implementation.
- Preserve keyboard operation and visible focus states.
- Do not rely on color alone to communicate state or status.
- Respect `prefers-reduced-motion`.
- Ensure text has sufficient contrast on parchment and colored surfaces.
- Avoid tiny text, especially for data, metadata, and action labels.
- Recheck layout at desktop and mobile widths. Test with narrow viewports,
  long names, long labels, and localized text.

## 15. Review checklist

Before finishing an interface change, verify:

- [ ] The main task and primary action are clear within the first viewport.
- [ ] Fewer choices or less text would not make the task harder.
- [ ] Labels, patterns, and terminology match existing app conventions.
- [ ] Related controls are grouped and irrelevant controls are subordinate.
- [ ] Actions fit touch targets and align with adjacent controls.
- [ ] Icons are visually and mechanically centered.
- [ ] Loading, success, empty, validation, and error states are explicit.
- [ ] Nothing important is hidden behind hover.
- [ ] Fixed and floating surfaces stay below toolbars and outside system UI.
- [ ] Scrolling is deliberate, bounded, and not duplicated unnecessarily.
- [ ] Keyboard and screen-reader users can understand and operate the flow.
- [ ] Narrow screens and long content do not break the layout.
- [ ] Only necessary data is persisted or rendered; lists and logs have limits.
- [ ] The change has been visually checked in the running app.

## Reference

Full reference: [laws of ux](https://lawsofux.com/)

Machine-readable reference: [Laws of UX llms.txt](https://lawsofux.com/llms.txt)
