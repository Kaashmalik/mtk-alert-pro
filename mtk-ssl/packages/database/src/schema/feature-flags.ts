import { pgTable, uuid, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Feature flags table - Control feature availability
 */
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  key: text("key").notNull().unique(), // e.g., 'ai_commentary', 'fantasy_cricket'
  name: text("name").notNull(), // Human-readable name
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  rolloutPercentage: text("rollout_percentage").default("0"), // 0-100, for gradual rollout
  targetTenants: jsonb("target_tenants"), // JSON array of tenant IDs, null = all tenants
  metadata: jsonb("metadata"), // Additional config (e.g., AI model settings)
  createdBy: uuid("created_by"), // Super admin user ID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

