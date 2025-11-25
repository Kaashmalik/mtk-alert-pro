"use client"

import { UseFormReturn } from "react-hook-form"
import { Input, Label } from "@mtk/ui"
import { TournamentFormData } from "../tournament-wizard"
import { useLanguage } from "@/hooks/use-language"

interface StepRegistrationProps {
  form: UseFormReturn<TournamentFormData>
}

export function StepRegistration({ form }: StepRegistrationProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("registrationSettings") || "Registration Settings"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("registrationSettingsDescription") ||
            "Configure team limits and fees"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="maxTeams">{t("maxTeams")}</Label>
          <Input
            id="maxTeams"
            type="number"
            min={2}
            max={64}
            {...form.register("maxTeams", { valueAsNumber: true })}
            className="mt-2"
          />
          {form.formState.errors.maxTeams && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.maxTeams.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="registrationFee">{t("registrationFee")}</Label>
          <Input
            id="registrationFee"
            type="number"
            min={0}
            step={100}
            {...form.register("registrationFee", { valueAsNumber: true })}
            placeholder="0"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("optional") || "Optional - Leave 0 for free registration"}
          </p>
        </div>

        <div>
          <Label htmlFor="prizePool">{t("prizePool")}</Label>
          <Input
            id="prizePool"
            type="number"
            min={0}
            step={1000}
            {...form.register("prizePool", { valueAsNumber: true })}
            placeholder="0"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("optional") || "Optional - Total prize money"}
          </p>
        </div>
      </div>
    </div>
  )
}

