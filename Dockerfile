# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim AS base

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PRISMA_CLIENT_ENGINE_TYPE binary
ENV PRISMA_QUERY_ENGINE_BINARY /app/node_modules/.prisma/client/query-engine-debian-openssl-1.1.x

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
