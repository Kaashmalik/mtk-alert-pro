import { pgTable, uuid, integer, timestamp, boolean, text, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { matches } from "./matches";
import { matchInnings } from "./match-innings";
import { players } from "./players";

/**
 * Wicket type enum
 */
export const wicketTypeEnum = pgEnum("wicket_type", [
  "bowled",
  "caught",
  "lbw",
  "run_out",
  "stumped",
  "hit_wicket",
  "retired",
  "retired_hurt",
]);

/**
 * Match balls table - Ball-by-ball data
 */
export const matchBalls = pgTable("match_balls", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  inningsId: uuid("innings_id").notNull().references(() => matchInnings.id, { onDelete: "cascade" }),
  overNumber: integer("over_number").notNull(),
  ballNumber: integer("ball_number").notNull(), // 1-6
  bowlerId: uuid("bowler_id").references(() => players.id, { onDelete: "set null" }),
  batsmanId: uuid("batsman_id").references(() => players.id, { onDelete: "set null" }),
  runs: integer("runs").default(0).notNull(),
  isWicket: boolean("is_wicket").default(false).notNull(),
  wicketType: wicketTypeEnum("wicket_type"),
  isFour: boolean("is_four").default(false).notNull(),
  isSix: boolean("is_six").default(false).notNull(),
  isWide: boolean("is_wide").default(false).notNull(),
  isNoBall: boolean("is_no_ball").default(false).notNull(),
  isBye: boolean("is_bye").default(false).notNull(),
  isLegBye: boolean("is_leg_bye").default(false).notNull(),
  shotDirection: text("shot_direction"), // For wagon wheel
  shotType: text("shot_type"), // e.g., 'drive', 'cut', 'pull'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueBall: sql`UNIQUE (${table.matchId}, ${table.inningsId}, ${table.overNumber}, ${table.ballNumber})`,
}));

export type MatchBall = typeof matchBalls.$inferSelect;
export type NewMatchBall = typeof matchBalls.$inferInsert;

