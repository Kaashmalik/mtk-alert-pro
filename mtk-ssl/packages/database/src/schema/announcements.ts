import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Announcement priority enum
 */
export const announcementPriorityEnum = pgEnum("announcement_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

/**
 * Announcement type enum
 */
export const announcementTypeEnum = pgEnum("announcement_type", [
  "info",
  "warning",
  "success",
  "error",
  "maintenance",
]);

/**
 * Announcements table - Global platform announcements
 */
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: announcementTypeEnum("type").notNull().default("info"),
  priority: announcementPriorityEnum("priority").notNull().default("medium"),
  isActive: boolean("is_active").default(true).notNull(),
  targetAudience: text("target_audience"), // 'all', 'pro', 'enterprise', or specific tenant IDs (JSON array)
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  actionUrl: text("action_url"), // Optional link for CTA
  actionText: text("action_text"), // Optional CTA button text
  createdBy: uuid("created_by"), // Super admin user ID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

