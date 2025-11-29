"use client"

import { UseFormReturn } from "react-hook-form"
import { motion } from "framer-motion"
import { Card, CardContent, Input, Label } from "@mtk/ui"
import { Circle, Clock, Zap } from "lucide-react"
import { TournamentFormData } from "../tournament-wizard"
import { useLanguage } from "@/hooks/use-language"

interface StepMatchTypeProps {
  form: UseFormReturn<TournamentFormData>
}

const matchTypes = [
  {
    value: "t20" as const,
    icon: Zap,
    title: "T20",
    description: "20 overs per side",
    color: "from-yellow-500 to-orange-500",
  },
  {
    value: "odi" as const,
    icon: Circle,
    title: "ODI",
    description: "50 overs per side",
    color: "from-blue-500 to-indigo-500",
  },
  {
    value: "tape_ball" as const,
    icon: Clock,
    title: "Tape Ball",
    description: "Fast-paced street cricket",
    color: "from-purple-500 to-pink-500",
  },
  {
    value: "custom" as const,
    icon: Clock,
    title: "Custom Overs",
    description: "Set your own overs",
    color: "from-gray-500 to-slate-500",
  },
]

export function StepMatchType({ form }: StepMatchTypeProps) {
  const { t } = useLanguage()
  const selectedType = form.watch("matchType")
  const customOvers = form.watch("customOvers")

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("matchType")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("selectMatchType")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {matchTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.value
          const isCustom = type.value === "custom"

          return (
            <motion.div
              key={type.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => {
                  form.setValue("matchType", type.value)
                  if (!isCustom) {
                    form.setValue("customOvers", undefined)
                  }
                }}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 mx-auto`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {type.description}
                  </p>

                  {isCustom && isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4"
                    >
                      <Label htmlFor="customOvers">{t("customOvers")}</Label>
                      <Input
                        id="customOvers"
                        type="number"
                        min={1}
                        max={50}
                        value={customOvers || ""}
                        onChange={(e) =>
                          form.setValue(
                            "customOvers",
                            parseInt(e.target.value) || undefined
                          )
                        }
                        className="mt-2"
                        placeholder="e.g., 10, 15, 30"
                      />
                    </motion.div>
                  )}

                  {isSelected && !isCustom && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-4 text-center"
                    >
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        Selected
                      </span>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

