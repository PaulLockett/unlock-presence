// Adapter registry — maps platform string to PlatformAdapter implementation.

import type { PlatformAdapter } from "../channel.activities.js";
import { stubAdapter } from "./stub.adapter.js";
import { xAdapter } from "./x.adapter.js";
import { linkedInAdapter } from "./linkedin.adapter.js";
import { substackAdapter } from "./substack.adapter.js";

const adapterMap: Record<string, PlatformAdapter> = {
  x: xAdapter,
  linkedin: linkedInAdapter,
  substack: substackAdapter,
  email: stubAdapter,
  internal: stubAdapter,
};

export function getAdapter(platform: string): PlatformAdapter {
  const adapter = adapterMap[platform];
  if (!adapter) {
    throw new Error(`No adapter registered for platform: ${platform}`);
  }
  return adapter;
}
