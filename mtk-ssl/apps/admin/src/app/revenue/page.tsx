import { AdminLayout } from "@/components/layout/admin-layout";
import { RevenueDashboard } from "@/components/revenue/revenue-dashboard";

export default function RevenuePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track MRR, ARR, churn, and revenue metrics.
          </p>
        </div>
        <RevenueDashboard />
      </div>
    </AdminLayout>
  );
}

