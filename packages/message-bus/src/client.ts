import { Client } from "@upstash/qstash";

/**
 * Create a QStash client for publishing events.
 * Each Temporal worker creates one client on startup.
 */
export function createQStashClient(token?: string): Client {
  const qstashToken = token ?? process.env.QSTASH_TOKEN;
  if (!qstashToken) {
    throw new Error("QSTASH_TOKEN is required to create a QStash client");
  }
  return new Client({ token: qstashToken });
}
