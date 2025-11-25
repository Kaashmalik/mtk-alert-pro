import { NextRequest, NextResponse } from "next/server";
import { db } from "@mtk/database";
import { tenants, tenantBranding } from "@mtk/database";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const host = searchParams.get("host");

    if (!host) {
      return NextResponse.json({ error: "Host required" }, { status: 400 });
    }

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

    if (!tenant) {
      return NextResponse.json({ tenant: null, branding: null });
    }

    const branding = await db
      .select()
      .from(tenantBranding)
      .where(eq(tenantBranding.tenantId, tenant.id))
      .limit(1);

    return NextResponse.json({
      tenant,
      branding: branding[0] || null,
    });
  } catch (error) {
    console.error("Error fetching tenant branding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

