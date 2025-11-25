import { pgTable, uuid, text, timestamp, date, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";

/**
 * Tournament format enum
 */
export const tournamentFormatEnum = pgEnum("tournament_format", ["knockout", "league", "hybrid", "round_robin"]);

/**
 * Tournament status enum
 */
export const tournamentStatusEnum = pgEnum("tournament_status", ["draft", "registration", "live", "completed", "cancelled"]);

/**
 * Tournaments table
 */
export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  format: tournamentFormatEnum("format").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  registrationOpen: boolean("registration_open").default(false).notNull(),
  registrationDeadline: date("registration_deadline"),
  maxTeams: integer("max_teams"),
  status: tournamentStatusEnum("status").notNull().default("draft"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueTenantSlug: sql`UNIQUE (${table.tenantId}, ${table.slug})`,
}));

export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;

