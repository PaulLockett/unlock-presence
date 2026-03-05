// RA3: Content Process Artifact Access — R1 (brand), R2 (content), R3 (task)

import { createDb } from "@presence-os/db";
import {
  brands,
  brandIdentities,
  channelConnections,
  content,
  contentAnnotations,
  tasks,
  taskResponses,
} from "@presence-os/db";
import { encryptToken } from "@presence-os/auth";
import { eq, and, gte, desc } from "drizzle-orm";

const getDb = () => createDb();
const getEncryptionSecret = () => {
  const secret = process.env.OAUTH_ENCRYPTION_SECRET;
  if (!secret) throw new Error("OAUTH_ENCRYPTION_SECRET is not set");
  return secret;
};

// --- Input types (scoped to this activity file) ---

interface ConfigureBrandInput {
  tenantId: string;
  brandId: string;
  config: {
    name?: string;
    contentPillars?: string[];
    autonomyLevel?: "manual" | "suggest" | "draft" | "autonomous";
    audienceDemographics?: Record<string, unknown>;
    description?: string;
    growthStage?: "launch" | "growth" | "mature";
  };
}

interface EvolveIdentityInput {
  tenantId: string;
  brandId: string;
  identityPrompt: string;
  refinementReason?: string;
}

interface RegisterChannelInput {
  tenantId: string;
  brandId: string;
  connectionData: {
    platform: "x" | "linkedin" | "substack" | "email" | "internal";
    accountId: string;
    displayName?: string;
    profileUrl?: string;
    accessToken: string;
    refreshToken?: string;
  };
}

interface RevokeChannelInput {
  tenantId: string;
  connectionId: string;
}

interface StageContentInput {
  tenantId: string;
  brandId: string;
  content: {
    type: "post" | "thread" | "article" | "newsletter" | "microsite" | "email_sequence";
    platform: "x" | "linkedin" | "substack" | "email" | "internal";
    title?: string;
    body?: string;
    mediaUrls?: string[];
    metadata?: Record<string, unknown>;
    producedBy?: "system" | "human" | "hybrid";
    campaignId?: string;
    templateId?: string;
    desiredPublishAt?: string;
  };
}

interface AdvanceContentInput {
  tenantId: string;
  contentId: string;
  targetStatus: "idea" | "draft" | "review" | "approved" | "scheduled" | "published" | "archived";
}

interface AnnotateContentInput {
  tenantId: string;
  contentId: string;
  annotation: {
    annotationType: "voice_alignment" | "performance_insight" | "strategic_guidance" | "content_brief" | "identity_signal";
    engine: "E1" | "E2" | "E3" | "E4";
    payload: Record<string, unknown>;
    confidenceScore?: number;
  };
}

interface SurfaceAnnotationsInput {
  tenantId: string;
  contentId: string;
  annotationType?: string;
  since?: string;
}

interface ArchiveMediaInput {
  tenantId: string;
  brandId: string;
  mediaData: {
    fileName: string;
    contentType: string;
  };
}

interface DispatchTaskInput {
  tenantId: string;
  brandId: string;
  taskType: "content_review" | "voice_approval" | "input_needed" | "scheduling" | "analysis";
  context: Record<string, unknown>;
  priority?: "urgent" | "high" | "normal" | "low";
  workflowId?: string;
  workflowSignal?: string;
  assignedTo?: string;
  dueAt?: string;
}

interface FulfillTaskInput {
  tenantId: string;
  taskId: string;
  response: {
    responseType: "approval" | "rejection" | "revision" | "text_input" | "voice_input" | "selection";
    responseData: Record<string, unknown>;
    respondedBy?: string;
  };
}

// --- Status transition graph ---
// idea -> draft <-> review -> approved -> scheduled -> published -> archived
// Any non-terminal status can -> archived

const VALID_TRANSITIONS: Record<string, string[]> = {
  idea: ["draft", "archived"],
  draft: ["review", "archived"],
  review: ["draft", "approved", "archived"],
  approved: ["scheduled", "archived"],
  scheduled: ["published", "archived"],
  published: ["archived"],
  archived: [],
};

// --- Response type to task status mapping ---

