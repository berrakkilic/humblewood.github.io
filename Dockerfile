FROM node:20-slim AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY frontend ./frontend
COPY scripts/build-frontend.js ./scripts/build-frontend.js
COPY tsconfig.frontend.json ./
RUN mkdir -p public && npm run build:frontend

FROM node:20-slim

WORKDIR /app

# Install dependencies first (better layer caching on rebuilds)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

RUN useradd --shell /bin/bash -u 10001 humblewood

# Copy the rest of the app
COPY --chown=humblewood:humblewood . .
COPY --from=frontend-build --chown=humblewood:humblewood /app/public/app.js /app/public/app.js
COPY --from=frontend-build --chown=humblewood:humblewood /app/public/app.js.map /app/public/app.js.map

# Data (SQLite), server-side music and uploaded images live here — mount these as volumes
# so they survive container restarts/rebuilds.
RUN mkdir -p /app/data/music /app/public/uploads

# Fix permissions (This may be unneccesary)
RUN chown -R humblewood:humblewood /app

ENV PORT=3000
EXPOSE 3000

USER humblewood

CMD ["node", "server.js"]
