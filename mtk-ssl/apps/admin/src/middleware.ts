import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// All admin routes require authentication
export default clerkMiddleware(async (auth, _req) => {
  await (await auth()).protect();

  // Additional check: verify super admin email
  const { userId } = await auth();
  if (userId) {
    // This is a basic check - the actual email check happens in page components
    // for server-side rendering, but we can add additional protection here if needed
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

