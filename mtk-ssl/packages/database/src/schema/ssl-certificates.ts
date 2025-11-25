import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

/**
 * SSL certificate status enum
 */
export const sslCertificateStatusEnum = pgEnum("ssl_certificate_status", [
  "pending",
  "issued",
  "active",
  "expired",
  "revoked",
  "failed",
]);

/**
 * SSL certificates table - Let's Encrypt certificate management
 */
export const sslCertificates = pgTable("ssl_certificates", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  certificateUrl: text("certificate_url"),
  privateKeyUrl: text("private_key_url"), // Encrypted storage reference
  issuer: text("issuer").default("letsencrypt"),
  status: sslCertificateStatusEnum("status").notNull().default("pending"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  autoRenew: boolean("auto_renew").default(true).notNull(),
  lastRenewedAt: timestamp("last_renewed_at", { withTimezone: true }),
  renewalAttempts: integer("renewal_attempts").default(0).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SslCertificate = typeof sslCertificates.$inferSelect;
export type NewSslCertificate = typeof sslCertificates.$inferInsert;

