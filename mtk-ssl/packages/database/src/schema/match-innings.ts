import { pgTable, uuid, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { matches } from "./matches";
import { teams } from "./teams";

/**
 * Innings status enum
 */
export const inningsStatusEnum = pgEnum("innings_status", ["not_started", "in_progress", "completed"]);

/**
 * Match innings table
 */
export const matchInnings = pgTable("match_innings", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  inningsNumber: integer("innings_number").notNull(), // 1 or 2
  totalRuns: integer("total_runs").default(0).notNull(),
  totalWickets: integer("total_wickets").default(0).notNull(),
  totalBalls: integer("total_balls").default(0).notNull(),
  extras: integer("extras").default(0).notNull(),
  byes: integer("byes").default(0).notNull(),
  legByes: integer("leg_byes").default(0).notNull(),
  wides: integer("wides").default(0).notNull(),
  noBalls: integer("no_balls").default(0).notNull(),
  status: inningsStatusEnum("status").notNull().default("not_started"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueMatchInnings: sql`UNIQUE (${table.matchId}, ${table.inningsNumber})`,
}));

export type MatchInnings = typeof matchInnings.$inferSelect;
export type NewMatchInnings = typeof matchInnings.$inferInsert;