const RESPONSE_TO_STATUS: Record<string, "completed" | "rejected" | "in_progress"> = {
  approval: "completed",
  rejection: "rejected",
  revision: "in_progress",
  text_input: "completed",
  voice_input: "completed",
  selection: "completed",
};

// --- R1 verbs ---

export async function configureBrand(input: ConfigureBrandInput): Promise<{ brandId: string }> {
  const db = getDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.config.name !== undefined) updates.name = input.config.name;
  if (input.config.contentPillars !== undefined) updates.contentPillars = input.config.contentPillars;
  if (input.config.autonomyLevel !== undefined) updates.autonomyLevel = input.config.autonomyLevel;
  if (input.config.audienceDemographics !== undefined) updates.audienceDemographics = input.config.audienceDemographics;
  if (input.config.description !== undefined) updates.description = input.config.description;
  if (input.config.growthStage !== undefined) updates.growthStage = input.config.growthStage;

  await db
    .update(brands)
    .set(updates)
    .where(and(eq(brands.id, input.brandId), eq(brands.tenantId, input.tenantId)));

  return { brandId: input.brandId };
}

export async function evolveIdentity(input: EvolveIdentityInput): Promise<{ version: number }> {
  const db = getDb();

  return await db.transaction(async (tx) => {
    // Find current identity to get version number
    const current = await tx
      .select({ id: brandIdentities.id, version: brandIdentities.version })
      .from(brandIdentities)
      .where(
        and(
          eq(brandIdentities.brandId, input.brandId),
          eq(brandIdentities.tenantId, input.tenantId),
          eq(brandIdentities.isCurrent, true),
        ),
      )
      .limit(1);

    const nextVersion = current.length > 0 ? current[0].version + 1 : 1;
    const refinedFrom = current.length > 0 ? current[0].id : undefined;

    // Flip old identity to not current
    if (current.length > 0) {
      await tx
        .update(brandIdentities)
        .set({ isCurrent: false })
        .where(
          and(
            eq(brandIdentities.brandId, input.brandId),
            eq(brandIdentities.tenantId, input.tenantId),
            eq(brandIdentities.isCurrent, true),
          ),
        );
    }

    // Insert new identity version
    await tx.insert(brandIdentities).values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      identityPrompt: input.identityPrompt,
      version: nextVersion,
      isCurrent: true,
      refinedFrom,
      refinementReason: input.refinementReason,
    });

    return { version: nextVersion };
  });
}

export async function registerChannel(input: RegisterChannelInput): Promise<{ connectionId: string }> {
  const db = getDb();
  const secret = getEncryptionSecret();
  const { connectionData } = input;

  const [row] = await db
    .insert(channelConnections)
    .values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      platform: connectionData.platform,
      accountId: connectionData.accountId,
      displayName: connectionData.displayName,
      profileUrl: connectionData.profileUrl,
      accessTokenEncrypted: encryptToken(connectionData.accessToken, secret),
      refreshTokenEncrypted: connectionData.refreshToken
        ? encryptToken(connectionData.refreshToken, secret)
        : null,
    })
    .returning({ id: channelConnections.id });

  return { connectionId: row.id };
}

export async function revokeChannel(input: RevokeChannelInput): Promise<{ revoked: boolean }> {
  const db = getDb();

  const result = await db
    .update(channelConnections)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(channelConnections.id, input.connectionId),
        eq(channelConnections.tenantId, input.tenantId),
      ),
    )
    .returning({ id: channelConnections.id });

  return { revoked: result.length > 0 };
}

// --- R2 verbs ---

export async function stageContent(input: StageContentInput): Promise<{ contentId: string; version: number }> {
  const db = getDb();

  const [row] = await db
    .insert(content)
    .values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      type: input.content.type,
      status: "draft",
      platform: input.content.platform,
      title: input.content.title,
      body: input.content.body,
      mediaUrls: input.content.mediaUrls,
      metadata: input.content.metadata ?? {},
      producedBy: input.content.producedBy ?? "system",
      campaignId: input.content.campaignId,
      templateId: input.content.templateId,
      desiredPublishAt: input.content.desiredPublishAt
        ? new Date(input.content.desiredPublishAt)
        : undefined,
      version: 1,
      isCurrent: true,
    })
    .returning({ id: content.id, version: content.version });

  return { contentId: row.id, version: row.version };
}

