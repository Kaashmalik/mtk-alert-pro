"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { Button } from "@mtk/ui";
import { Textarea } from "@mtk/ui";

export function WhiteLabelManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/white-label?status=pending");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Failed to fetch white-label requests:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(requestId: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/white-label", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status, adminNotes }),
      });

      if (res.ok) {
        await fetchRequests();
        setSelectedRequest(null);
        setAdminNotes("");
      }
    } catch (error) {
      console.error("Failed to review request:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Pending Requests ({requests.length})</CardTitle>
        <CardDescription>Review white-label requests</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending requests</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg bg-muted/30 border border-border/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {request.tenants?.name || "Unknown League"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Plan: {request.tenants?.plan} • Requested: {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    {request.custom_domain && (
                      <div className="text-sm mt-1">Custom Domain: {request.custom_domain}</div>
                    )}
                    {request.reason && (
                      <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                        Reason: {request.reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                    >
                      {selectedRequest === request.id ? "Hide" : "Review"}
                    </Button>
                  </div>
                </div>
                {selectedRequest === request.id && (
                  <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
                    <Textarea
                      placeholder="Admin notes (optional)"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReview(request.id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReview(request.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

