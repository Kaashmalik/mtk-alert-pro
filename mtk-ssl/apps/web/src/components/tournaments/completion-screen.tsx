"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { motion } from "framer-motion"
import { Card, CardContent, Button } from "@mtk/ui"
import { CheckCircle, Trophy, Calendar, MapPin } from "lucide-react"
import { TournamentFormData } from "./tournament-wizard"
import { useLanguage } from "@/hooks/use-language"
import { useRouter } from "next/navigation"

interface CompletionScreenProps {
  formData: TournamentFormData
}

export function CompletionScreen({ formData }: CompletionScreenProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold mb-4">
              {t("tournamentCreated") || "Tournament Created!"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("tournamentCreatedDescription") ||
                "Your tournament has been successfully created"}
            </p>

            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-semibold">{formData.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span>
                  {formData.startDate} - {formData.endDate}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{formData.location}</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                {t("goToDashboard") || "Go to Dashboard"}
              </Button>
              <Button onClick={() => router.push("/tournaments/new")}>
                {t("createAnother") || "Create Another"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

