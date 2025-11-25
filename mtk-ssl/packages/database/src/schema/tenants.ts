import { pgTable, text, timestamp, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Tenant plan enum
 */
export const tenantPlanEnum = pgEnum("tenant_plan", ["free", "pro", "enterprise"]);

/**
 * Tenants table - Multi-tenant architecture
 * Each league is a tenant with isolated data via RLS policies
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  customDomain: text("custom_domain").unique(),
  customDomainVerified: boolean("custom_domain_verified").default(false).notNull(),
  customDomainVerifiedAt: timestamp("custom_domain_verified_at", { withTimezone: true }),
  sslEnabled: boolean("ssl_enabled").default(false).notNull(),
  emailDomainVerified: boolean("email_domain_verified").default(false).notNull(),
  ownerId: uuid("owner_id").notNull(), // References auth.users
  plan: tenantPlanEnum("plan").notNull().default("free"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

