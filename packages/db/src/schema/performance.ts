import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  real,
  integer,
  index,
} from "drizzle-orm/pg-core";
import {
  platformEnum,
  abTestStatusEnum,
  auditActionEnum,
} from "./enums.js";
import { tenants, brands } from "./brand.js";
import { content } from "./content.js";

const tz = { withTimezone: true, mode: "date" as const };

// R5: Performance Store — content_performance, audience_metrics, ab_tests,
//     workflow_performance, audit_log

export const contentPerformance = pgTable(
  "content_performance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    impressions: integer("impressions").default(0),
    engagements: integer("engagements").default(0),
    clicks: integer("clicks").default(0),
    reach: integer("reach").default(0),
    engagementRate: real("engagement_rate").default(0),
    rawPlatformData: jsonb("raw_platform_data").default({}),
    measuredAt: timestamp("measured_at", tz).notNull().defaultNow(),
  },
  (table) => [
    index("idx_perf_content_time").on(
      table.contentId,
      table.measuredAt,
    ),
    index("idx_perf_tenant_time").on(
      table.tenantId,
      table.measuredAt,
    ),
  ],
);

export const audienceMetrics = pgTable("audience_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  followers: integer("followers").default(0),
  followersDelta: integer("followers_delta").default(0),
  demographics: jsonb("demographics").default({}),
  measuredAt: timestamp("measured_at", tz).notNull().defaultNow(),
});

export const abTests = pgTable("ab_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  hypothesis: text("hypothesis").notNull(),
  status: abTestStatusEnum("status").notNull().default("draft"),
  variants: jsonb("variants").default([]),
  winnerVariantId: text("winner_variant_id"),
  statisticalSignificance: real("statistical_significance"),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  concludedAt: timestamp("concluded_at", tz),
});

export const workflowPerformance = pgTable("workflow_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  workflowType: text("workflow_type").notNull(),
  successRate: real("success_rate").default(0),
  humanOverrideRate: real("human_override_rate").default(0),
  qualityScore: real("quality_score").default(0),
  measuredAt: timestamp("measured_at", tz).notNull().defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actor: text("actor").notNull(),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    details: jsonb("details").default({}),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_tenant_time").on(table.tenantId, table.createdAt),
    index("idx_audit_entity").on(table.entityType, table.entityId),
  ],
);
