import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { TrustBadges } from "@/components/trust-badges";
import { Waitlist } from "@/components/waitlist";
import { Footer } from "@/components/footer";
import { headers } from "next/headers";
import { db } from "@mtk/database";
import { tenants, tenantBranding } from "@mtk/database";
import { eq } from "drizzle-orm";

async function getTenantFromRequest() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  // Check for custom domain
  const customDomainTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.customDomain, host))
    .limit(1);

  if (customDomainTenant.length > 0) {
    return customDomainTenant[0];
  }

  // Check for subdomain
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

export default async function MarketingPage() {
  const tenant = await getTenantFromRequest();
  const isEnterprise = tenant?.plan === "enterprise";

  // Get tenant branding if tenant exists
  let brandingData = null;
  if (tenant) {
    const branding = await db
      .select()
      .from(tenantBranding)
      .where(eq(tenantBranding.tenantId, tenant.id))
      .limit(1);
    
    brandingData = {
      tenant,
      branding: branding[0] || null,
    };
  }

  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <section id="features">
        <Features />
      </section>
      <TrustBadges />
      {!isEnterprise && (
        <section id="pricing">
          <Pricing />
        </section>
      )}
      <Waitlist />
      <Footer tenantBranding={brandingData} />
    </main>
  );
}
