"use client";

import { motion } from "framer-motion";
import { Users, Trophy, User, Heart, BarChart3, Smartphone, Globe, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui";

const features = [
  {
    icon: Users,
    title: "For Organizers",
    description: "Create tournaments, manage teams, schedule matches, and track everything in one place.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Trophy,
    title: "For Teams",
    description: "Register your team, manage players, track stats, and compete in multiple leagues.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: User,
    title: "For Players",
    description: "Build your cricket profile, showcase your stats, and get discovered by teams.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "For Fans",
    description: "Follow live scores, get push notifications, watch highlights, and engage with your favorite teams.",
    color: "from-red-500 to-rose-500",
  },
];

const stats = [
  { label: "Matches Scored", value: "10,000+", icon: BarChart3 },
  { label: "Active Leagues", value: "500+", icon: Trophy },
  { label: "Registered Players", value: "50,000+", icon: User },
  { label: "Countries", value: "5+", icon: Globe },
];

export function Features() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Counter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-4">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Har Kisi Ke Liye Kuch Hai
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Organizers, teams, players, aur fans — sabke liye powerful features
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow border-2 hover:border-emerald-500/50">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Features */}
        <motion.div
          className="mt-20 grid md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Mobile-First</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Native iOS & Android apps with offline scoring support
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Real-Time Updates</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Live scores, push notifications, and instant updates
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Multi-Language</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Full Urdu + English support with RTL/LTR
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

