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
      .from("commission_rates")
      .select("*")
      .order("plan", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ commissionRates: data || [] });
  } catch (error) {
    console.error("Commission rates API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commission rates" },
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

    const { plan, rate, description } = await request.json();

    if (!plan || rate === undefined) {
      return NextResponse.json(
        { error: "plan and rate are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("commission_rates")
      .update({
        rate: rate.toString(),
        description,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("plan", plan)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ commissionRate: data });
  } catch (error) {
    console.error("Update commission rate error:", error);
    return NextResponse.json(
      { error: "Failed to update commission rate" },
      { status: 500 }
    );
  }
}

