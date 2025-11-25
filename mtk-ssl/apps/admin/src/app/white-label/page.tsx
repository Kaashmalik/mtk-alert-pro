import { AdminLayout } from "@/components/layout/admin-layout";
import { WhiteLabelManagement } from "@/components/white-label/white-label-management";

export default function WhiteLabelPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">White-Label Approval Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve white-label requests from enterprise customers.
          </p>
        </div>
        <WhiteLabelManagement />
      </div>
    </AdminLayout>
  );
}

