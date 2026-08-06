FROM node:20-slim

WORKDIR /app

# Install dependencies first (better layer caching on rebuilds)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Data (SQLite) and uploaded images live here — mount this as a volume
# so they survive container restarts/rebuilds.
RUN mkdir -p /app/data /app/public/uploads

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
