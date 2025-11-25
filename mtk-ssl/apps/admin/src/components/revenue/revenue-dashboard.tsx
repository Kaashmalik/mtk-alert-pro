"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { RevenueMetrics } from "../dashboard/revenue-metrics";
import { motion } from "framer-motion";

export function RevenueDashboard() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-6">
      <RevenueMetrics data={revenue} loading={loading} />

      {revenue && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Monthly recurring revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(revenue.revenueByPlan || {}).map(([plan, amount]: [string, any]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{plan}</span>
                      <span className="text-lg font-bold">₨{parseFloat(amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest completed transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenue.recentPayments?.slice(0, 5).map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {payment.payment_method || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString()
                            : "Pending"}
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        ₨{parseFloat(payment.amount || "0").toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

