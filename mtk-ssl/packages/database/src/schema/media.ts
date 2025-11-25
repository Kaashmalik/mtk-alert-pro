import { pgTable, uuid, text, timestamp, bigint, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { matches } from "./matches";
import { teams } from "./teams";
import { players } from "./players";
import { users } from "./users";

/**
 * Media table
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // 'image', 'video', 'audio'
  mimeType: text("mime_type"),
  fileSize: bigint("file_size", { mode: "number" }),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // For video/audio in seconds
  thumbnailUrl: text("thumbnail_url"),
  category: text("category"), // e.g., 'highlight', 'photo', 'video', 'logo'
  relatedMatchId: uuid("related_match_id").references(() => matches.id, { onDelete: "set null" }),
  relatedTeamId: uuid("related_team_id").references(() => teams.id, { onDelete: "set null" }),
  relatedPlayerId: uuid("related_player_id").references(() => players.id, { onDelete: "set null" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

