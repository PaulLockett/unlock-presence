#!/usr/bin/env tsx
/**
 * Push environment variables to Railway services.
 * Routes each variable to the correct subset of services based on the routing matrix.
 *
 * Usage: tsx scripts/push-env-to-railway.ts [--dry-run]
 *
 * Reads from .env and pushes to the linked Railway project.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ALL_SERVICES = [
  "api-gateway",
  "realtime",
  "presence-manager",
  "process-manager",
  "tenant-manager",
  "content-engine",
  "identity-engine",
  "analytics-engine",
  "knowledge-engine",
  "channel-access",
  "service-access",
  "content-process-access",
  "perf-knowledge-access",
] as const;

const TEMPORAL_WORKERS = ALL_SERVICES.filter(
  (s) => s !== "api-gateway" && s !== "realtime",
);

type ServiceName = (typeof ALL_SERVICES)[number];

const VAR_ROUTING: Record<string, readonly ServiceName[] | "ALL"> = {
  // Temporal → ALL Temporal workers
  TEMPORAL_API_KEY: TEMPORAL_WORKERS,
  TEMPORAL_NAMESPACE: TEMPORAL_WORKERS,
  TEMPORAL_REGIONAL_ENDPOINT: TEMPORAL_WORKERS,

  // Supabase → RA3, RA4 (data access) + api-gateway (auth validation)
  SUPABASE_DB_URL: ["content-process-access", "perf-knowledge-access"],
  NEXT_PUBLIC_SUPABASE_URL: [
    "content-process-access",
    "perf-knowledge-access",
    "api-gateway",
  ],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: [
    "content-process-access",
    "perf-knowledge-access",
    "api-gateway",
  ],
  SUPABASE_SERVICE_ROLE_KEY: [
    "content-process-access",
    "perf-knowledge-access",
  ],

  // Upstash → api-gateway, realtime (caching/rate-limiting)
  UPSTASH_REDIS_REST_URL: ["api-gateway", "realtime"],
  UPSTASH_REDIS_REST_TOKEN: ["api-gateway", "realtime"],

  // AI → engines only
  OPENROUTER_API_KEY: [
    "content-engine",
    "identity-engine",
    "analytics-engine",
    "knowledge-engine",
  ],

  // Channel credentials → channel-access only
  UNIPILE_API_KEY: ["channel-access"],
  UNIPILE_DSN: ["channel-access"],
  X_BEARER_TOKEN: ["channel-access"],
  X_CONSUMER_KEY: ["channel-access"],
  X_SECRET_KEY: ["channel-access"],

  // Honcho → knowledge-engine (U6 is a library used by E4)
  HONCHO_API_KEY: ["knowledge-engine"],

  // PostHog → api-gateway (server-side analytics)
  POSTHOG_API_KEY: ["api-gateway"],

  // QStash → all Temporal workers (producers) + realtime (consumer)
  QSTASH_TOKEN: [...TEMPORAL_WORKERS, "realtime"],
  QSTASH_CURRENT_SIGNING_KEY: ["realtime"],
  QSTASH_NEXT_SIGNING_KEY: ["realtime"],
  REALTIME_SERVICE_URL: TEMPORAL_WORKERS,

  // Resend → Temporal workers that send notifications
  RESEND_API_KEY: TEMPORAL_WORKERS,

  // Service auth
  SERVICE_TOKEN_SECRET: "ALL" as const,
  SUPABASE_JWT_SECRET: ["api-gateway", "realtime"],
};

function parseEnvFile(path: string): Record<string, string> {
  const content = readFileSync(path, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    let value = trimmed.slice(eqIdx + 1);
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const scriptDir =
    import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(scriptDir, "../.env");
  const vars = parseEnvFile(envPath);

  for (const [varName, targets] of Object.entries(VAR_ROUTING)) {
    const value = vars[varName];
    if (!value) {
      console.log(`SKIP ${varName}: not set in .env`);
      continue;
    }

    const services = targets === "ALL" ? [...ALL_SERVICES] : targets;
    for (const service of services) {
      if (dryRun) {
        console.log(
          `DRY RUN: railway variables set ${varName}=*** --service ${service}`,
        );
      } else {
        try {
          execSync(
            `railway variables set "${varName}=${value}" --service "${service}"`,
            { stdio: "pipe" },
          );
          console.log(`SET ${varName} → ${service}`);
        } catch (err) {
          console.error(`FAILED ${varName} → ${service}:`, err);
        }
      }
    }
  }
}

main();
