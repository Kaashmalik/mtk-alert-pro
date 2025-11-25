"use client"

import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui"
import { Calendar, Clock, MapPin } from "lucide-react"
import { TournamentFormData } from "../tournament-wizard"
import { useLanguage } from "@/hooks/use-language"
import { PointsTablePreview } from "../points-table-preview"

interface StepScheduleProps {
  form: UseFormReturn<TournamentFormData>
}

export function StepSchedule({ form }: StepScheduleProps) {
  const { t } = useLanguage()
  const format = form.watch("format")
  const maxTeams = form.watch("maxTeams")
  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")

  // Calculate schedule preview
  const calculateMatches = () => {
    if (!maxTeams) return { total: 0, days: 0, matchesPerDay: 0 }

    let totalMatches = 0
    if (format === "knockout") {
      totalMatches = maxTeams - 1
    } else if (format === "league") {
      totalMatches = (maxTeams * (maxTeams - 1)) / 2
    } else if (format === "hybrid") {
      const groups = Math.ceil(maxTeams / 4)
      const perGroup = Math.ceil(maxTeams / groups)
      const groupMatches = groups * ((perGroup * (perGroup - 1)) / 2)
      const knockoutMatches = groups - 1
      totalMatches = groupMatches + knockoutMatches
    }

    const days = endDate && startDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 7

    return {
      total: totalMatches,
      days: days || 7,
      matchesPerDay: Math.ceil(totalMatches / (days || 7)),
    }
  }

  const schedule = calculateMatches()

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("schedulePreview") || "Schedule Preview"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("schedulePreviewDescription") ||
            "Auto-generated schedule based on your settings"}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t("totalMatches") || "Total Matches"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{schedule.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t("duration") || "Duration"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{schedule.days}</p>
            <p className="text-sm text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t("matchesPerDay") || "Matches/Day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{schedule.matchesPerDay}</p>
          </CardContent>
        </Card>
      </div>

      <PointsTablePreview form={form} />
    </div>
  )
}

