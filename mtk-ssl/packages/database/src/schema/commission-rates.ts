import { pgTable, uuid, text, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Commission rates table - Platform commission configuration
 */
export const commissionRates = pgTable("commission_rates", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  plan: text("plan").notNull().unique(), // 'free', 'pro', 'enterprise'
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // Percentage (e.g., 15.00 for 15%)
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  updatedBy: uuid("updated_by"), // Super admin user ID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CommissionRate = typeof commissionRates.$inferSelect;
export type NewCommissionRate = typeof commissionRates.$inferInsert;

