import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseServer, isSuperAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(user.emailAddresses[0].emailAddress);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ featureFlags: data || [] });
  } catch (error) {
    console.error("Feature flags API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(user.emailAddresses[0].emailAddress);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { flagId, isEnabled, rolloutPercentage, metadata } = await request.json();

    if (!flagId) {
      return NextResponse.json(
        { error: "flagId is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (typeof isEnabled === "boolean") updateData.is_enabled = isEnabled;
    if (rolloutPercentage !== undefined) updateData.rollout_percentage = rolloutPercentage;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabase
      .from("feature_flags")
      .update(updateData)
      .eq("id", flagId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ featureFlag: data });
  } catch (error) {
    console.error("Update feature flag error:", error);
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(user.emailAddresses[0].emailAddress);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, name, description, isEnabled, rolloutPercentage, targetTenants, metadata } = await request.json();

    if (!key || !name) {
      return NextResponse.json(
        { error: "key and name are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("feature_flags")
      .insert({
        key,
        name,
        description,
        is_enabled: isEnabled || false,
        rollout_percentage: rolloutPercentage || "0",
        target_tenants: targetTenants || null,
        metadata: metadata || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ featureFlag: data });
  } catch (error) {
    console.error("Create feature flag error:", error);
    return NextResponse.json(
      { error: "Failed to create feature flag" },
      { status: 500 }
    );
  }
}

