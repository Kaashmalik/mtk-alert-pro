"use client"

import { UseFormReturn } from "react-hook-form"
import { Input, Label, Textarea } from "@mtk/ui"
import { TournamentFormData } from "../tournament-wizard"
import { useLanguage } from "@/hooks/use-language"

interface StepTournamentDetailsProps {
  form: UseFormReturn<TournamentFormData>
}

export function StepTournamentDetails({ form }: StepTournamentDetailsProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("tournamentDetails") || "Tournament Details"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("tournamentDetailsDescription") || "Tell us about your tournament"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t("tournamentName")}</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="e.g., Summer Cricket League 2025"
            className="mt-2"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Describe your tournament..."
            className="mt-2 min-h-[100px]"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">{t("startDate")}</Label>
            <Input
              id="startDate"
              type="date"
              {...form.register("startDate")}
              className="mt-2"
            />
            {form.formState.errors.startDate && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.startDate.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="endDate">{t("endDate")}</Label>
            <Input
              id="endDate"
              type="date"
              {...form.register("endDate")}
              className="mt-2"
            />
            {form.formState.errors.endDate && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.endDate.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="location">{t("location")}</Label>
          <Input
            id="location"
            {...form.register("location")}
            placeholder="e.g., Karachi, Pakistan"
            className="mt-2"
          />
          {form.formState.errors.location && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.location.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

