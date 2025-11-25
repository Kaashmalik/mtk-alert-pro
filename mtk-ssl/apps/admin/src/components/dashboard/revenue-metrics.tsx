"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";
import { motion } from "framer-motion";

interface RevenueMetricsProps {
  data: any;
  loading: boolean;
}

export function RevenueMetrics({ data, loading }: RevenueMetricsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "MRR",
      description: "Monthly Recurring Revenue",
      value: `₨${(data?.mrr || 0).toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
    },
    {
      title: "ARR",
      description: "Annual Recurring Revenue",
      value: `₨${(data?.arr || 0).toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
    },
    {
      title: "Total Revenue",
      description: "All-time revenue",
      value: `₨${(data?.totalRevenue || 0).toLocaleString()}`,
      change: "+8.2%",
      trend: "up",
    },
    {
      title: "Churn Rate",
      description: "Monthly churn",
      value: `${(data?.churnRate || 0).toFixed(2)}%`,
      change: "-2.1%",
      trend: "down",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="relative">
              <CardDescription>{metric.description}</CardDescription>
              <CardTitle className="text-2xl font-bold">{metric.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{metric.value}</span>
                <span
                  className={`text-sm font-medium ${
                    metric.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

