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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const { data, error } = await supabase
      .from("white_label_requests")
      .select(`
        *,
        tenants:tenant_id (
          id,
          name,
          slug,
          plan
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ requests: data || [] });
  } catch (error) {
    console.error("White-label requests API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch white-label requests" },
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

    const { requestId, status, adminNotes } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "requestId and status are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("white_label_requests")
      .update({
        status,
        admin_notes: adminNotes,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;

    // If approved, update tenant branding
    if (status === "approved" && data) {
      await supabase
        .from("tenant_branding")
        .upsert({
          tenant_id: data.tenant_id,
          hide_ssl_branding: data.hide_branding,
          app_name: data.custom_app_name,
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error("Update white-label request error:", error);
    return NextResponse.json(
      { error: "Failed to update white-label request" },
      { status: 500 }
    );
  }
}

