# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# --- build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder so the build never needs a reachable database (pages are dynamic).
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/app_db
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime (includes yt-dlp + ffmpeg so platform links work) ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN apk add --no-cache python3 py3-pip ffmpeg ca-certificates curl \
 && pip install --no-cache-dir --break-system-packages -U yt-dlp \
 && ln -sf /usr/bin/python3 /usr/local/bin/python
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY package.json next.config.ts drizzle.config.json ./
COPY public ./public
COPY drizzle ./drizzle
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1
CMD ["npm", "run", "start"]
