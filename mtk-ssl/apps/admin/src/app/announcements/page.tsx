import { AdminLayout } from "@/components/layout/admin-layout";
import { AnnouncementsManagement } from "@/components/announcements/announcements-management";

export default function AnnouncementsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Announcements</h1>
          <p className="text-muted-foreground mt-2">
            Broadcast announcements to all users or specific audiences.
          </p>
        </div>
        <AnnouncementsManagement />
      </div>
    </AdminLayout>
  );
}

