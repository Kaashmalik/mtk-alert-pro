import { pgTable, uuid, text, timestamp, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { tenants } from "./tenants";

/**
 * Profiles table - Public user information per tenant
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  bio: text("bio"),
  dateOfBirth: date("date_of_birth"),
  nationality: text("nationality"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserTenant: sql`UNIQUE (${table.userId}, ${table.tenantId})`,
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

