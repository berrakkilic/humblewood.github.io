# Node.js Best Practices

These rules adapt the supplied Node.js best-practices reference to this
Express, Socket.IO, SQLite/libSQL, and Docker application. They complement the
backend coding and performance guides rather than replacing them.

## Application structure

- Keep HTTP routes in `src/server/http-app.js`.
- Keep room state, persistence, normalization, and lifecycle operations in
  `src/server/room.js`.
- Keep Socket.IO features in focused files under `src/server/socket/`.
- Keep configuration in `src/server/config.js`.
- Prefer small modules with one responsibility over adding unrelated behavior
  to `server.js`.

## Errors and async work

- Use `async`/`await` and await database, file, and shutdown operations.
- Return explicit HTTP errors or Socket.IO denials; do not silently convert
  failures into successful responses.
- Keep client messages safe and concise while retaining useful server-side
  diagnostics.
- Handle expected operational failures at the boundary that can explain them.
- Add centralized error handling if the HTTP surface grows beyond the current
  focused route set.
- Add process-level handling for unhandled rejections and uncaught exceptions
  only when the policy distinguishes logging, shutdown, and recovery clearly.

## Validation and security

- Validate type, size, shape, syntax, semantics, ownership, and authorization
  at every HTTP and socket boundary.
- Keep secrets in environment variables; never commit PINs, passwords, tokens,
  database credentials, or runtime uploads.
- Hash passwords with a suitable password-hashing algorithm and use secure,
  appropriately scoped session cookies.
- Escape user-controlled HTML and use allowlisted asset URLs.
- Limit request bodies, uploads, collections, logs, and expensive operations.
- Add rate limiting or brute-force protection before exposing authentication or
  upload routes publicly.
- Add security headers and automated dependency auditing before treating a
  deployment as production-hardened.

## Persistence and reliability

- Normalize restored state before exposing it to clients.
- Keep persisted schemas backward-compatible or add an explicit migration.
- Bound retained logs, notifications, playlists, tokens, and other collections.
- Broadcast only after validation, mutation, derived state, and persistence
  complete successfully.
- Preserve database, upload, and music volumes across deployments.
- Shut down HTTP, Socket.IO, database, and file resources gracefully.
- Keep `/healthz`, `/readyz`, persistence metrics, and deployment checks
  operationally useful without exposing sensitive data.

## Testing and quality

- Run `npm test` before completing backend changes.
- Prefer public HTTP/socket integration tests for authorization, persistence,
  reconnect, malformed input, and rejection behavior.
- Use focused unit tests for pure normalization and calculation helpers.
- Test realistic SQLite/libSQL behavior instead of replacing all persistence
  with mocks.
- Add linting, coverage, and dependency-audit tooling when the project adopts
  those quality gates consistently.

## Deployment

- Use `npm ci` from the committed lockfile.
- Keep the Node.js version explicit and use an active LTS release.
- Set `NODE_ENV=production` and a unique `DM_PIN` in production.
- Keep Docker startup, persistent volumes, health checks, and rollback
  procedures documented.
- Prefer platform or reverse-proxy responsibility for TLS, compression, and
  process supervision when available.

## Review checklist

- [ ] Inputs, uploads, collections, and expensive operations are bounded.
- [ ] Authorization is enforced server-side.
- [ ] Errors are explicit and safe for clients.
- [ ] Secrets and private state are not logged or exposed.
- [ ] Persistence and shutdown behavior are tested.
- [ ] Health/readiness and deployment behavior remain valid.
- [ ] `npm test` passes.

## Source

Adapted from the supplied “Node.js Best Practices” reference and the
repository's backend guides.
