import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * User role enum
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "super_admin"]);

/**
 * Users table - Multi-tenant users with tenant_id array
 * Users can belong to multiple leagues (tenants)
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  email: text("email").notNull().unique(),
  tenantIds: uuid("tenant_ids").array().notNull().default([]), // Array of tenant IDs
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

