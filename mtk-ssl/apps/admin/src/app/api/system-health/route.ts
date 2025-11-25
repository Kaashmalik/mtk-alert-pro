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
    const type = searchParams.get("type") || "health"; // health or errors

    if (type === "errors") {
      const { data: errors, error: errError } = await supabase
        .from("error_logs")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(100);

      if (errError) throw errError;

      return NextResponse.json({ errors: errors || [] });
    }

    // Get system health metrics
    const { data: health, error: healthError } = await supabase
      .from("system_health")
      .select("*")
      .order("last_checked", { ascending: false });

    if (healthError) throw healthError;

    // Calculate overall uptime (simplified)
    const services = health || [];
    const overallStatus = services.every((s) => s.status === "healthy")
      ? "healthy"
      : services.some((s) => s.status === "down")
      ? "down"
      : "degraded";

    return NextResponse.json({
      status: overallStatus,
      services: services.reduce((acc, s) => {
        acc[s.service] = s;
        return acc;
      }, {} as Record<string, any>),
    });
  } catch (error) {
    console.error("System health API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system health" },
      { status: 500 }
    );
  }
}

