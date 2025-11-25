import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@mtk/database";
import { tenants, dnsVerifications } from "@mtk/database";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * GET - Check DNS verification status
 */
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

    // Get DNS verification
    const verification = await db
      .select()
      .from(dnsVerifications)
      .where(
        and(
          eq(dnsVerifications.tenantId, tenant[0].id),
          eq(dnsVerifications.domain, domain)
        )
      )
      .limit(1);

    if (verification.length === 0) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    // Check DNS record (simplified - in production, use a DNS lookup library)
    const isVerified = await checkDnsRecord(
      domain,
      verification[0].verificationType,
      verification[0].expectedValue
    );

    if (isVerified && verification[0].status !== "verified") {
      // Update status
      await db
        .update(dnsVerifications)
        .set({
          status: "verified",
          verifiedAt: new Date(),
          lastCheckedAt: new Date(),
        })
        .where(eq(dnsVerifications.id, verification[0].id));

      // Update tenant
      await db
        .update(tenants)
        .set({
          customDomainVerified: true,
          customDomainVerifiedAt: new Date(),
        })
        .where(eq(tenants.id, tenant[0].id));
    }

    const updated = await db
      .select()
      .from(dnsVerifications)
      .where(eq(dnsVerifications.id, verification[0].id))
      .limit(1);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error checking DNS verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Initiate DNS verification
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

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

    // Check if enterprise plan
    if (tenant[0].plan !== "enterprise") {
      return NextResponse.json(
        { error: "Custom domain requires Enterprise plan" },
        { status: 403 }
      );
    }

    // Generate verification token
    const verificationToken = randomBytes(16).toString("hex");
    const expectedValue = `ssl-verify=${verificationToken}`;

    // Create or update DNS verification
    const existing = await db
      .select()
      .from(dnsVerifications)
      .where(
        and(
          eq(dnsVerifications.tenantId, tenant[0].id),
          eq(dnsVerifications.domain, domain)
        )
      )
      .limit(1);

    const verificationData = {
      tenantId: tenant[0].id,
      domain,
      verificationToken,
      verificationType: "txt",
      expectedValue,
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    if (existing.length > 0) {
      await db
        .update(dnsVerifications)
        .set(verificationData)
        .where(eq(dnsVerifications.id, existing[0].id));
    } else {
      await db.insert(dnsVerifications).values(verificationData);
    }

    const verification = await db
      .select()
      .from(dnsVerifications)
      .where(
        and(
          eq(dnsVerifications.tenantId, tenant[0].id),
          eq(dnsVerifications.domain, domain)
        )
      )
      .limit(1);

    return NextResponse.json(verification[0]);
  } catch (error) {
    console.error("Error initiating DNS verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check DNS record (simplified - in production use dns.promises.resolveTxt or similar)
 */
async function checkDnsRecord(
  domain: string,
  type: string,
  expectedValue: string
): Promise<boolean> {
  // In production, use a proper DNS lookup library
  // For now, return false to indicate verification is pending
  // This should be implemented with actual DNS queries
  try {
    // Example using Node.js dns module (would need to be in a server-side context)
    // const dns = require('dns').promises;
    // const records = await dns.resolveTxt(domain);
    // return records.some(record => record.includes(expectedValue));
    return false; // Placeholder
  } catch (error) {
    console.error("DNS check error:", error);
    return false;
  }
}

