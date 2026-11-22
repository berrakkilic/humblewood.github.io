FROM node:20-slim AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY frontend ./frontend
COPY scripts/build-frontend.js ./scripts/build-frontend.js
COPY tsconfig.frontend.json ./
COPY tsconfig.frontend.strict.json ./
RUN mkdir -p public && npm run build:frontend

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Install dependencies first (better layer caching on rebuilds)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

RUN groupadd --gid 10001 humblewood \
    && useradd --uid 10001 --gid humblewood --no-log-init --no-create-home --shell /usr/sbin/nologin humblewood \
    && install -d --owner=humblewood --group=humblewood /app/data /app/data/music /app/public/uploads

# Copy only runtime files; keep source, tests, and build tools out of the image.
COPY --chown=humblewood:humblewood server.js ./server.js
COPY --chown=humblewood:humblewood src ./src
COPY --chown=humblewood:humblewood public ./public
COPY --from=frontend-build --chown=humblewood:humblewood /app/public/app.js /app/public/app.js
COPY --from=frontend-build --chown=humblewood:humblewood /app/public/app.js.map /app/public/app.js.map

EXPOSE 3000
VOLUME ["/app/data", "/app/public/uploads"]

USER humblewood

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/readyz').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
