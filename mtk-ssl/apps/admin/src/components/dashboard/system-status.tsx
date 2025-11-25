"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";

export function SystemStatus() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/system-health");
        const data = await res.json();
        setHealth(data);
      } catch (error) {
        console.error("Failed to fetch system health:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Platform service status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${getStatusColor(
                    health?.status || "unknown"
                  )}`}
                />
                <span className="text-sm capitalize">{health?.status || "Unknown"}</span>
              </div>
            </div>
            {health?.services &&
              Object.entries(health.services).slice(0, 4).map(([service, data]: [string, any]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{service}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(data.status || "unknown")}`}
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {data.status || "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

