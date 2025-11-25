import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

/**
 * Ground type enum
 */
export const groundTypeEnum = pgEnum("ground_type", ["grass", "synthetic", "concrete", "matting"]);

/**
 * Venues table
 */
export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  capacity: integer("capacity"),
  groundType: groundTypeEnum("ground_type"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueTenantName: sql`UNIQUE (${table.tenantId}, ${table.name})`,
}));

export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;

