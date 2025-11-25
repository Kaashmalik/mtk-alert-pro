import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

/**
 * Email verification status enum
 */
export const emailVerificationStatusEnum = pgEnum("email_verification_status", [
  "pending",
  "verified",
  "failed",
  "expired",
]);

/**
 * Email domain verifications table - DKIM/SPF verification
 */
export const emailDomainVerifications = pgTable("email_domain_verifications", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  senderEmail: text("sender_email").notNull(), // e.g., no-reply@myleague.com
  dkimPublicKey: text("dkim_public_key"),
  dkimSelector: text("dkim_selector").default("default"),
  spfRecord: text("spf_record"),
  dmarcRecord: text("dmarc_record"),
  status: emailVerificationStatusEnum("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  verificationErrors: text("verification_errors"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EmailDomainVerification = typeof emailDomainVerifications.$inferSelect;
export type NewEmailDomainVerification = typeof emailDomainVerifications.$inferInsert;

