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
    const period = searchParams.get("period") || "month"; // month, quarter, year

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active");

    if (subError) throw subError;

    // Get all payments
    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "completed")
      .order("paid_at", { ascending: false });

    if (payError) throw payError;

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = subscriptions.reduce((sum, sub) => {
      return sum + parseFloat(sub.monthly_amount || "0");
    }, 0);

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || "0");
    }, 0);

    // Calculate churn (simplified - canceled subscriptions in last period)
    const now = new Date();
    const periodStart = new Date();
    if (period === "month") {
      periodStart.setMonth(now.getMonth() - 1);
    } else if (period === "quarter") {
      periodStart.setMonth(now.getMonth() - 3);
    } else {
      periodStart.setFullYear(now.getFullYear() - 1);
    }

    const { data: canceledSubs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "canceled")
      .gte("canceled_at", periodStart.toISOString());

    const churnRate = subscriptions.length > 0
      ? ((canceledSubs?.length || 0) / subscriptions.length) * 100
      : 0;

    // Revenue by plan
    const revenueByPlan = subscriptions.reduce((acc, sub) => {
      const plan = sub.plan || "free";
      acc[plan] = (acc[plan] || 0) + parseFloat(sub.monthly_amount || "0");
      return acc;
    }, {} as Record<string, number>);

    // Recent payments
    const recentPayments = payments.slice(0, 10);

    return NextResponse.json({
      mrr,
      arr,
      totalRevenue,
      churnRate: parseFloat(churnRate.toFixed(2)),
      activeSubscriptions: subscriptions.length,
      revenueByPlan,
      recentPayments,
    });
  } catch (error) {
    console.error("Revenue API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}

