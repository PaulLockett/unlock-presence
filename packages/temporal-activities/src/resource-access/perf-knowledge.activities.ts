// RA4: Performance & Knowledge Artifact Access — R4 (knowledge), R5 (performance)

import { createDb } from "@presence-os/db";
import {
  knowledgeFrameworks,
  knowledgeSources,
  contentPerformance,
  audienceMetrics,
  abTests,
  workflowPerformance,
} from "@presence-os/db";
import { eq, and, desc, sql } from "drizzle-orm";

const getDb = () => createDb();

// --- Input types ---

interface CatalogFrameworkInput {
  tenantId: string;
  brandId: string;
  framework: {
    title: string;
    description?: string;
    confidenceScore?: number;
    evidence?: unknown[];
    tags?: string[];
    relatedFrameworkIds?: string[];
  };
  embedding?: number[];
}

interface DiscoverKnowledgeInput {
  tenantId: string;
  brandId: string;
  query: string;
  embedding?: number[];
  limit?: number;
}

interface ReconcileEvidenceInput {
  tenantId: string;
  frameworkId: string;
  evidence: {
    source: string;
    observation: string;
    timestamp?: string;
  };
  confidenceScore: number;
}

interface LinkSourceMaterialInput {
  tenantId: string;
  frameworkId: string;
  sourceData: {
    brandId: string;
    type: "book" | "article" | "url" | "upload";
    title: string;
    metadata?: Record<string, unknown>;
    contentHash?: string;
    objectStorePath?: string;
  };
}

interface CaptureMetricInput {
  tenantId: string;
  contentId: string;
  platform: "x" | "linkedin" | "substack" | "email" | "internal";
  metrics: {
    impressions?: number;
    engagements?: number;
    clicks?: number;
    reach?: number;
    engagementRate?: number;
    rawPlatformData?: Record<string, unknown>;
  };
  measuredAt?: string;
}

interface SnapshotAudienceInput {
  tenantId: string;
  brandId: string;
  platform: "x" | "linkedin" | "substack" | "email" | "internal";
  followers?: number;
  followersDelta?: number;
  demographics?: Record<string, unknown>;
}

interface TrackExperimentInput {
  tenantId: string;
  brandId: string;
  testConfig: {
    id?: string;
    title: string;
    hypothesis: string;
    status?: "draft" | "running" | "concluded";
    variants?: unknown[];
    winnerVariantId?: string;
    statisticalSignificance?: number;
  };
}

interface AssessWorkflowHealthInput {
  tenantId: string;
  brandId: string;
  workflowType: string;
  successRate?: number;
  humanOverrideRate?: number;
  qualityScore?: number;
}

// --- Helpers ---

function scoreToLevel(score: number): "low" | "medium" | "high" | "validated" {
  if (score >= 0.9) return "validated";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

// --- R4 verbs ---

export async function catalogFramework(input: CatalogFrameworkInput): Promise<{ frameworkId: string }> {
  const db = getDb();
  const { framework } = input;

  const [row] = await db
    .insert(knowledgeFrameworks)
    .values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      title: framework.title,
      description: framework.description,
      confidenceScore: framework.confidenceScore ?? 0.5,
      confidenceLevel: scoreToLevel(framework.confidenceScore ?? 0.5),
      evidence: framework.evidence ?? [],
      embedding: input.embedding,
      tags: framework.tags,
      relatedFrameworkIds: framework.relatedFrameworkIds,
      version: 1,
      isCurrent: true,
    })
    .returning({ id: knowledgeFrameworks.id });

  return { frameworkId: row.id };
}

export async function discoverKnowledge(input: DiscoverKnowledgeInput): Promise<{ frameworks: unknown[] }> {
  const db = getDb();
  const limit = input.limit ?? 10;

  if (input.embedding) {
    // Cosine distance via pgvector <=> operator
    const embeddingStr = `[${input.embedding.join(",")}]`;
    const rows = await db.execute(
      sql`SELECT * FROM knowledge_frameworks
          WHERE tenant_id = ${input.tenantId}
            AND brand_id = ${input.brandId}
            AND is_current = true
          ORDER BY embedding <=> ${embeddingStr}::vector
          LIMIT ${limit}`,
    );
    return { frameworks: Array.from(rows) };
  }

  // Text fallback: return current frameworks
  const rows = await db
    .select()
    .from(knowledgeFrameworks)
    .where(
      and(
        eq(knowledgeFrameworks.tenantId, input.tenantId),
        eq(knowledgeFrameworks.brandId, input.brandId),
        eq(knowledgeFrameworks.isCurrent, true),
      ),
    )
    .orderBy(desc(knowledgeFrameworks.confidenceScore))
    .limit(limit);

  return { frameworks: rows };
}

