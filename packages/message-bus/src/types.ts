import type { SseEvent } from "@presence-os/schemas";

export interface WebhookPayload {
  event: SseEvent;
}

export interface PublishOptions {
  /** Delay delivery by this many seconds */
  delaySec?: number;
  /** Number of retries on failure (default: 3) */
  retries?: number;
}
