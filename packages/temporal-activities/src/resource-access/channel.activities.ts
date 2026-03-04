// RA1: Channel Access — Encapsulates platform API volatility

import { createDb } from "@presence-os/db";
import { channelConnections, content, contentPerformance } from "@presence-os/db";
import { encryptToken, decryptToken } from "@presence-os/auth";
import { eq, and } from "drizzle-orm";
import { getAdapter } from "./adapters/index.js";

const getDb = () => createDb();
const getEncryptionSecret = () => {
  const secret = process.env.OAUTH_ENCRYPTION_SECRET;
  if (!secret) throw new Error("OAUTH_ENCRYPTION_SECRET is not set");
  return secret;
};

// --- Platform adapter seam ---

export interface PlatformAdapter {
  post(params: {
    accessToken: string;
    accountId: string;
    content: { title?: string | null; body?: string | null; mediaUrls?: string[] | null };
    platform: string;
  }): Promise<{ platformPostId: string; url?: string }>;

  getMetrics(params: {
    accessToken: string;
    accountId: string;
    platformPostIds: string[];
    platform: string;
  }): Promise<
    Array<{
      contentId: string;
      impressions: number;
      engagements: number;
      clicks: number;
      reach: number;
      engagementRate: number;
      rawPlatformData: Record<string, unknown>;
    }>
  >;
}

type AdapterFactory = (platform: string) => PlatformAdapter;
let adapterFactory: AdapterFactory = getAdapter;

/** Override adapter factory for testing. */
export function _setAdapterFactory(factory: AdapterFactory): void {
  adapterFactory = factory;
}

/** Reset adapter factory to default (real adapters). */
export function _resetAdapterFactory(): void {
  adapterFactory = getAdapter;
}

// --- Input types ---

interface ConnectInput {
  tenantId: string;
  brandId: string;
  platform: "x" | "linkedin" | "substack" | "email" | "internal";
  accountId: string;
  displayName?: string;
  profileUrl?: string;
  accessToken: string;
  refreshToken?: string;
}

interface DisconnectInput {
  tenantId: string;
  connectionId: string;
}

interface DistributeInput {
  tenantId: string;
  brandId: string;
  contentId: string;
  platform: "x" | "linkedin" | "substack" | "email" | "internal";
}

interface HarvestInput {
  tenantId: string;
  brandId: string;
  platform: "x" | "linkedin" | "substack" | "email" | "internal";
  contentIds: string[];
}

// --- Activities ---

export async function connect(input: ConnectInput): Promise<{ connectionId: string }> {
  const db = getDb();
  const secret = getEncryptionSecret();

  const [row] = await db
    .insert(channelConnections)
    .values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      platform: input.platform,
      accountId: input.accountId,
      displayName: input.displayName,
      profileUrl: input.profileUrl,
      accessTokenEncrypted: encryptToken(input.accessToken, secret),
      refreshTokenEncrypted: input.refreshToken
        ? encryptToken(input.refreshToken, secret)
        : null,
    })
    .returning({ id: channelConnections.id });

  return { connectionId: row.id };
}

export async function disconnect(input: DisconnectInput): Promise<{ revoked: boolean }> {
  const db = getDb();

  const result = await db
    .update(channelConnections)
    .set({
      isActive: false,
      accessTokenEncrypted: "",
      refreshTokenEncrypted: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(channelConnections.id, input.connectionId),
        eq(channelConnections.tenantId, input.tenantId),
      ),
    )
    .returning({ id: channelConnections.id });

  return { revoked: result.length > 0 };
}

export async function distribute(input: DistributeInput): Promise<{ platformPostId: string; url?: string }> {
  const db = getDb();

  // Fetch active connection for this brand + platform
  const [connection] = await db
    .select()
    .from(channelConnections)
    .where(
      and(
        eq(channelConnections.tenantId, input.tenantId),
        eq(channelConnections.brandId, input.brandId),
        eq(channelConnections.platform, input.platform),
        eq(channelConnections.isActive, true),
      ),
    )
    .limit(1);

  if (!connection) {
    throw new Error(
      `No active connection for brand ${input.brandId} on ${input.platform}`,
    );
  }

  // Fetch content
  const [contentRow] = await db
    .select({ title: content.title, body: content.body, mediaUrls: content.mediaUrls })
    .from(content)
    .where(and(eq(content.id, input.contentId), eq(content.tenantId, input.tenantId)));

  if (!contentRow) {
    throw new Error(`Content ${input.contentId} not found`);
  }

  // Decrypt credentials and post via platform adapter
  const secret = getEncryptionSecret();
  const accessToken = decryptToken(connection.accessTokenEncrypted, secret);
  const adapter = adapterFactory(input.platform);
  const result = await adapter.post({
    accessToken,
    accountId: connection.accountId,
    content: contentRow,
    platform: input.platform,
  });

  // Update connection lastUsedAt
  await db
    .update(channelConnections)
    .set({ lastUsedAt: new Date(), updatedAt: new Date() })
    .where(eq(channelConnections.id, connection.id));

  return result;
}

export async function harvest(input: HarvestInput): Promise<{ metricsCount: number }> {
  const db = getDb();

  // Fetch active connections for this brand + platform
  const [connection] = await db
    .select()
    .from(channelConnections)
    .where(
      and(
        eq(channelConnections.tenantId, input.tenantId),
        eq(channelConnections.brandId, input.brandId),
        eq(channelConnections.platform, input.platform),
        eq(channelConnections.isActive, true),
      ),
    )
    .limit(1);

  if (!connection) {
    throw new Error(
      `No active connection for brand ${input.brandId} on ${input.platform}`,
    );
  }

  // Decrypt credentials and fetch metrics via platform adapter
  const secret = getEncryptionSecret();
  const accessToken = decryptToken(connection.accessTokenEncrypted, secret);
  const adapter = adapterFactory(input.platform);
  const metrics = await adapter.getMetrics({
    accessToken,
    accountId: connection.accountId,
    platformPostIds: input.contentIds,
    platform: input.platform,
  });

  // Write metrics to contentPerformance
  if (metrics.length > 0) {
    await db.insert(contentPerformance).values(
      metrics.map((m) => ({
        tenantId: input.tenantId,
        contentId: m.contentId,
        platform: input.platform,
        impressions: m.impressions,
        engagements: m.engagements,
        clicks: m.clicks,
        reach: m.reach,
        engagementRate: m.engagementRate,
        rawPlatformData: m.rawPlatformData,
      })),
    );
  }

  return { metricsCount: metrics.length };
}
