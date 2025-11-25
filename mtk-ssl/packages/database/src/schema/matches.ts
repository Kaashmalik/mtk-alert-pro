import { pgTable, uuid, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { tournaments } from "./tournaments";
import { teams } from "./teams";
import { venues } from "./venues";

/**
 * Match type enum
 */
export const matchTypeEnum = pgEnum("match_type", ["group", "knockout", "final", "semi_final", "quarter_final"]);

/**
 * Match status enum
 */
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "completed", "abandoned", "cancelled"]);

/**
 * Toss decision enum
 */
export const tossDecisionEnum = pgEnum("toss_decision", ["bat", "bowl"]);

/**
 * Matches table
 */
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id").references(() => tournaments.id, { onDelete: "set null" }),
  teamAId: uuid("team_a_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  teamBId: uuid("team_b_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
  matchNumber: integer("match_number"),
  matchType: matchTypeEnum("match_type").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  tossWinnerId: uuid("toss_winner_id").references(() => teams.id),
  tossDecision: tossDecisionEnum("toss_decision"),
  winnerId: uuid("winner_id").references(() => teams.id),
  result: text("result"), // e.g., "Team A won by 5 wickets"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

