import { NativeConnection, Worker } from "@temporalio/worker";
import { COMPONENTS, VALID_COMPONENTS } from "@presence-os/temporal-client";

const COMPONENT = process.env.COMPONENT;

if (!COMPONENT) {
  console.error("COMPONENT env var is required.");
  console.error(`Valid components: ${VALID_COMPONENTS.join(", ")}`);
  process.exit(1);
}

const config = COMPONENTS[COMPONENT];
if (!config) {
  console.error(`Unknown COMPONENT: ${COMPONENT}`);
  console.error(`Valid components: ${VALID_COMPONENTS.join(", ")}`);
  process.exit(1);
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

async function connectWithRetry(
  address: string,
  namespace: string,
  apiKey: string | undefined,
): Promise<NativeConnection> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await NativeConnection.connect({
        address,
        ...(apiKey && address.includes("tmprl.cloud")
          ? { tls: true, apiKey, metadata: { "temporal-namespace": namespace } }
          : {}),
      });
    } catch (err) {
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `${COMPONENT}: connection attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delay}ms...`,
        err instanceof Error ? err.message : err,
      );
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

async function run() {
  const address = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE ?? "default";
  const apiKey = process.env.TEMPORAL_API_KEY;

  console.log(`Starting ${COMPONENT} on queue: ${config.taskQueue}`);

  const connection = await connectWithRetry(address, namespace, apiKey);

  // Resolve workflows path for managers
  let workflowsPath: string | undefined;
  if (config.workflowSubpath) {
    workflowsPath = new URL(
      `../../packages/temporal-workflows/src/${config.workflowSubpath}/index.ts`,
      import.meta.url,
    ).pathname;
  }

  // Resolve activities for engines and resource access
  let activities: Record<string, (...args: unknown[]) => unknown> | undefined;
  if (config.activityModule && config.activityExport) {
    const mod = await import(config.activityModule);
    activities = mod[config.activityExport];
    if (!activities) {
      console.error(
        `Activity export "${config.activityExport}" not found in ${config.activityModule}`,
      );
      process.exit(1);
    }
  }

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue: config.taskQueue,
    ...(workflowsPath ? { workflowsPath } : {}),
    ...(activities ? { activities } : {}),
  });

  console.log(`${COMPONENT} worker started successfully`);

  // Graceful shutdown
  const shutdown = () => {
    console.log(`Shutting down ${COMPONENT}...`);
    worker.shutdown();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await worker.run();
  console.log(`${COMPONENT} worker stopped`);
}

run().catch((err) => {
  console.error(`${COMPONENT} worker failed:`, err);

  // If connection failed, idle instead of crash-looping.
  // This prevents Railway from marking deploys as failed in preview
  // environments where Temporal Cloud isn't configured.
  if (
    err instanceof Error &&
    (err.message.includes("ConnectError") ||
      err.message.includes("Transport"))
  ) {
    console.warn(
      `${COMPONENT}: entering idle mode — Temporal not reachable at ${process.env.TEMPORAL_ADDRESS ?? "localhost:7233"}`,
    );
    // Keep process alive; SIGTERM from Railway will still shut us down
    const shutdown = () => process.exit(0);
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    return;
  }

  process.exit(1);
});
