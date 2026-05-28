# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* env vars are inlined into the JS bundle at build time, NOT read at runtime.
# So we accept it as a build arg and re-export it as an env var the build step can see.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3001
WORKDIR /app
RUN apk add --no-cache tini && addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/next.config.js ./next.config.js

USER app
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start"]
