import { Honcho } from "@honcho-ai/sdk";

/**
 * Create a configured Honcho client for conversation memory.
 * This is a library — imported by Knowledge Engine (E4) activities, not a Temporal activity itself.
 *
 * The v2 SDK uses workspaceId scoping. If not provided, defaults to HONCHO_WORKSPACE_ID env var.
 */
export function createHonchoClient(options?: {
  apiKey?: string;
  workspaceId?: string;
}): Honcho {
  const apiKey = options?.apiKey ?? process.env.HONCHO_API_KEY;
  if (!apiKey) {
    throw new Error("HONCHO_API_KEY is required to create a Honcho client");
  }
  return new Honcho({
    apiKey,
    workspaceId: options?.workspaceId ?? process.env.HONCHO_WORKSPACE_ID ?? "default",
  });
}
