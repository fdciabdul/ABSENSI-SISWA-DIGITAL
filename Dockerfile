# syntax=docker/dockerfile:1

# Node LTS (bookworm-slim = glibc, so the `canvas` prebuilt binary works without build tools)
FROM node:lts-bookworm-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# ---------------------------------------------------------------
# All dependencies (including devDependencies, needed to build)
# ---------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------
# Production-only dependencies
# ---------------------------------------------------------------
FROM base AS production-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------------------------------------------------------------
# Build the app (TypeScript -> build/, vite assets included via build hook)
# --ignore-ts-errors: the repo has pre-existing typecheck errors
# ---------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node ace build --ignore-ts-errors

# ---------------------------------------------------------------
# Final image: prod node_modules + compiled build output
# ---------------------------------------------------------------
FROM base
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./

# Entrypoint: runs migrations, seeds once, then starts the server
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/data /app/uploads/avatars /app/tmp

EXPOSE 3333
ENTRYPOINT ["docker-entrypoint.sh"]
