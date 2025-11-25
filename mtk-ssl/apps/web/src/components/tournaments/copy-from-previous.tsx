"use client"

import { UseFormReturn } from "react-hook-form"
import { Button } from "@mtk/ui"
import { Copy } from "lucide-react"
import { TournamentFormData } from "./tournament-wizard"
import { useLanguage } from "@/hooks/use-language"

interface CopyFromPreviousProps {
  form: UseFormReturn<TournamentFormData>
}

export function CopyFromPrevious({ form }: CopyFromPreviousProps) {
  const { t } = useLanguage()

  const handleCopy = () => {
    // TODO: Fetch previous tournaments from API
    // For now, we'll use sample data
    const sampleData: Partial<TournamentFormData> = {
      format: "league",
      matchType: "t20",
      maxTeams: 8,
      registrationFee: 5000,
      prizePool: 50000,
      primaryColor: "#10b981",
    }

    // Apply sample data to form
    Object.entries(sampleData).forEach(([key, value]) => {
      if (value !== undefined) {
        form.setValue(key as keyof TournamentFormData, value as any)
      }
    })

    // Show toast notification
    alert(t("copiedFromPrevious") || "Settings copied from previous tournament!")
  }

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      className="flex items-center gap-2"
    >
      <Copy className="w-4 h-4" />
      {t("copyFromPrevious")}
    </Button>
  )
}

