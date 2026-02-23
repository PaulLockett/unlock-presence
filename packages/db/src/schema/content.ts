import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  real,
  index,
} from "drizzle-orm/pg-core";
import {
  contentTypeEnum,
  contentStatusEnum,
  platformEnum,
  producedByEnum,
  visibilityStateEnum,
  annotationTypeEnum,
  engineEnum,
  campaignStatusEnum,
  templateScopeEnum,
} from "./enums.js";
import { tenants, brands } from "./brand.js";

const tz = { withTimezone: true, mode: "date" as const };

// R2: Content Store — content, content_annotations, campaigns, templates

export const content = pgTable(
  "content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    contentGroupId: uuid("content_group_id").notNull().defaultRandom(),
    version: integer("version").notNull().default(1),
    isCurrent: boolean("is_current").notNull().default(true),
    type: contentTypeEnum("type").notNull(),
    status: contentStatusEnum("status").notNull().default("idea"),
    platform: platformEnum("platform").notNull(),
    title: text("title"),
    body: text("body"),
    mediaUrls: text("media_urls").array(),
    metadata: jsonb("metadata").default({}),
    producedBy: producedByEnum("produced_by").notNull().default("system"),
    campaignId: uuid("campaign_id"),
    workflowRunId: text("workflow_run_id"),
    templateId: uuid("template_id"),
    desiredPublishAt: timestamp("desired_publish_at", tz),
    actualPublishedAt: timestamp("actual_published_at", tz),
    visibilityState: visibilityStateEnum("visibility_state")
      .notNull()
      .default("visible"),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
  },
  (table) => [
    index("idx_content_brand_status").on(
      table.tenantId,
      table.brandId,
      table.status,
    ),
    index("idx_content_group_version").on(
      table.contentGroupId,
      table.version,
    ),
  ],
);

export const contentAnnotations = pgTable(
  "content_annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    annotationType: annotationTypeEnum("annotation_type").notNull(),
    engine: engineEnum("engine").notNull(),
    payload: jsonb("payload").notNull(),
    confidenceScore: real("confidence_score"),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  },
  (table) => [
    index("idx_annotation_content_type_latest").on(
      table.contentId,
      table.annotationType,
      table.createdAt,
    ),
  ],
);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  dateRangeStart: timestamp("date_range_start", tz),
  dateRangeEnd: timestamp("date_range_end", tz),
  contentPlan: jsonb("content_plan").default({}),
  version: integer("version").notNull().default(1),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  body: text("body").notNull(),
  type: contentTypeEnum("type").notNull(),
  scope: templateScopeEnum("scope").notNull().default("brand"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});
