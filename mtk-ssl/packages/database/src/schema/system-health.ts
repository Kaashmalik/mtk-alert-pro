import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Error log severity enum
 */
export const errorSeverityEnum = pgEnum("error_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

/**
 * System health metrics table
 */
export const systemHealth = pgTable("system_health", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  service: text("service").notNull(), // 'api', 'web', 'admin', 'database', 'redis', etc.
  status: text("status").notNull(), // 'healthy', 'degraded', 'down'
  responseTime: integer("response_time"), // milliseconds
  uptime: integer("uptime"), // seconds
  cpuUsage: integer("cpu_usage"), // percentage
  memoryUsage: integer("memory_usage"), // percentage
  activeConnections: integer("active_connections"),
  errorRate: integer("error_rate"), // errors per minute
  lastChecked: timestamp("last_checked", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Error logs table
 */
export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  service: text("service").notNull(),
  severity: errorSeverityEnum("severity").notNull().default("medium"),
  errorType: text("error_type"), // 'database', 'api', 'auth', 'payment', etc.
  message: text("message").notNull(),
  stackTrace: text("stack_trace"),
  userId: uuid("user_id"), // User who triggered the error (if applicable)
  tenantId: uuid("tenant_id"), // Tenant context (if applicable)
  metadata: text("metadata"), // JSON string of additional context
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by"), // Admin who resolved it
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SystemHealth = typeof systemHealth.$inferSelect;
export type NewSystemHealth = typeof systemHealth.$inferInsert;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;

