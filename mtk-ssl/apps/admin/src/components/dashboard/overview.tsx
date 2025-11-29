"use client";

import { useEffect, useState } from "react";
import { RevenueMetrics } from "./revenue-metrics";
import { LeaguesList } from "./leagues-list";
import { SystemStatus } from "./system-status";

export function DashboardOverview() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/revenue");
        const data = await res.json();
        setRevenue(data);
      } catch (error) {
        console.error("Failed to fetch revenue:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      <RevenueMetrics data={revenue} loading={loading} />

      <div className="grid gap-6 md:grid-cols-2">
        <LeaguesList />
        <SystemStatus />
      </div>
    </div>
  );
}

