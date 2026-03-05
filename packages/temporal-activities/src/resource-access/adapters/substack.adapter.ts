// Substack adapter — uses substack-api npm package for Notes publishing.

import { SubstackClient } from "substack-api";
import type { PlatformAdapter } from "../channel.activities.js";

/**
 * Parses the accessToken for Substack connections.
 *
 * Storage format (base64-encoded JSON):
 * {
 *   "substack_sid": "<substack.sid cookie>",
 *   "connect_sid": "<connect.sid cookie>",
 *   "publicationUrl": "https://example.substack.com"
 * }
 *
 * The substack-api library expects { token, publicationUrl } where token is
 * a base64-encoded JSON of { substack_sid, connect_sid }. We build that here.
 */
function parseSubstackCredentials(accessToken: string): {
  token: string;
  publicationUrl: string;
} {
  const decoded = JSON.parse(
    Buffer.from(accessToken, "base64").toString("utf-8"),
  );
  if (!decoded.substack_sid || !decoded.connect_sid || !decoded.publicationUrl) {
    throw new Error(
      "Substack accessToken must be base64-encoded JSON with { substack_sid, connect_sid, publicationUrl }",
    );
  }
  // Build the inner token the library expects
  const token = Buffer.from(
    JSON.stringify({ substack_sid: decoded.substack_sid, connect_sid: decoded.connect_sid }),
  ).toString("base64");
  return { token, publicationUrl: decoded.publicationUrl };
}

export const substackAdapter: PlatformAdapter = {
  async post({ accessToken, content }) {
    const creds = parseSubstackCredentials(accessToken);
    const client = new SubstackClient(creds);

    const text = [content.title, content.body].filter(Boolean).join("\n\n");
    const profile = await client.ownProfile();
    const result = await profile.publishNote(text);

    return {
      platformPostId: String(result.id),
      url: undefined, // Substack Notes don't return a direct URL from the API
    };
  },

  async getMetrics({ platformPostIds }) {
    // Substack doesn't expose metrics via API — return zero-value metrics
    return platformPostIds.map((id) => ({
      contentId: id,
      impressions: 0,
      engagements: 0,
      clicks: 0,
      reach: 0,
      engagementRate: 0,
      rawPlatformData: {
        _note: "Substack metrics not available via API",
      },
    }));
  },
};
