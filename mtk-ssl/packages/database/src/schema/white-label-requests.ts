import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

/**
 * White-label request status enum
 */
export const whiteLabelStatusEnum = pgEnum("white_label_status", [
  "pending",
  "approved",
  "rejected",
  "revoked",
]);

/**
 * White-label requests table - Approval queue for white-label features
 */
export const whiteLabelRequests = pgTable("white_label_requests", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  requestedBy: uuid("requested_by").notNull(), // User ID who requested
  status: whiteLabelStatusEnum("status").notNull().default("pending"),
  customDomain: text("custom_domain"), // Requested custom domain
  hideBranding: boolean("hide_branding").default(false).notNull(),
  customAppName: text("custom_app_name"),
  reason: text("reason"), // Why they want white-label
  adminNotes: text("admin_notes"), // Admin review notes
  reviewedBy: uuid("reviewed_by"), // Super admin who reviewed
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WhiteLabelRequest = typeof whiteLabelRequests.$inferSelect;
export type NewWhiteLabelRequest = typeof whiteLabelRequests.$inferInsert;

