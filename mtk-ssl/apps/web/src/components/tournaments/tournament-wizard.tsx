"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Stepper, Card, CardContent, Button, Progress } from "@mtk/ui"
import { ChevronLeft, ChevronRight, Languages } from "lucide-react"
import { StepFormat } from "./steps/step-format"
import { StepMatchType } from "./steps/step-match-type"
import { StepTournamentDetails } from "./steps/step-tournament-details"
import { StepRegistration } from "./steps/step-registration"
import { StepSchedule } from "./steps/step-schedule"
import { StepSeeding } from "./steps/step-seeding"
import { StepBranding } from "./steps/step-branding"
import { CompletionScreen } from "./completion-screen"
import { useLanguage } from "@/hooks/use-language"
import { CopyFromPrevious } from "./copy-from-previous"

const tournamentSchema = z.object({
  format: z.enum(["knockout", "league", "hybrid"]),
  matchType: z.enum(["t20", "odi", "tape_ball", "custom"]),
  customOvers: z.number().min(1).max(50).optional(),
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().min(1),
  maxTeams: z.number().min(2).max(64),
  registrationFee: z.number().min(0).optional(),
  prizePool: z.number().min(0).optional(),
  teamSeeding: z.array(z.string()).optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
})

export type TournamentFormData = z.infer<typeof tournamentSchema>

const STEPS = [
  { label: "Format", description: "Choose tournament type" },
  { label: "Match Type", description: "Select format" },
  { label: "Details", description: "Tournament info" },
  { label: "Registration", description: "Teams & fees" },
  { label: "Schedule", description: "Auto-generate" },
  { label: "Seeding", description: "Team order" },
  { label: "Branding", description: "Customize" },
]

export function TournamentWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const { language, toggleLanguage, t } = useLanguage()

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      format: undefined,
      matchType: undefined,
      customOvers: undefined,
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      maxTeams: 8,
      registrationFee: 0,
      prizePool: 0,
      teamSeeding: [],
      logo: "",
      primaryColor: "#10b981",
    },
    mode: "onChange",
  })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const nextStep = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      const data = form.getValues()
      console.log("Tournament data:", data)
      // TODO: Submit to API
      setIsCompleted(true)
    }
  }

  if (isCompleted) {
    return <CompletionScreen formData={form.getValues()} />
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t("createTournament")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("createTournamentDescription")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CopyFromPrevious form={form} />
            <Button
              variant="outline"
              onClick={toggleLanguage}
              className="flex items-center gap-2"
            >
              <Languages className="w-4 h-4" />
              {language === "en" ? "اردو" : "English"}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stepper */}
      <Card className="mb-6 hidden md:block">
        <CardContent className="p-6">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Form Steps */}
      <Card>
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && <StepFormat form={form} />}
              {currentStep === 1 && <StepMatchType form={form} />}
              {currentStep === 2 && <StepTournamentDetails form={form} />}
              {currentStep === 3 && <StepRegistration form={form} />}
              {currentStep === 4 && <StepSchedule form={form} />}
              {currentStep === 5 && <StepSeeding form={form} />}
              {currentStep === 6 && <StepBranding form={form} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="min-w-[120px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t("previous")}
            </Button>

            <div className="text-sm text-muted-foreground">
              {t("step")} {currentStep + 1} {t("of")} {STEPS.length}
            </div>

            <Button
              onClick={nextStep}
              className="min-w-[120px]"
            >
              {currentStep === STEPS.length - 1 ? t("create") : t("next")}
              {currentStep < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

