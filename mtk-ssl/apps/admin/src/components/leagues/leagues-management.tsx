"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui";
import { Button } from "@mtk/ui";
import { motion } from "framer-motion";

export function LeaguesManagement() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  async function fetchLeagues() {
    try {
      const res = await fetch("/api/leagues");
      const data = await res.json();
      setLeagues(data.leagues || []);
    } catch (error) {
      console.error("Failed to fetch leagues:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLeagueStatus(leagueId: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/leagues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId, isActive: !currentStatus }),
      });

      if (res.ok) {
        await fetchLeagues();
      }
    } catch (error) {
      console.error("Failed to update league:", error);
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
        <CardTitle>All Leagues ({leagues.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leagues.map((league, index) => (
            <motion.div
              key={league.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-semibold">{league.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {league.slug} • {league.plan} • Created {new Date(league.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    league.is_active
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {league.is_active ? "Active" : "Suspended"}
                </div>
                <Button
                  variant={league.is_active ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleLeagueStatus(league.id, league.is_active)}
                >
                  {league.is_active ? "Suspend" : "Activate"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

