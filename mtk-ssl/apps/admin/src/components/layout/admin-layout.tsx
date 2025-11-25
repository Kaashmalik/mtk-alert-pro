import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "kashif@maliktech.pk";

export async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const user = await currentUser();

  // Only allow super admin access
  if (!userId || user?.emailAddresses[0]?.emailAddress !== SUPER_ADMIN_EMAIL) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

