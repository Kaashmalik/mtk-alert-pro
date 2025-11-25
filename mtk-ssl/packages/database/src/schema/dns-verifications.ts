import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

/**
 * DNS verification status enum
 */
export const dnsVerificationStatusEnum = pgEnum("dns_verification_status", [
  "pending",
  "verified",
  "failed",
  "expired",
]);

/**
 * DNS verifications table - Domain verification for custom domains
 */
export const dnsVerifications = pgTable("dns_verifications", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  verificationToken: text("verification_token").notNull(),
  verificationType: text("verification_type").notNull(), // 'txt', 'cname', 'a'
  expectedValue: text("expected_value").notNull(),
  status: dnsVerificationStatusEnum("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DnsVerification = typeof dnsVerifications.$inferSelect;
export type NewDnsVerification = typeof dnsVerifications.$inferInsert;

