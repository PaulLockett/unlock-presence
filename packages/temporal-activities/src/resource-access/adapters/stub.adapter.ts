// Stub adapter — returns synthetic data for email, internal, and unit tests.

import type { PlatformAdapter } from "../channel.activities.js";

export const stubAdapter: PlatformAdapter = {
  async post({ platform }) {
    const id = `${platform}-${Date.now()}`;
    return { platformPostId: id, url: `https://${platform}.example.com/posts/${id}` };
  },

  async getMetrics({ platformPostIds }) {
    return platformPostIds.map((id) => ({
      contentId: id,
      impressions: 0,
      engagements: 0,
      clicks: 0,
      reach: 0,
      engagementRate: 0,
      rawPlatformData: {},
    }));
  },
};