export async function reconcileEvidence(input: ReconcileEvidenceInput): Promise<{ updatedConfidence: number }> {
  const db = getDb();

  // Append to evidence jsonb array via || operator, update confidence
  await db
    .update(knowledgeFrameworks)
    .set({
      evidence: sql`COALESCE(${knowledgeFrameworks.evidence}, '[]'::jsonb) || ${JSON.stringify(input.evidence)}::jsonb`,
      confidenceScore: input.confidenceScore,
      confidenceLevel: scoreToLevel(input.confidenceScore),
    })
    .where(
      and(
        eq(knowledgeFrameworks.id, input.frameworkId),
        eq(knowledgeFrameworks.tenantId, input.tenantId),
      ),
    );

  return { updatedConfidence: input.confidenceScore };
}

export async function linkSourceMaterial(input: LinkSourceMaterialInput): Promise<{ sourceId: string }> {
  const db = getDb();
  const { sourceData } = input;

  const [row] = await db
    .insert(knowledgeSources)
    .values({
      tenantId: input.tenantId,
      brandId: sourceData.brandId,
      type: sourceData.type,
      title: sourceData.title,
      metadata: sourceData.metadata ?? {},
      contentHash: sourceData.contentHash,
      objectStorePath: sourceData.objectStorePath,
    })
    .returning({ id: knowledgeSources.id });

  return { sourceId: row.id };
}

// --- R5 verbs ---

export async function captureMetric(input: CaptureMetricInput): Promise<{ recorded: boolean }> {
  const db = getDb();

  await db.insert(contentPerformance).values({
    tenantId: input.tenantId,
    contentId: input.contentId,
    platform: input.platform,
    impressions: input.metrics.impressions ?? 0,
    engagements: input.metrics.engagements ?? 0,
    clicks: input.metrics.clicks ?? 0,
    reach: input.metrics.reach ?? 0,
    engagementRate: input.metrics.engagementRate ?? 0,
    rawPlatformData: input.metrics.rawPlatformData ?? {},
    measuredAt: input.measuredAt ? new Date(input.measuredAt) : new Date(),
  });

  return { recorded: true };
}

export async function snapshotAudience(input: SnapshotAudienceInput): Promise<{ snapshotId: string }> {
  const db = getDb();

  const [row] = await db
    .insert(audienceMetrics)
    .values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      platform: input.platform,
      followers: input.followers ?? 0,
      followersDelta: input.followersDelta ?? 0,
      demographics: input.demographics ?? {},
    })
    .returning({ id: audienceMetrics.id });

  return { snapshotId: row.id };
}

export async function trackExperiment(input: TrackExperimentInput): Promise<{ testId: string }> {
  const db = getDb();
  const { testConfig } = input;

  if (testConfig.id) {
    // Update existing experiment
    const updates: Record<string, unknown> = {};
    if (testConfig.status !== undefined) updates.status = testConfig.status;
    if (testConfig.variants !== undefined) updates.variants = testConfig.variants;
    if (testConfig.winnerVariantId !== undefined) updates.winnerVariantId = testConfig.winnerVariantId;
    if (testConfig.statisticalSignificance !== undefined) updates.statisticalSignificance = testConfig.statisticalSignificance;
    if (testConfig.status === "concluded") updates.concludedAt = new Date();

    await db
      .update(abTests)
      .set(updates)
      .where(
        and(
          eq(abTests.id, testConfig.id),
          eq(abTests.tenantId, input.tenantId),
        ),
      );

    return { testId: testConfig.id };
  }

  // Create new experiment
  const [row] = await db
    .insert(abTests)
    .values({
      tenantId: input.tenantId,
      brandId: input.brandId,
      title: testConfig.title,
      hypothesis: testConfig.hypothesis,
      status: testConfig.status ?? "draft",
      variants: testConfig.variants ?? [],
    })
    .returning({ id: abTests.id });

  return { testId: row.id };
}

export async function assessWorkflowHealth(input: AssessWorkflowHealthInput): Promise<{ healthScore: number }> {
  const db = getDb();

  // Insert current measurement
  await db.insert(workflowPerformance).values({
    tenantId: input.tenantId,
    brandId: input.brandId,
    workflowType: input.workflowType,
    successRate: input.successRate ?? 0,
    humanOverrideRate: input.humanOverrideRate ?? 0,
    qualityScore: input.qualityScore ?? 0,
  });

  // Query last 5 records to compute average quality score
  const recent = await db
    .select({ qualityScore: workflowPerformance.qualityScore })
    .from(workflowPerformance)
    .where(
      and(
        eq(workflowPerformance.tenantId, input.tenantId),
        eq(workflowPerformance.brandId, input.brandId),
        eq(workflowPerformance.workflowType, input.workflowType),
      ),
    )
    .orderBy(desc(workflowPerformance.measuredAt))
    .limit(5);

  const avgScore =
    recent.reduce((sum, r) => sum + (r.qualityScore ?? 0), 0) / recent.length;

  return { healthScore: Math.round(avgScore * 100) / 100 };
}

export { scoreToLevel };
