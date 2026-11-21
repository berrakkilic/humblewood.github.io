# Backend Performance Best Practices

Use these rules when changing the Express, Socket.IO, database, upload, or scene
server code in this repository. They combine the
[roadmap.sh Backend Performance](https://roadmap.sh/backend-performance-best-practices)
roadmap with practical limits for this small Node.js application.

## 1. Measure first

- Reproduce a slow request or socket flow before optimizing it.
- Profile Node.js CPU and memory with the same realistic state and payload size
  used by the campaign.
- Measure request latency, database latency, Socket.IO update frequency,
  persistence time, memory growth, and upload time.
- Optimize a measured critical path rather than rewriting the architecture.
- Run `npm test` and the integration suite after backend changes.

## 2. Keep API responses and requests bounded

- Enforce small, explicit limits on count, size, text length, array length,
  uploads, and pagination.
- Do not serialize the entire room state unless the client or protocol needs it.
- Send targeted socket updates where they are available instead of rebroadcasting
  the whole state.
- Use only needed database columns and avoid `SELECT *` for new code.
- Implement efficient pagination for large datasets and never render or persist
  an unbounded collection.
- Compress responses in production when it is beneficial.

## 3. Use caching carefully

- Cache immutable or frequently accessed assets and state only when invalidation
  is explicit.
- HTTP caching belongs on static assets, not private or per-user API responses.
- Use cache-aside, write-through, or read-through only when the consistency
  requirement justifies it.
- Never cache authorization decisions without verifying their current owner,
  role, and session.
- When state changes, invalidate or update every cache/derived copy predictably.

## 4. Protect database access

- Use the existing SQLite/libSQL connection and persistence path; do not create
  direct ad hoc connections for unrelated features.
- Open one connection lifecycle and reuse it safely.
- Add indexes for real query filters and sort fields.
- Avoid expensive JSON parsing, full-table scans, and repeated writes in loops.
- Batch compatible writes and persist only after the state actually changed.
- Use bounded reads and pagination for logs, scenes, lists, and notifications.
- Run maintenance and backup operations without interrupting live play.

## 5. Keep socket updates efficient

- Emit only the fields or entries needed by clients.
- Combine related updates instead of broadcasting many redundant events.
- Debounce or throttle high-frequency map, pointer, fog, and drawing updates.
- Do not persist and broadcast private DM-only data.
- Use a room-specific Socket.IO path and avoid broad global updates where a room
  or recipient update is sufficient.
- Close or ignore stale async operations and prevent duplicate event handling.

## 6. Asynchronous processing

- Do not block the event loop with CPU-heavy transformations or synchronous I/O.
- Move long uploads, exports, media processing, or maintenance to a background
  job or queue when they grow beyond an immediate request.
- Keep event handlers small: validate, authorize, mutate, persist, and emit.
- Use timeouts and bounded retries for external network dependencies.
- Batch work only when it preserves ordering and error semantics.

## 7. Optimize algorithms and hot paths

- Profile first, then replace the measured bottleneck.
- Avoid nested scans for room, character, NPC, token, scene, and initiative
  lookups when an index or map would reduce work.
- Cache derived values only with a clear invalidation point.
- Avoid repeated deep cloning and JSON serialization on every socket event.
- Keep state normalization and sanitization centralized.
- Preserve correctness and authorization; never optimize by trusting client
  input or removing server checks.

## 8. Security and throttling

- Validate origin, identity, ownership, size, shape, syntax, and semantics.
- Enforce server-side role checks for every DM-only, private, deletion, scene,
  and account operation.
- Apply login, join, upload, and expensive action throttling where needed.
- Keep secrets in environment variables and never log passwords, PINs, session
  tokens, or private roll content unnecessarily.
- Keep dependencies updated and audit third-party packages.

## 9. Logging and monitoring

- Log actionable request and operation failures without sensitive request data.
- Include room/session identifiers only when they are operationally useful and
  safe.
- Avoid synchronous or per-coordinate logging on hot paths.
- Monitor response time, socket error rate, upload failures, persistence failures,
  memory use, and database latency.
- Record slow database operations and make them attributable to a specific
  query or feature.

## 10. Reliability and deployment

- Shutdown gracefully and close HTTP, Socket.IO, database, and file resources.
- Preserve persisted data across deployments and document volume behavior.
- Make configuration environment-driven and reproducible.
- Use health checks and verify a deployment with the real route and socket
  startup path.
- Keep retry behavior bounded and avoid retry storms.
- Test backup and restore assumptions rather than assuming persistence survives
  every container operation.

## 11. Backend review checklist

- [ ] A real bottleneck was measured or the change has a clear bounded cost.
- [ ] Payloads and collections have explicit limits.
- [ ] State updates are targeted and private data stays private.
- [ ] Database reads/writes are bounded and batched when appropriate.
- [ ] Indexes and query patterns match real usage.
- [ ] Socket frequency is throttled or combined on hot paths.
- [ ] Authentication, authorization, validation, and ownership are server-side.
- [ ] Sensitive values are not logged or persisted unnecessarily.
- [ ] Async work has timeout, failure, and stale-result handling.
- [ ] Static assets use correct caching and uploads use size/type checks.
- `npm test` passes.
