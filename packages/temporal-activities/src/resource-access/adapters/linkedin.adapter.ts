// LinkedIn adapter — native fetch against LinkedIn REST API.

import type { PlatformAdapter } from "../channel.activities.js";

const LI_API_BASE = "https://api.linkedin.com/rest";
const LI_VERSION = "202501";

export class LinkedInApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "LinkedInApiError";
  }
}

async function liFetch(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": LI_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LinkedInApiError(
      `LinkedIn API ${res.status}: ${res.statusText}`,
      res.status,
      body,
    );
  }
  return res;
}

export const linkedInAdapter: PlatformAdapter = {
  async post({ accessToken, accountId, content }) {
    const text = [content.title, content.body].filter(Boolean).join("\n\n");

    const postBody = {
      author: accountId, // LinkedIn URN (e.g., urn:li:person:abc or urn:li:organization:123)
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    };

    const res = await liFetch(`${LI_API_BASE}/posts`, accessToken, {
      method: "POST",
      body: JSON.stringify(postBody),
    });

    // LinkedIn returns the post URN in x-restli-id header
    const postUrn = res.headers.get("x-restli-id") ?? `li-${Date.now()}`;

    return {
      platformPostId: postUrn,
      url: undefined, // LinkedIn doesn't return a direct URL in the create response
    };
  },

  async getMetrics({ accessToken, accountId, platformPostIds }) {
    const results: Array<{
      contentId: string;
      impressions: number;
      engagements: number;
      clicks: number;
      reach: number;
      engagementRate: number;
      rawPlatformData: Record<string, unknown>;
    }> = [];

    const isOrg = accountId.includes("organization");

    for (const postId of platformPostIds) {
      try {
        if (isOrg) {
          // Organization accounts — share statistics endpoint
          const encodedUrn = encodeURIComponent(postId);
          const res = await liFetch(
            `${LI_API_BASE}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(accountId)}&shares=List(${encodedUrn})`,
            accessToken,
          );
          const json = (await res.json()) as {
            elements?: Array<{
              totalShareStatistics: {
                impressionCount: number;
                clickCount: number;
                likeCount: number;
                commentCount: number;
                shareCount: number;
                uniqueImpressionsCount: number;
              };
            }>;
          };

          const stats = json.elements?.[0]?.totalShareStatistics;
          if (stats) {
            const engagements = stats.likeCount + stats.commentCount + stats.shareCount;
            results.push({
              contentId: postId,
              impressions: stats.impressionCount,
              engagements,
              clicks: stats.clickCount,
              reach: stats.uniqueImpressionsCount,
              engagementRate:
                stats.impressionCount > 0
                  ? engagements / stats.impressionCount
                  : 0,
              rawPlatformData: stats as unknown as Record<string, unknown>,
            });
          }
        } else {
          // Member accounts — creator post analytics endpoint
          const encodedUrn = encodeURIComponent(postId);
          const res = await liFetch(
            `${LI_API_BASE}/memberCreatorPostAnalytics?q=entity&entity=${encodedUrn}&metricTypes=List(IMPRESSION,MEMBERS_REACHED,REACTION,COMMENT,RESHARE)`,
            accessToken,
          );
          const json = (await res.json()) as {
            elements?: Array<{
              metricType: string;
              value: number;
            }>;
          };

          const metricsMap: Record<string, number> = {};
          for (const el of json.elements ?? []) {
            metricsMap[el.metricType] = el.value;
          }

          const impressions = metricsMap["IMPRESSION"] ?? 0;
          const engagements =
            (metricsMap["REACTION"] ?? 0) +
            (metricsMap["COMMENT"] ?? 0) +
            (metricsMap["RESHARE"] ?? 0);

          results.push({
            contentId: postId,
            impressions,
            engagements,
            clicks: 0, // not available for member posts
            reach: metricsMap["MEMBERS_REACHED"] ?? 0,
            engagementRate: impressions > 0 ? engagements / impressions : 0,
            rawPlatformData: metricsMap as unknown as Record<string, unknown>,
          });
        }
      } catch (err) {
        // If a single post fails, push zeros rather than failing the whole batch
        results.push({
          contentId: postId,
          impressions: 0,
          engagements: 0,
          clicks: 0,
          reach: 0,
          engagementRate: 0,
          rawPlatformData: {
            _error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    return results;
  },
};
