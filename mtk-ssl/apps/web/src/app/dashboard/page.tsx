import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@mtk/ui";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Welcome to your SSL dashboard
            </p>
          </div>
          <Link href="/tournaments/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Tournament
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Leagues</CardTitle>
              <CardDescription>Manage your cricket leagues</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">No leagues yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Tournaments</CardTitle>
              <CardDescription>Currently running tournaments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">No active tournaments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Total teams registered</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">No teams yet</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with SSL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Create your first league
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Register teams and players
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Start a tournament
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

