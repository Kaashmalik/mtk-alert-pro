import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/ssl(.*)",
]);

// Extract tenant info from hostname (without database - Edge runtime compatible)
function getTenantFromHost(host: string): { subdomain: string | null } {
  // Check for subdomain pattern: {tenant}.ssl.cricket or {tenant}.localhost:3002
  const parts = host.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (subdomain && subdomain !== "www" && subdomain !== "app" && subdomain !== "admin") {
      return { subdomain };
    }
  }
  return { subdomain: null };
}

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get("host") || "";
  const { subdomain } = getTenantFromHost(host);
  
  // Create response with tenant info in headers (actual tenant lookup happens in server components/API)
  const response = NextResponse.next();
  
  if (subdomain) {
    response.headers.set("x-tenant-slug", subdomain);
  }

  // Handle authentication for protected routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

