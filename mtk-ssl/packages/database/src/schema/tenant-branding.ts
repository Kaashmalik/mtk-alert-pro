import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

/**
 * Tenant branding table - White-label configuration
 */
export const tenantBranding = pgTable("tenant_branding", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  fontFamily: text("font_family"),
  appName: text("app_name"), // Custom app name for white-label
  hideSslBranding: boolean("hide_ssl_branding").default(false).notNull(),
  customCss: text("custom_css"),
  emailSenderName: text("email_sender_name"),
  emailSenderAddress: text("email_sender_address"),
  loginPageBackgroundUrl: text("login_page_background_url"),
  loginPageCustomHtml: text("login_page_custom_html"),
  mobileAppIconUrl: text("mobile_app_icon_url"),
  mobileAppSplashUrl: text("mobile_app_splash_url"),
  mobileAppBundleId: text("mobile_app_bundle_id"),
  mobileAppPackageName: text("mobile_app_package_name"),
  separateDatabase: boolean("separate_database").default(false).notNull(),
  databaseInstanceUrl: text("database_instance_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TenantBranding = typeof tenantBranding.$inferSelect;
export type NewTenantBranding = typeof tenantBranding.$inferInsert;

