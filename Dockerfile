# Multi-stage build for all Railway services
# COMPONENT env var selects which service to run

# ── Build stage ──────────────────────────────────────────
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/temporal-workflows/package.json packages/temporal-workflows/package.json
COPY packages/temporal-activities/package.json packages/temporal-activities/package.json
COPY packages/temporal-client/package.json packages/temporal-client/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/honcho/package.json packages/honcho/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY workers/runner/package.json workers/runner/package.json
COPY workers/realtime/package.json workers/realtime/package.json
COPY apps/api-gateway/package.json apps/api-gateway/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY workers/ workers/
COPY apps/api-gateway/ apps/api-gateway/

# Build all packages
RUN pnpm turbo build

# ── Runtime stage ────────────────────────────────────────
FROM node:20-slim AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app ./

# COMPONENT env var determines what runs:
#   HTTP services: api-gateway, realtime
#   Temporal workers (via unified runner): presence-manager, process-manager,
#     tenant-manager, content-engine, identity-engine, analytics-engine,
#     knowledge-engine, channel-access, service-access,
#     content-process-access, perf-knowledge-access
ENV COMPONENT=api-gateway

# Entrypoint script that selects the right service
COPY <<'ENTRYPOINT' /app/entrypoint.sh
#!/bin/sh
set -e
case "$COMPONENT" in
  api-gateway)
    echo "Starting API Gateway (C3)..."
    cd apps/api-gateway && node dist/index.js
    ;;
  realtime)
    echo "Starting Realtime SSE (I1)..."
    cd workers/realtime && node dist/index.js
    ;;
  presence-manager|process-manager|tenant-manager|content-engine|identity-engine|analytics-engine|knowledge-engine|channel-access|service-access|content-process-access|perf-knowledge-access)
    echo "Starting Temporal worker: $COMPONENT..."
    cd workers/runner && node dist/index.js
    ;;
  *)
    echo "Unknown COMPONENT: $COMPONENT"
    echo "Valid: api-gateway, realtime, presence-manager, process-manager, tenant-manager,"
    echo "  content-engine, identity-engine, analytics-engine, knowledge-engine,"
    echo "  channel-access, service-access, content-process-access, perf-knowledge-access"
    exit 1
    ;;
esac
ENTRYPOINT

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000 8001

CMD ["/app/entrypoint.sh"]
