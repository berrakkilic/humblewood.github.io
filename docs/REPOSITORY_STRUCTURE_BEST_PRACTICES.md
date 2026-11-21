# Repository Structure Best Practices

This repository is a small private application, so structure should improve
discoverability without adding ceremony that does not serve the campaign.

## Current layout

| Path | Responsibility |
| --- | --- |
| `src/server/` | Express, Socket.IO, persistence, configuration, and server features |
| `frontend/app/` | Editable TypeScript browser features |
| `frontend/types/` | Shared frontend declarations and contracts |
| `public/` | HTML, CSS, static handouts, and generated browser bundle |
| `test/` | Unit, structure, persistence, and integration tests |
| `scripts/` | Build and validation tooling |
| `docs/` | Best-practice, deployment, and contributor guidance |
| `.github/` | Copilot instructions and CI/deployment workflows |
| `data/` and `public/uploads/` | Runtime state; never commit new runtime content |

Keep generated `public/app.js` synchronized through the frontend build. Edit
the TypeScript source, not the generated bundle.

## Root-level files

- `README.md` explains local setup, development, deployment, and known
  operational behavior.
- `package.json` and `package-lock.json` define scripts and locked
  dependencies.
- `.env.example` documents configuration names without secrets.
- `Dockerfile`, `docker-compose.yml`, and `.dockerignore` define the container
  and persistent-volume contract.
- `tsconfig*.json` defines the supported TypeScript checks.

## Documentation expectations

Update the closest relevant documentation when behavior changes:

- Deployment, environment variables, health checks, and persistence belong in
  `README.md`.
- Coding and review rules belong in `docs/`.
- Frontend module responsibilities belong in `frontend/README.md`.
- Automation and repository-agent rules belong in `.github/`.

Add dedicated `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, or
`LICENSE` files when the project becomes public or accepts external
contributors. Do not add ceremonial files merely to imitate a template.

## Git and pull requests

- Work on a topic branch rather than committing directly to shared `main`.
- Keep commits coherent and use action-oriented messages such as
  `fix: validate upload ownership`.
- Include tests and directly related documentation in the same change.
- Open a pull request for review; merging is a separate decision.
- Describe behavior changes, validation performed, deployment impact, and
  follow-up work in the pull request.
- Never include secrets, local databases, generated runtime uploads, or
  personal environment files in a pull request.

## CI and release hygiene

- Keep `npm test` as the minimum CI gate.
- Build generated frontend assets in CI and fail if validation does not pass.
- Use the committed lockfile for reproducible installs.
- Keep deployment workflows small, observable, and reversible.
- Tag releases only after the pull request is reviewed and production behavior
  has been verified.

## Review checklist

- [ ] New files live in the directory that owns their responsibility.
- [ ] Generated files were rebuilt through the supported command.
- [ ] Runtime data and secrets are excluded.
- [ ] README/docs explain new operational behavior.
- [ ] Tests and CI gates pass.
- [ ] The pull request is focused and reviewable.

## Source

Adapted from the supplied “GitHub Repository Structure Best Practices”
reference and the repository's existing layout.
