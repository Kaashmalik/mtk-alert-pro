import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@mtk/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Shakir Super League
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Pakistan&apos;s #1 Cricket Tournament Platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome to SSL</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Manage your cricket tournaments with ease. Create leagues, track
              scores, and engage with fans.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="w-full">
                  Get Started
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li>✓ Live ball-by-ball scoring</li>
              <li>✓ Tournament management</li>
              <li>✓ Team & player profiles</li>
              <li>✓ Real-time analytics</li>
              <li>✓ Mobile-first design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

