import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@mtk/database";
import { tenants, emailDomainVerifications } from "@mtk/database";
import { eq, and } from "drizzle-orm";

/**
 * GET - Check email domain verification status
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

    // Get email verification
    const verification = await db
      .select()
      .from(emailDomainVerifications)
      .where(
        and(
          eq(emailDomainVerifications.tenantId, tenant[0].id),
          eq(emailDomainVerifications.domain, domain)
        )
      )
      .limit(1);

    if (verification.length === 0) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    // Check DNS records (simplified)
    const isVerified = await checkEmailDnsRecords(domain, verification[0]);

    if (isVerified && verification[0].status !== "verified") {
      await db
        .update(emailDomainVerifications)
        .set({
          status: "verified",
          verifiedAt: new Date(),
          lastCheckedAt: new Date(),
        })
        .where(eq(emailDomainVerifications.id, verification[0].id));

      await db
        .update(tenants)
        .set({ emailDomainVerified: true })
        .where(eq(tenants.id, tenant[0].id));
    }

    const updated = await db
      .select()
      .from(emailDomainVerifications)
      .where(eq(emailDomainVerifications.id, verification[0].id))
      .limit(1);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error checking email verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Initiate email domain verification
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domain, senderEmail } = body;

    if (!domain || !senderEmail) {
      return NextResponse.json(
        { error: "Domain and sender email required" },
        { status: 400 }
      );
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
        { error: "Custom email domain requires Enterprise plan" },
        { status: 403 }
      );
    }

    // Generate DKIM key (simplified - in production use proper key generation)
    const dkimSelector = "default";
    const dkimPublicKey = generateDkimPublicKey();

    // Generate SPF record
    const spfRecord = `v=spf1 include:_spf.ssl.cricket ~all`;

    // Generate DMARC record
    const dmarcRecord = `v=DMARC1; p=none; rua=mailto:dmarc@ssl.cricket`;

    const verificationData = {
      tenantId: tenant[0].id,
      domain,
      senderEmail,
      dkimPublicKey,
      dkimSelector,
      spfRecord,
      dmarcRecord,
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };

    const existing = await db
      .select()
      .from(emailDomainVerifications)
      .where(
        and(
          eq(emailDomainVerifications.tenantId, tenant[0].id),
          eq(emailDomainVerifications.domain, domain)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(emailDomainVerifications)
        .set(verificationData)
        .where(eq(emailDomainVerifications.id, existing[0].id));
    } else {
      await db.insert(emailDomainVerifications).values(verificationData);
    }

    const verification = await db
      .select()
      .from(emailDomainVerifications)
      .where(
        and(
          eq(emailDomainVerifications.tenantId, tenant[0].id),
          eq(emailDomainVerifications.domain, domain)
        )
      )
      .limit(1);

    return NextResponse.json(verification[0]);
  } catch (error) {
    console.error("Error initiating email verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check email DNS records (simplified)
 */
async function checkEmailDnsRecords(
  _domain: string,
  _verification: Record<string, unknown>
): Promise<boolean> {
  // In production, check actual DNS records for SPF, DKIM, DMARC
  // For now, return false
  return false;
}

/**
 * Generate DKIM public key (simplified)
 */
function generateDkimPublicKey(): string {
  // In production, generate proper RSA public key
  // This is a placeholder
  return `k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...`;
}

