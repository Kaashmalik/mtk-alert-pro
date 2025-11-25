import { AdminLayout } from "@/components/layout/admin-layout";
import { FeatureFlagsManagement } from "@/components/feature-flags/feature-flags-management";

export default function FeatureFlagsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground mt-2">
            Control feature availability across the platform (e.g., enable AI for all).
          </p>
        </div>
        <FeatureFlagsManagement />
      </div>
    </AdminLayout>
  );
}

