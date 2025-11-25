import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@mtk/database";
import { tenants, sslCertificates } from "@mtk/database";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }

    // Get tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, userId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get SSL certificate
    const certificate = await db
      .select()
      .from(sslCertificates)
      .where(
        and(
          eq(sslCertificates.tenantId, tenant[0].id),
          eq(sslCertificates.domain, domain)
        )
      )
      .limit(1);

    if (certificate.length === 0) {
      return NextResponse.json({ status: "pending" });
    }

    return NextResponse.json(certificate[0]);
  } catch (error) {
    console.error("Error fetching SSL status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

