import { SignIn } from "@clerk/nextjs";
import { headers } from "next/headers";
import { db } from "@mtk/database";
import { tenants, tenantBranding } from "@mtk/database";
import { eq } from "drizzle-orm";

async function getTenantBranding() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  // Check for custom domain
  const customDomainTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.customDomain, host))
    .limit(1);

  let tenant = null;
  if (customDomainTenant.length > 0) {
    tenant = customDomainTenant[0];
  } else {
    // Check for subdomain
    const subdomain = host.split(".")[0];
    if (subdomain && subdomain !== "www" && subdomain !== "app" && subdomain !== "admin") {
      const subdomainTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, subdomain))
        .limit(1);

      if (subdomainTenant.length > 0) {
        tenant = subdomainTenant[0];
      }
    }
  }

  if (!tenant) return null;

  const branding = await db
    .select()
    .from(tenantBranding)
    .where(eq(tenantBranding.tenantId, tenant.id))
    .limit(1);

  return {
    tenant,
    branding: branding[0] || null,
  };
}

export default async function SignInPage() {
  const tenantData = await getTenantBranding();
  const branding = tenantData?.branding;

  // Apply custom styling if branding exists
  const customStyles = branding
    ? {
        primaryColor: branding.primaryColor || "#16a34a",
        logoUrl: branding.logoUrl,
        backgroundUrl: branding.loginPageBackgroundUrl,
      }
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center">
      {branding?.loginPageBackgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${branding.loginPageBackgroundUrl})`,
            opacity: 0.1,
          }}
        />
      )}
      <div className="relative z-10 w-full max-w-md">
        {branding?.logoUrl && (
          <div className="mb-8 flex justify-center">
            <img
              src={branding.logoUrl}
              alt={branding.appName || "Logo"}
              className="h-16 w-auto"
            />
          </div>
        )}
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
            variables: {
              colorPrimary: customStyles?.primaryColor || "#16a34a",
            },
          }}
        />
      </div>
    </div>
  );
}

