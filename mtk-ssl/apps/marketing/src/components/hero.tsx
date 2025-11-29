"use client";

import { motion } from "framer-motion";
import { Button } from "@mtk/ui";
import { Circle, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

const liveScores = [
  { team1: "Lahore Qalandars", score1: "145/3", team2: "Karachi Kings", score2: "132/7", overs: "18.2" },
  { team1: "Islamabad United", score1: "178/5", team2: "Multan Sultans", score2: "165/9", overs: "19.4" },
  { team1: "Peshawar Zalmi", score1: "156/4", team2: "Quetta Gladiators", score2: "142/6", overs: "17.1" },
];

export function Hero() {
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScore((prev) => (prev + 1) % liveScores.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Animated Cricket Ball */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
          >
            <motion.div
              className="relative"
              animate={{
                rotate: [0, 360],
                y: [0, -20, 0],
              }}
              transition={{
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                },
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center">
                <Circle className="w-12 h-12 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-50"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.3, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="font-[var(--font-inter)]">Pakistan Ka Apna</span>
            <br />
            <span className="urdu-mixed text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              Cricket League Platform
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl sm:text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="urdu-mixed">
              Lahore Qalandars se le kar gali cricket tak — SSL sab manage karta hai
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Apna League Free Shuru Karein
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2"
            >
              Demo Dekhein
            </Button>
          </motion.div>

          {/* Live Score Ticker */}
          <motion.div
            className="mt-16 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Live Scores
                </span>
              </div>
              <motion.div
                key={currentScore}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between"
              >
                <div className="flex-1 text-left">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {liveScores[currentScore].team1}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {liveScores[currentScore].score1}
                  </div>
                </div>
                <div className="px-4 text-gray-400">vs</div>
                <div className="flex-1 text-right">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {liveScores[currentScore].team2}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {liveScores[currentScore].score2}
                  </div>
                </div>
                <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  {liveScores[currentScore].overs} ov
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

