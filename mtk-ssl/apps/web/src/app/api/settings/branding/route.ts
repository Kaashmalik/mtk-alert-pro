import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@mtk/database";
import { tenants, tenantBranding } from "@mtk/database";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant for current user
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, userId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const branding = await db
      .select()
      .from(tenantBranding)
      .where(eq(tenantBranding.tenantId, tenant[0].id))
      .limit(1);

    const brandingData = branding[0] || {};

    return NextResponse.json({
      ...brandingData,
      customDomain: tenant[0].customDomain,
    });
  } catch (error) {
    console.error("Error fetching branding settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get tenant for current user
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, userId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenant[0].id;

    // Update custom domain if provided
    if (body.customDomain !== undefined) {
      await db
        .update(tenants)
        .set({ customDomain: body.customDomain || null })
        .where(eq(tenants.id, tenantId));
    }

    // Update or insert branding
    const existingBranding = await db
      .select()
      .from(tenantBranding)
      .where(eq(tenantBranding.tenantId, tenantId))
      .limit(1);

    const brandingData = {
      tenantId,
      logoUrl: body.logoUrl || null,
      faviconUrl: body.faviconUrl || null,
      primaryColor: body.primaryColor || null,
      secondaryColor: body.secondaryColor || null,
      accentColor: body.accentColor || null,
      fontFamily: body.fontFamily || null,
      appName: body.appName || null,
      hideSslBranding: body.hideSslBranding || false,
      emailSenderName: body.emailSenderName || null,
      emailSenderAddress: body.emailSenderAddress || null,
      mobileAppIconUrl: body.mobileAppIconUrl || null,
      mobileAppSplashUrl: body.mobileAppSplashUrl || null,
      mobileAppBundleId: body.mobileAppBundleId || null,
      mobileAppPackageName: body.mobileAppPackageName || null,
    };

    if (existingBranding.length > 0) {
      await db
        .update(tenantBranding)
        .set(brandingData)
        .where(eq(tenantBranding.tenantId, tenantId));
    } else {
      await db.insert(tenantBranding).values(brandingData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating branding settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

