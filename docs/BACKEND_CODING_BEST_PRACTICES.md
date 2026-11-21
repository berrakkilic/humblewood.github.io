# Backend Coding Best Practices

Use these rules when writing or reviewing Express, Socket.IO, persistence,
authentication, upload, or server-state code. This guide adapts
[backend best practices](https://github.com/Sairyss/backend-best-practices)
to the actual structure of this Node.js repository.

## 1. Keep architecture explicit

- Keep HTTP routes in `src/server/http-app.js`.
- Keep room state and shared room operations in `src/server/room.js`.
- Keep socket features in focused files under `src/server/socket/`.
- Keep default values in `src/server/default-state.js`.
- Keep configuration in `src/server/config.js`.
- Add a module rather than a new concept in `room.js` only when it improves
  responsibility boundaries or testability.

## 2. Use the public behavior boundary

- Prefer behavioral and integration tests over tests coupled to private helpers.
- Test socket events, HTTP responses, authorization, persistence, and
  synchronized state.
- Mock external I/O only in focused use-case tests when complete infrastructure
  would be slower or less reliable.
- Do not assert implementation details unless the test documents a genuinely
  important complex algorithm.

## 3. Validate at every boundary

Validate cheap constraints first:

1. Identity and origin.
2. Existence and null/undefined values.
3. String, array, object, or file size.
4. Character set and syntax.
5. Semantics against current room, character, NPC, scene, or token state.
6. Authorization and ownership.

- Reject invalid input with an explicit denied action or HTTP status.
- Use bounds instead of accepting arbitrary numbers, text, arrays, or files.
- Recheck authorization after state lookup; do not trust a name, ID, or role
  supplied by the client.

## 4. Enforce least privilege

- DM-only behavior must be rejected by the server even if the UI hides it.
- Character edits and rolls must verify ownership or management rights.
- NPC changes must require a DM role.
- Private roll payloads must never be broadcast to public sockets.
- Account changes must validate both the caller and target.
- Do not expose sensitive state, tokens, passwords, or private fields in logs.

## 5. Define success and failure clearly

- Use the repository's existing `deny()` helper for socket authorization failures.
- Return useful HTTP status and a safe error message.
- Do not turn expected authorization, validation, or missing-state failures into
  success-shaped responses.
- Preserve detailed server diagnostics, but send only necessary information to
  the client.
- Log at the appropriate level and avoid logging the same benign denial repeatedly.

## 6. Keep functions self-documenting

- Use descriptive functions and variable names.
- A function should perform one operation: validate, mutate, persist, or emit.
- Avoid comments that repeat code.
- Comment only non-obvious invariants, protocol behavior, or compatibility rules.
- Prefer small pure functions for normalization and calculations.
- Keep feature socket handlers readable and ordered by authentication, validation,
  authorization, mutation, persistence, and synchronization.

## 7. Handle state consistently

- Start from `default-state.js` and normalize restored persisted state.
- Preserve a stable shape for roll logs, scenes, jukebox, inventory, and initiative.
- Trim unbounded collections at the server and restore-time boundary.
- Use existing room helpers for character updates and token synchronization.
- Do not mutate nested state after persistence if a later socket event can reject
  or overwrite it; complete validation first.
- Broadcast after persistence and derived state updates are complete.

## 8. Database and storage practices

- Keep schema/data migration changes explicit and backward-compatible.
- Back up and restore the persistent database and upload volumes.
- Never destructively replace production state for a local convenience change.
- Seed only known, safe defaults.
- Persist only the state that belongs to the room.
- Use bounded arrays and explicit retention for logs and notifications.
- Test the actual SQLite/libSQL behavior with integration tests where practical.

## 9. Upload and file safety

- Validate file type and size before accepting an upload.
- Keep uploaded content in configured persistent directories.
- Store metadata separately from file bytes.
- Generate or preserve safe filenames and verify paths remain inside the upload
  root.
- Reject mismatched content, traversal paths, and unexpected extensions.
- Clean temporary files and partial uploads after failures.
- Do not commit runtime uploads or music to the Git repository.

## 10. Testing

- Run `npm test` before completing backend changes.
- Add integration tests for behavior this change introduces or fixes.
- Test rejection paths, ownership/role boundaries, malformed input, and data
  trimming.
- Cover persistence and reconnect behavior when state survives restarts.
- Prefer fast unit tests for pure calculations and integration tests for public
  HTTP/socket behavior.
- Use a realistic test database or room state rather than weakening tests by
  replacing all server behavior with mocks.

## 11. Configuration and process lifecycle

- Read deployment settings from `src/server/config.js` and environment variables.
- Add new environment variables to README and Docker configuration when required.
- Provide a safe development default only when it cannot expose production data.
- Never commit DM PINs, auth secrets, database credentials, or API keys.
- Handle process shutdown by closing the HTTP server, sockets, database, and
  temporary resources.
- Keep Docker and local startup paths documented and reproducible.

## 12. Code formatting and maintainability

- Preserve the repository's JavaScript style and semicolon conventions.
- Add comments only for a non-obvious invariant or compatibility constraint.
- Remove dead handlers and stale fields as part of the feature change.
- Use early guards and flat control flow for socket payload validation.
- Avoid large repeated inline object construction.
- Keep imports/module exports clear and avoid adding circular dependencies.
- Update directly related README or API documentation with changed behavior.

## 13. Backend review checklist

- [ ] The change has a clear module responsibility.
- [ ] All payload, file, and query inputs are bounded and validated.
- [ ] Authorization is enforced server-side.
- [ ] Private and public state are separated.
- [ ] Persistence shape is backward-compatible or intentionally migrated.
- [ ] Socket and HTTP error paths are explicit.
- [ ] No sensitive data is logged or sent to unauthorized clients.
- [ ] State lists and logs have explicit limits.
- [ ] Duplicate, stale, and replayed events are handled safely.
- [ ] Tests cover public behavior and important rejection paths.
- [ ] Docker/local startup and persistent-volume behavior remain intact.
- [ ] `npm test` passes.

## Reference

- [Sairyss backend best practices](https://github.com/Sairyss/backend-best-practices)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
