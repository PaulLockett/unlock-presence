import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import {
  planTierEnum,
  autonomyLevelEnum,
  growthStageEnum,
  teamRoleEnum,
  platformEnum,
} from "./enums.js";

const tz = { withTimezone: true, mode: "date" as const };

// R1: Brand Store — tenants, brands, brand_identities, channel_connections, team_members

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  planTier: planTierEnum("plan_tier").notNull().default("free"),
  featureFlags: jsonb("feature_flags").default({}),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  autonomyLevel: autonomyLevelEnum("autonomy_level").notNull().default("manual"),
  growthStage: growthStageEnum("growth_stage").notNull().default("launch"),
  contentPillars: text("content_pillars").array(),
  audienceDemographics: jsonb("audience_demographics").default({}),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});

export const brandIdentities = pgTable("brand_identities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  identityPrompt: text("identity_prompt").notNull(),
  version: integer("version").notNull().default(1),
  isCurrent: boolean("is_current").notNull().default(true),
  refinedFrom: uuid("refined_from"),
  refinementReason: text("refinement_reason"),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
});

export const channelConnections = pgTable("channel_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  accountId: text("account_id").notNull(),
  displayName: text("display_name"),
  profileUrl: text("profile_url"),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at", tz),
  nextRefreshAt: timestamp("next_refresh_at", tz),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  role: teamRoleEnum("role").notNull().default("viewer"),
  brandPermissions: jsonb("brand_permissions").default({}),
  createdAt: timestamp("created_at", tz).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", tz).notNull().defaultNow(),
});
