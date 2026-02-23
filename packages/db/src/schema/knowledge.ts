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
  customType,
} from "drizzle-orm/pg-core";
import { confidenceLevelEnum, knowledgeSourceTypeEnum } from "./enums.js";
import { tenants, brands } from "./brand.js";

const tz = { withTimezone: true, mode: "date" as const };

// pgvector 1536-dimension column type
const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    const str = value as string;
    return str
      .slice(1, -1)
      .split(",")
      .map(Number);
  },
});

// R4: Knowledge Store — knowledge_frameworks, knowledge_sources

export const knowledgeFrameworks = pgTable(
  "knowledge_frameworks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    frameworkGroupId: uuid("framework_group_id").notNull().defaultRandom(),
    version: integer("version").notNull().default(1),
    isCurrent: boolean("is_current").notNull().default(true),
    title: text("title").notNull(),
    description: text("description"),
    confidenceScore: real("confidence_score").notNull().default(0.5),
    confidenceLevel: confidenceLevelEnum("confidence_level")
      .notNull()
      .default("medium"),
    evidence: jsonb("evidence").default([]),
    embedding: vector("embedding"),
    tags: text("tags").array(),
    relatedFrameworkIds: uuid("related_framework_ids").array(),
    createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  },
  (table) => [
    index("idx_knowledge_brand_current").on(
      table.tenantId,
      table.brandId,
      table.isCurrent,
    ),
  ],
);

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  type: knowledgeSourceTypeEnum("type").notNull(),
  title: text("title").notNull(),
  metadata: jsonb("metadata").default({}),
  contentHash: text("content_hash"),
  objectStorePath: text("object_store_path"),
  processedAt: timestamp("processed_at", tz),
  frameworkCount: integer("framework_count").default(0),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
});
