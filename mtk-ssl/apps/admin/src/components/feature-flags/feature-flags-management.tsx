"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { Button } from "@mtk/ui";
import { Input } from "@mtk/ui";
import { Textarea } from "@mtk/ui";

export function FeatureFlagsManagement() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
    isEnabled: false,
    rolloutPercentage: "0",
  });

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    try {
      const res = await fetch("/api/feature-flags");
      const data = await res.json();
      setFlags(data.featureFlags || []);
    } catch (error) {
      console.error("Failed to fetch feature flags:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(flagId: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, isEnabled: !currentStatus }),
      });

      if (res.ok) {
        await fetchFlags();
      }
    } catch (error) {
      console.error("Failed to update feature flag:", error);
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch("/api/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchFlags();
        setShowForm(false);
        setFormData({ key: "", name: "", description: "", isEnabled: false, rolloutPercentage: "0" });
      }
    } catch (error) {
      console.error("Failed to create feature flag:", error);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable features globally</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Create Flag"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="space-y-4 border-t border-border/40 pt-6">
            <Input
              placeholder="Flag key (e.g., ai_commentary)"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            />
            <Input
              placeholder="Flag name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm">Enabled by default</label>
            </div>
            <Button onClick={handleCreate} className="w-full">
              Create Feature Flag
            </Button>
          </CardContent>
        )}
      </Card>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>All Feature Flags ({flags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : flags.length === 0 ? (
            <p className="text-muted-foreground text-sm">No feature flags yet</p>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/40"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{flag.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{flag.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">Key: {flag.key}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        flag.is_enabled
                          ? "bg-green-500/20 text-green-500"
                          : "bg-gray-500/20 text-gray-500"
                      }`}
                    >
                      {flag.is_enabled ? "Enabled" : "Disabled"}
                    </div>
                    <Button
                      variant={flag.is_enabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleFlag(flag.id, flag.is_enabled)}
                    >
                      {flag.is_enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

