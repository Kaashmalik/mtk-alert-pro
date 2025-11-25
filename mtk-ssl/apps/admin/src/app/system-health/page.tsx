import { AdminLayout } from "@/components/layout/admin-layout";
import { SystemHealthDashboard } from "@/components/system-health/system-health-dashboard";

export default function SystemHealthPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health & Error Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor platform health, uptime, and error logs.
          </p>
        </div>
        <SystemHealthDashboard />
      </div>
    </AdminLayout>
  );
}

