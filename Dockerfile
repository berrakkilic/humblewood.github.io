FROM node:20-slim

WORKDIR /app

# Install dependencies first (better layer caching on rebuilds)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

RUN useradd --shell /bin/bash -u 10001 humblewood

# Copy the rest of the app
COPY --chown=humblewood:humblewood . .

# Data (SQLite), server-side music and uploaded images live here — mount these as volumes
# so they survive container restarts/rebuilds.
RUN mkdir -p /app/data/music /app/public/uploads

# Fix permissions (This may be unneccesary)
RUN chown -R humblewood:humblewood /app

ENV PORT=3000
EXPOSE 3000

USER humblewood

CMD ["node", "server.js"]
