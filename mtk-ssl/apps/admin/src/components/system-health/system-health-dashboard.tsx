"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { Button } from "@mtk/ui";

export function SystemHealthDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"health" | "errors">("health");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  async function fetchData() {
    try {
      if (activeTab === "health") {
        const res = await fetch("/api/system-health");
        const data = await res.json();
        setHealth(data);
      } else {
        const res = await fetch("/api/system-health?type=errors");
        const data = await res.json();
        setErrors(data.errors || []);
      }
    } catch (error) {
      console.error("Failed to fetch system data:", error);
    } finally {
      setLoading(false);
    }
  }

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-500";
      case "high":
        return "bg-orange-500/20 text-orange-500";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500";
      default:
        return "bg-blue-500/20 text-blue-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border/40">
        <Button
          variant={activeTab === "health" ? "default" : "ghost"}
          onClick={() => setActiveTab("health")}
        >
          System Health
        </Button>
        <Button
          variant={activeTab === "errors" ? "default" : "ghost"}
          onClick={() => setActiveTab("errors")}
        >
          Error Logs ({errors.length})
        </Button>
      </div>

      {activeTab === "health" ? (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Real-time platform health monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/40">
                  <span className="font-semibold">Overall Status</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${getStatusColor(health?.status || "unknown")}`}
                    />
                    <span className="capitalize font-medium">{health?.status || "Unknown"}</span>
                  </div>
                </div>
                {health?.services &&
                  Object.entries(health.services).map(([service, data]: [string, any]) => (
                    <div
                      key={service}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/40"
                    >
                      <div className="flex-1">
                        <div className="font-medium capitalize">{service}</div>
                        {data.response_time && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Response: {data.response_time}ms
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {data.uptime && (
                          <div className="text-sm text-muted-foreground">
                            Uptime: {Math.floor(data.uptime / 3600)}h
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${getStatusColor(data.status || "unknown")}`}
                          />
                          <span className="text-sm capitalize">{data.status || "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Error Logs</CardTitle>
            <CardDescription>Recent unresolved errors</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : errors.length === 0 ? (
              <p className="text-muted-foreground text-sm">No errors found</p>
            ) : (
              <div className="space-y-3">
                {errors.slice(0, 20).map((error) => (
                  <div
                    key={error.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border/40"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                              error.severity
                            )}`}
                          >
                            {error.severity}
                          </span>
                          <span className="text-sm text-muted-foreground">{error.service}</span>
                        </div>
                        <div className="font-medium mt-2">{error.message}</div>
                        {error.error_type && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Type: {error.error_type}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(error.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

