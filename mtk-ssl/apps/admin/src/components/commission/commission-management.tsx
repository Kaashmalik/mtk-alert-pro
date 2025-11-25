"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { Button } from "@mtk/ui";
import { Input } from "@mtk/ui";

export function CommissionManagement() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const res = await fetch("/api/commission-rates");
      const data = await res.json();
      setRates(data.commissionRates || []);
      // Initialize editing state
      const editState: Record<string, string> = {};
      data.commissionRates?.forEach((rate: any) => {
        editState[rate.plan] = rate.rate;
      });
      setEditing(editState);
    } catch (error) {
      console.error("Failed to fetch commission rates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateRate(plan: string) {
    const rate = parseFloat(editing[plan]);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert("Rate must be between 0 and 100");
      return;
    }

    try {
      const res = await fetch("/api/commission-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, rate }),
      });

      if (res.ok) {
        await fetchRates();
      }
    } catch (error) {
      console.error("Failed to update commission rate:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Commission Rates</CardTitle>
        <CardDescription>Set commission percentage for each plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rates.map((rate) => (
            <div
              key={rate.plan}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/40"
            >
              <div className="flex-1">
                <div className="font-semibold capitalize">{rate.plan} Plan</div>
                <div className="text-sm text-muted-foreground mt-1">{rate.description}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editing[rate.plan] || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, [rate.plan]: e.target.value })
                    }
                    className="w-24"
                  />
                  <span className="text-sm">%</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => updateRate(rate.plan)}
                  disabled={editing[rate.plan] === rate.rate}
                >
                  Update
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-600 dark:text-blue-400">
          💡 Default commission rate is 15% for Pro plans. Changes take effect immediately.
        </div>
      </CardContent>
    </Card>
  );
}

