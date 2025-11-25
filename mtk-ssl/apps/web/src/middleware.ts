import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@mtk/database";
import { tenants, tenantBranding } from "@mtk/database";
import { eq } from "drizzle-orm";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

async function getTenantFromRequest(host: string) {
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

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get("host") || "";
  
  // Get tenant from domain
  const tenant = await getTenantFromRequest(host);
  
  if (tenant) {
    // Get branding
    const branding = await db
      .select()
      .from(tenantBranding)
      .where(eq(tenantBranding.tenantId, tenant.id))
      .limit(1);

    // Store tenant and branding in headers for use in pages
    const response = NextResponse.next();
    response.headers.set("x-tenant-id", tenant.id);
    response.headers.set("x-tenant-plan", tenant.plan);
    if (branding.length > 0) {
      response.headers.set("x-tenant-branding", JSON.stringify(branding[0]));
    }
    
    // Handle authentication
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    
    return response;
  }

  // Default behavior for non-tenant domains
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

