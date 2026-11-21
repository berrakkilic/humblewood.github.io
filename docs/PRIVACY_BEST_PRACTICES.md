# Privacy Best Practices

The Humblewood Table is a private campaign tool. Privacy should be built into
the default experience rather than delegated to players through complex
consent prompts.

## Core principles

- **Privacy-protective defaults:** Do not load third-party resources,
  analytics, trackers, or remote media unless the user explicitly chooses a
  clearly explained action.
- **Data minimization:** Collect only the name, account credentials, campaign
  state, and uploaded files required to run the table. Do not add telemetry or
  behavioral profiles.
- **Purpose limitation:** Use account, character, presence, upload, and
  campaign data only for authentication and table functionality.
- **Transparency:** Explain what is stored, where it is stored, and relevant
  retention behavior near account, upload, and sharing controls.
- **Trustworthy agency:** Prefer local assets, same-origin requests, secure
  defaults, and server-side authorization. Do not make players manage
  complicated privacy settings to avoid unnecessary disclosure.

## Data inventory and boundaries

Every feature that handles information must be classifiable before it is
merged:

| Data | Necessary purpose | Allowed access | Retention and deletion |
| --- | --- | --- | --- |
| Display name and player account | Identify a participant and authorize table actions | The table server; DM-only views where required by the feature | Keep only while the account is needed; provide a deletion path |
| Password, PIN, and session cookie | Authenticate a participant | Authentication code only; never UI, logs, or analytics | Store passwords as hashes, never store PINs in logs, and expire sessions |
| Characters, tokens, scenes, rolls, and presence | Operate the current campaign | Only the DM and players who need the relevant table view | Keep for campaign continuity; bound collections and remove stale data |
| Uploaded maps, handouts, and audio | Deliver assets explicitly selected for the table | Authorized table participants; never an external origin by default | Remove when no longer needed and prune missing or orphaned files |
| Notifications and operational logs | Deliver DM notifications and diagnose failures | Intended recipient or server operators with a legitimate need | Keep bounded; do not retain private content longer than necessary |

Do not collect IP addresses, device fingerprints, precise location, contact
lists, advertising identifiers, behavioral profiles, or telemetry merely because
a browser or library makes them available. Request a new field only when the
feature cannot work without it, and record its purpose, access scope, retention,
deletion behavior, and user-facing explanation in the change review.

## Browser and network requirements

- Do not load remote fonts, scripts, stylesheets, images, audio, frames,
  analytics, or telemetry automatically.
- Keep `Content-Security-Policy` restrictive: default to `'self'`, allow only
  the local media and frame capabilities the application actually uses, and
  keep `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'self'`.
- Use `Referrer-Policy: no-referrer` so navigation does not disclose campaign
  URLs or page paths. External links must be explicit, open safely, and state
  that the destination is outside this application.
- Use `Permissions-Policy` to disable capabilities the table does not need,
  including camera, microphone, geolocation, and payment access.
- Use same-origin `postMessage` targets and validate `event.source`,
  `event.origin`, message type, and payload before acting.
- Do not request camera, microphone, geolocation, clipboard, notification, or
  persistent storage access without a specific feature, a clear explanation,
  and a user action at the point of need.

## Storage, cookies, and retention

- Prefer in-memory state for transient UI behavior. Keep local storage limited
  to non-sensitive preferences; never put credentials, session tokens, private
  campaign state, or uploaded content there.
- Authentication cookies must be `HttpOnly`, `SameSite`, scoped narrowly, and
  `Secure` over HTTPS. Sessions must expire and be invalidated on logout.
- Set explicit bounds for accounts, notifications, logs, uploads, media, and
  campaign collections. A bound must have a defined behavior when reached
  (reject, replace oldest, or require explicit deletion).
- Document how a DM can delete accounts, sessions, notifications, uploads, and
  campaign assets. Deleting a reference must not leave an orphaned private
  file.
- Avoid indefinite backups and logs. Apply the same purpose and retention
  limits to operational copies as to the primary record.

## Transparency and user agency

Explain, near the relevant control:

1. what is collected or uploaded;
2. why it is needed;
3. who can see it;
4. where it is sent or stored; and
5. how long it remains and how it can be removed.

Do not hide a privacy consequence behind a generic “continue” action. A user
should be able to cancel an upload, decline an optional capability, or remove
their data without navigating a maze of settings. Safety controls should be
anonymous where feasible and should not expose the identity of the person
requesting help to other players.

## Repository rules

- Keep fonts, scripts, styles, images, audio, and frames same-origin unless a
  feature explicitly requires otherwise.
- Maintain a restrictive Content Security Policy and `no-referrer` policy.
- Do not add analytics, advertising, fingerprinting, session replay, or
  third-party telemetry.
- Do not log passwords, PINs, session tokens, uploaded contents, or private
  campaign state.
- Sharing a handout or campaign asset must remain an explicit DM action and
  must not silently disclose it to an external origin.
- Treat third-party links as navigation, not embedded resources. Do not pass
  campaign identifiers, user names, or private state in their URLs.
- Dependencies and generated assets must be checked for analytics, remote
  requests, unexpected storage, and permission prompts before adoption.

## Review checklist

- [ ] Does this change create an automatic request to another origin?
- [ ] Does it use a browser permission, cookie, storage area, or new network
      metadata? If so, is the need and scope explicit?
- [ ] Is each new field necessary for the immediate feature, with documented
      purpose, access, retention, and deletion?
- [ ] Is the purpose, destination, visibility, and retention clear to users?
- [ ] Could the same feature work with a local or less identifying value?
- [ ] Are access control, same-origin messaging, sharing, logs, deletion, and
      orphan cleanup covered?
- [ ] Do tests prevent accidental third-party resource loading and wildcard
      message targets?
- [ ] Have production headers, cookies, permissions, and error logs been
      verified in the running application?
