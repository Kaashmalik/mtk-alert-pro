import { AdminLayout } from "@/components/layout/admin-layout";
import { UsersManagement } from "@/components/users/users-management";

export default function UsersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground mt-2">
            View all users and impersonate them for support purposes.
          </p>
        </div>
        <UsersManagement />
      </div>
    </AdminLayout>
  );
}