export async function advanceContent(input: AdvanceContentInput): Promise<{ newStatus: string }> {
  const db = getDb();

  // Fetch current status
  const [current] = await db
    .select({ status: content.status })
    .from(content)
    .where(and(eq(content.id, input.contentId), eq(content.tenantId, input.tenantId)));

  if (!current) {
    throw new Error(`Content ${input.contentId} not found`);
  }

  const allowed = VALID_TRANSITIONS[current.status];
  if (!allowed || !allowed.includes(input.targetStatus)) {
    throw new Error(
      `Invalid status transition: ${current.status} -> ${input.targetStatus}`,
    );
  }

  const updates: Record<string, unknown> = {
    status: input.targetStatus,
    updatedAt: new Date(),
  };
  if (input.targetStatus === "published") {
    updates.actualPublishedAt = new Date();
  }

  await db
    .update(content)
    .set(updates)
    .where(and(eq(content.id, input.contentId), eq(content.tenantId, input.tenantId)));

  return { newStatus: input.targetStatus };
}

export async function annotateContent(input: AnnotateContentInput): Promise<{ annotationId: string }> {
  const db = getDb();

  const [row] = await db
    .insert(contentAnnotations)
    .values({
      tenantId: input.tenantId,
      contentId: input.contentId,
      annotationType: input.annotation.annotationType,
      engine: input.annotation.engine,
      payload: input.annotation.payload,
      confidenceScore: input.annotation.confidenceScore,
    })
    .returning({ id: contentAnnotations.id });

  return { annotationId: row.id };
}

export async function surfaceAnnotations(input: SurfaceAnnotationsInput): Promise<{ annotations: unknown[] }> {
  const db = getDb();

  const conditions = [
    eq(contentAnnotations.contentId, input.contentId),
    eq(contentAnnotations.tenantId, input.tenantId),
  ];

  if (input.annotationType) {
    conditions.push(
      eq(
        contentAnnotations.annotationType,
        input.annotationType as "voice_alignment" | "performance_insight" | "strategic_guidance" | "content_brief" | "identity_signal",
      ),
    );
  }

  if (input.since) {
    conditions.push(gte(contentAnnotations.createdAt, new Date(input.since)));
  }

  const rows = await db
    .select()
    .from(contentAnnotations)
    .where(and(...conditions))
    .orderBy(desc(contentAnnotations.createdAt));

  return { annotations: rows };
}

export async function archiveMedia(input: ArchiveMediaInput): Promise<{ objectStorePath: string }> {
  // Construct storage path. Actual Supabase Storage upload is TODO.
  const timestamp = Date.now();
  const path = `media/${input.tenantId}/${input.brandId}/${timestamp}-${input.mediaData.fileName}`;
  return { objectStorePath: path };
}

// --- R3 verbs ---

export async function dispatchTask(input: DispatchTaskInput): Promise<{ taskId: string }> {
  const db = getDb();

  const [row] = await db
    .insert(tasks)
    .values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      type: input.taskType,
      priority: input.priority ?? "normal",
      context: input.context,
      workflowId: input.workflowId,
      workflowSignal: input.workflowSignal,
      assignedTo: input.assignedTo,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
    })
    .returning({ id: tasks.id });

  return { taskId: row.id };
}

export async function fulfillTask(input: FulfillTaskInput): Promise<{ taskId: string; outcome: string }> {
  const db = getDb();
  const { response } = input;

  // Insert immutable response
  await db.insert(taskResponses).values({
    tenantId: input.tenantId,
    taskId: input.taskId,
    responseType: response.responseType,
    responseData: response.responseData,
    respondedBy: response.respondedBy,
  });

  // Map response type to task status
  const newStatus = RESPONSE_TO_STATUS[response.responseType] ?? "completed";

  await db
    .update(tasks)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(and(eq(tasks.id, input.taskId), eq(tasks.tenantId, input.tenantId)));

  return { taskId: input.taskId, outcome: newStatus };
}

// Re-export VALID_TRANSITIONS and RESPONSE_TO_STATUS for testing
export { VALID_TRANSITIONS, RESPONSE_TO_STATUS };
