"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { Button } from "@mtk/ui";
import { Input } from "@mtk/ui";

export function UsersManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [impersonating, setImpersonating] = useState(false);

  async function handleImpersonate() {
    if (!searchEmail) return;

    setImpersonating(true);
    try {
      // In a real implementation, you'd search for the user first
      // For now, this is a placeholder
      const res = await fetch("/api/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: searchEmail }), // This should be userId, not email
      });

      if (res.ok) {
        const data = await res.json();
        // In production, you'd set a cookie or session token here
        alert(`Impersonation token: ${data.impersonationToken}`);
      }
    } catch (error) {
      console.error("Failed to impersonate:", error);
    } finally {
      setImpersonating(false);
    }
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Impersonate User</CardTitle>
        <CardDescription>
          Enter a user email to impersonate them. Use this for support purposes only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="user@example.com"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleImpersonate} disabled={impersonating || !searchEmail}>
            {impersonating ? "Impersonating..." : "Impersonate"}
          </Button>
        </div>
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-600 dark:text-yellow-400">
          ⚠️ Warning: Impersonation should only be used for legitimate support purposes. All actions
          are logged.
        </div>
      </CardContent>
    </Card>
  );
}

