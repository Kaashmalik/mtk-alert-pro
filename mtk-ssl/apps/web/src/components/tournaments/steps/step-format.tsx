"use client"

import { UseFormReturn } from "react-hook-form"
import { motion } from "framer-motion"
import { Card, CardContent } from "@mtk/ui"
import { Trophy, Users, Layers } from "lucide-react"
import { TournamentFormData } from "../tournament-wizard"
import { useLanguage } from "@/hooks/use-language"

interface StepFormatProps {
  form: UseFormReturn<TournamentFormData>
}

const formats = [
  {
    value: "knockout" as const,
    icon: Trophy,
    title: "Knockout",
    description: "Single elimination bracket",
    color: "from-red-500 to-pink-500",
  },
  {
    value: "league" as const,
    icon: Users,
    title: "League",
    description: "Round robin, all teams play each other",
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "hybrid" as const,
    icon: Layers,
    title: "Group + Knockout",
    description: "Groups first, then knockout stages",
    color: "from-green-500 to-emerald-500",
  },
]

export function StepFormat({ form }: StepFormatProps) {
  const { t } = useLanguage()
  const selectedFormat = form.watch("format")

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("chooseFormat")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("formatDescription")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {formats.map((format) => {
          const Icon = format.icon
          const isSelected = selectedFormat === format.value

          return (
            <motion.div
              key={format.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => form.setValue("format", format.value)}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${format.color} flex items-center justify-center mb-4 mx-auto`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-2">
                    {format.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {format.description}
                  </p>
                  {isSelected && (
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

