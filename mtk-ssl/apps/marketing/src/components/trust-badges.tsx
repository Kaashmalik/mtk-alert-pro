"use client";

import { motion } from "framer-motion";
import { Shield, Award, Users, Globe } from "lucide-react";

const leagues = [
  "Kashmir Premier League",
  "Karachi Champions",
  "Lahore Super League",
  "Islamabad Cricket Association",
  "Multan Cricket League",
  "Peshawar Premier League",
];

export function TrustBadges() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h3
            className="text-2xl font-semibold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Trusted by Leading Leagues
          </motion.h3>
          <motion.p
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Used by cricket leagues across Pakistan and worldwide
          </motion.p>
        </div>

        {/* League Logos/Names */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {leagues.map((league, index) => (
            <motion.div
              key={league}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                {league}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, label: "Secure & Reliable" },
            { icon: Award, label: "Award Winning" },
            { icon: Users, label: "50,000+ Users" },
            { icon: Globe, label: "5+ Countries" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

