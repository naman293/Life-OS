FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat

# STAGE 1: Prune the workspace
FROM base AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
# Prune the workspace specifically for the web app
RUN turbo prune web --docker

# STAGE 2: Install dependencies
FROM base AS installer
WORKDIR /app
# Install dependencies using the pruned workspace lockfile
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

# STAGE 3: Build the application
FROM base AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=builder /app/out/full/ .
# Generate Prisma Client & Build
RUN npx prisma generate || true
# Pass through environment variables needed at build time
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RUN npx turbo run build --filter=web...

# STAGE 4: Production runner
FROM base AS runner
WORKDIR /app

# Non-root user for basic security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy essential config
COPY --from=sourcer /app/apps/web/next.config.ts .
COPY --from=sourcer /app/apps/web/package.json .

# Copy next.js artifacts. Next.js standalone mode reduces image size drastically
COPY --from=sourcer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=sourcer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=sourcer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

ENV NODE_ENV=production
ENV PORT=3000

# Next.js standalone outputs a server.js file inside standard directories
CMD ["node", "apps/web/server.js"]
