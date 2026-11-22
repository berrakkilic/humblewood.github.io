# Docker Best Practices

These rules adapt Docker's build guidance to this Node.js application and its
SQLite, upload, and music storage. They cover image construction and runtime
configuration; they complement the Node.js and repository-structure guides.

## Build and image contents

- Use named multi-stage builds so the final image contains only runtime
  dependencies, server code, static assets, and generated frontend output.
- Copy package manifests and install with `npm ci` before copying frequently
  changed source files. Keep the lockfile committed.
- Use `.dockerignore` to keep Git history, local dependencies, runtime data,
  secrets, generated files, tests, and documentation out of the build context.
- Prefer explicit `COPY` instructions over copying the whole repository into the
  runtime image. Use `COPY --from` to transfer generated build output.
- Use trusted, supported base images and a slim variant. Tags such as
  `node:20-slim` can move; pin digests when reproducibility requires it and
  automate base-image update reviews.
- Keep build steps cacheable and avoid installing tools or packages that the
  runtime does not need.

## Runtime and security

- Set an absolute `WORKDIR` and use exec-form `CMD` so the application receives
  container signals directly.
- Run as a dedicated non-root user with a stable UID and GID. Give that user
  ownership only of directories that need writes.
- Set production configuration in the image or Compose service. Supply secrets
  at runtime; do not copy them into the image or pass them as build arguments.
- Keep mutable state in `/app/data` and `/app/public/uploads`, backed by named
  volumes in Compose. Do not rely on container writable layers for persistence.
- Expose only the port the service listens on and provide a health check against
  the application's readiness endpoint.
- Keep one application service per container and make the container replaceable
  from its image and persistent volumes.

## Project implementation

- `Dockerfile` builds the frontend in a separate stage, then copies only the
  server and public files into the runtime stage.
- `docker-compose.yml` sets production mode, requires a non-default `DM_PIN`,
  and mounts persistent database/music and upload volumes.
- `.dockerignore` excludes local state, secrets, generated frontend bundles,
  tests, docs, and Git metadata.
- The image uses `node:20-slim`, installs production dependencies in the runtime
  stage, runs as UID/GID 10001, and checks `/readyz`.

## Review checklist

- [ ] The Docker build succeeds from a clean checkout using the committed lockfile.
- [ ] The final stage excludes tests, TypeScript sources, development dependencies,
  local state, and secrets.
- [ ] Writable paths are explicitly owned by the non-root runtime user and
  persisted with named volumes.
- [ ] The health check reports the readiness of the running application.
- [ ] Base-image updates are reviewed and released deliberately.
- [ ] CI runs the test suite before building and publishing the image.

## Source

Adapted from Docker's “Building best practices” documentation and the supplied
Docker Docs reference: https://docs.docker.com/build/building/best-practices/.
