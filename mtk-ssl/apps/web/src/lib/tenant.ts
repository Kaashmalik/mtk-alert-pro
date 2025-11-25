import { headers } from "next/headers";
import { db } from "@mtk/database";
import { tenants, tenantBranding } from "@mtk/database";
import { eq } from "drizzle-orm";

/**
 * Get tenant from custom domain or subdomain
 */
export async function getTenantFromRequest() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  // Check for custom domain first
  const customDomainTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.customDomain, host))
    .limit(1);

  if (customDomainTenant.length > 0) {
    return customDomainTenant[0];
  }

  // Check for subdomain (e.g., myleague.ssl.cricket)
  const subdomain = host.split(".")[0];
  if (subdomain && subdomain !== "www" && subdomain !== "app" && subdomain !== "admin") {
    const subdomainTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, subdomain))
      .limit(1);

    if (subdomainTenant.length > 0) {
      return subdomainTenant[0];
    }
  }

  return null;
}

/**
 * Get tenant branding configuration
 */
export async function getTenantBranding(tenantId: string) {
  const branding = await db
    .select()
    .from(tenantBranding)
    .where(eq(tenantBranding.tenantId, tenantId))
    .limit(1);

  return branding[0] || null;
}

/**
 * Get complete tenant info with branding
 */
export async function getTenantWithBranding() {
  const tenant = await getTenantFromRequest();
  if (!tenant) return null;

  const branding = await getTenantBranding(tenant.id);
  return {
    tenant,
    branding,
  };
}

