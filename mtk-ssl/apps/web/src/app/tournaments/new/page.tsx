"use client"

import { TournamentWizard } from "@/components/tournaments/tournament-wizard"

export default function NewTournamentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <TournamentWizard />
      </div>
    </div>
  )
}

