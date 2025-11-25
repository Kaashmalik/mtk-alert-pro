"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { Button } from "@mtk/ui";
import Link from "next/link";

export function LeaguesList() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeagues() {
      try {
        const res = await fetch("/api/leagues");
        const data = await res.json();
        setLeagues(data.leagues?.slice(0, 5) || []);
      } catch (error) {
        console.error("Failed to fetch leagues:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeagues();
  }, []);

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Leagues</CardTitle>
            <CardDescription>Recently created leagues</CardDescription>
          </div>
          <Link href="/leagues">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <p className="text-muted-foreground text-sm">No leagues yet</p>
        ) : (
          <div className="space-y-3">
            {leagues.map((league) => (
              <div
                key={league.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40"
              >
                <div>
                  <div className="font-medium">{league.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {league.plan} • {league.slug}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    league.is_active
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {league.is_active ? "Active" : "Suspended"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

