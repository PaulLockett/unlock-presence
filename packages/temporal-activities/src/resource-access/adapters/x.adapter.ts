// X/Twitter adapter — native fetch against X API v2.

import type { PlatformAdapter } from "../channel.activities.js";

const X_API_BASE = "https://api.x.com/2";

export class XApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "XApiError";
  }
}

async function xFetch(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new XApiError(
      `X API ${res.status}: ${res.statusText}`,
      res.status,
      body,
    );
  }
  return res;
}

export const xAdapter: PlatformAdapter = {
  async post({ accessToken, content }) {
    const text = [content.title, content.body].filter(Boolean).join("\n\n");
    const res = await xFetch(`${X_API_BASE}/tweets`, accessToken, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    const json = (await res.json()) as { data: { id: string } };
    return {
      platformPostId: json.data.id,
      url: `https://x.com/i/web/status/${json.data.id}`,
    };
  },

  async getMetrics({ accessToken, platformPostIds }) {
    const results: Array<{
      contentId: string;
      impressions: number;
      engagements: number;
      clicks: number;
      reach: number;
      engagementRate: number;
      rawPlatformData: Record<string, unknown>;
    }> = [];

    // X API v2 supports up to 100 tweet IDs per request
    const BATCH_SIZE = 100;
    for (let i = 0; i < platformPostIds.length; i += BATCH_SIZE) {
      const batch = platformPostIds.slice(i, i + BATCH_SIZE);
      const ids = batch.join(",");
      const res = await xFetch(
        `${X_API_BASE}/tweets?ids=${ids}&tweet.fields=public_metrics`,
        accessToken,
      );
      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          public_metrics: {
            impression_count: number;
            like_count: number;
            retweet_count: number;
            reply_count: number;
            quote_count: number;
            bookmark_count: number;
          };
        }>;
      };

      for (const tweet of json.data ?? []) {
        const pm = tweet.public_metrics;
        const engagements =
          pm.like_count + pm.retweet_count + pm.reply_count + pm.quote_count + pm.bookmark_count;
        const impressions = pm.impression_count;
        results.push({
          contentId: tweet.id,
          impressions,
          engagements,
          clicks: 0, // not available in public_metrics
          reach: impressions, // X doesn't expose unique reach
          engagementRate: impressions > 0 ? engagements / impressions : 0,
          rawPlatformData: pm as unknown as Record<string, unknown>,
        });
      }
    }

    return results;
  },
};
