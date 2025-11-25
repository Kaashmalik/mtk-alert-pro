import { AdminLayout } from "@/components/layout/admin-layout";
import { LeaguesManagement } from "@/components/leagues/leagues-management";

export default function LeaguesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leagues Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all active leagues, suspend or activate them with one click.
          </p>
        </div>
        <LeaguesManagement />
      </div>
    </AdminLayout>
  );
}

