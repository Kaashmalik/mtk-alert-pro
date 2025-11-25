import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { tournaments } from "./tournaments";
import { users } from "./users";

/**
 * Teams table
 */
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id").references(() => tournaments.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  logoUrl: text("logo_url"),
  captainId: uuid("captain_id").references(() => users.id, { onDelete: "set null" }),
  managerId: uuid("manager_id").references(() => users.id, { onDelete: "set null" }),
  jerseyColor: text("jersey_color"),
  homeGround: text("home_ground"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueTenantSlug: sql`UNIQUE (${table.tenantId}, ${table.slug})`,
}));

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

