"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type Language = "en" | "ur"

interface Translations {
  [key: string]: {
    en: string
    ur: string
  }
}

const translations: Translations = {
  createTournament: {
    en: "Create Tournament",
    ur: "ٹورنامنٹ بنائیں",
  },
  createTournamentDescription: {
    en: "Build the perfect cricket tournament in minutes",
    ur: "منٹوں میں بہترین کرکٹ ٹورنامنٹ بنائیں",
  },
  previous: {
    en: "Previous",
    ur: "پچھلا",
  },
  next: {
    en: "Next",
    ur: "اگلا",
  },
  step: {
    en: "Step",
    ur: "مرحلہ",
  },
  of: {
    en: "of",
    ur: "کا",
  },
  create: {
    en: "Create",
    ur: "بنائیں",
  },
  chooseFormat: {
    en: "Choose Tournament Format",
    ur: "ٹورنامنٹ کی شکل منتخب کریں",
  },
  formatDescription: {
    en: "Select how teams will compete",
    ur: "منتخب کریں کہ ٹیمیں کیسے مقابلہ کریں گی",
  },
  knockout: {
    en: "Knockout",
    ur: "ناک آؤٹ",
  },
  knockoutDesc: {
    en: "Single elimination bracket",
    ur: "ایک بار ہارنے پر باہر",
  },
  league: {
    en: "League",
    ur: "لیگ",
  },
  leagueDesc: {
    en: "Round robin, all teams play each other",
    ur: "تمام ٹیمیں ایک دوسرے سے کھیلیں",
  },
  hybrid: {
    en: "Group + Knockout",
    ur: "گروپ + ناک آؤٹ",
  },
  hybridDesc: {
    en: "Groups first, then knockout stages",
    ur: "پہلے گروپ، پھر ناک آؤٹ",
  },
  matchType: {
    en: "Match Type",
    ur: "میچ کی قسم",
  },
  selectMatchType: {
    en: "Select match format",
    ur: "میچ کی شکل منتخب کریں",
  },
  t20: {
    en: "T20",
    ur: "ٹی 20",
  },
  odi: {
    en: "ODI",
    ur: "او ڈی آئی",
  },
  tapeBall: {
    en: "Tape Ball",
    ur: "ٹیپ بال",
  },
  custom: {
    en: "Custom Overs",
    ur: "اپنی مرضی کے اوورز",
  },
  customOvers: {
    en: "Number of Overs",
    ur: "اوورز کی تعداد",
  },
  tournamentName: {
    en: "Tournament Name",
    ur: "ٹورنامنٹ کا نام",
  },
  description: {
    en: "Description",
    ur: "تفصیل",
  },
  startDate: {
    en: "Start Date",
    ur: "شروع کی تاریخ",
  },
  endDate: {
    en: "End Date",
    ur: "ختم کی تاریخ",
  },
  location: {
    en: "Location",
    ur: "مقام",
  },
  maxTeams: {
    en: "Maximum Teams",
    ur: "زیادہ سے زیادہ ٹیمیں",
  },
  registrationFee: {
    en: "Registration Fee (PKR)",
    ur: "رجسٹریشن فیس (روپے)",
  },
  prizePool: {
    en: "Prize Pool (PKR)",
    ur: "انعامی رقم (روپے)",
  },
  autoGenerate: {
    en: "Auto-generate Schedule",
    ur: "خودکار شیڈول بنائیں",
  },
  teamSeeding: {
    en: "Team Seeding",
    ur: "ٹیم کی ترتیب",
  },
  dragToReorder: {
    en: "Drag teams to reorder",
    ur: "ٹیموں کو دوبارہ ترتیب دینے کے لیے کھینچیں",
  },
  branding: {
    en: "Custom Branding",
    ur: "اپنی برانڈنگ",
  },
  uploadLogo: {
    en: "Upload Logo",
    ur: "لوگو اپ لوڈ کریں",
  },
  primaryColor: {
    en: "Primary Color",
    ur: "بنیادی رنگ",
  },
  copyFromPrevious: {
    en: "Copy from Previous Tournament",
    ur: "پچھلے ٹورنامنٹ سے کاپی کریں",
  },
  copiedFromPrevious: {
    en: "Settings copied from previous tournament!",
    ur: "ترتیبات پچھلے ٹورنامنٹ سے کاپی ہو گئیں!",
  },
  tournamentDetails: {
    en: "Tournament Details",
    ur: "ٹورنامنٹ کی تفصیلات",
  },
  tournamentDetailsDescription: {
    en: "Tell us about your tournament",
    ur: "اپنے ٹورنامنٹ کے بارے میں بتائیں",
  },
  registrationSettings: {
    en: "Registration Settings",
    ur: "رجسٹریشن کی ترتیبات",
  },
  registrationSettingsDescription: {
    en: "Configure team limits and fees",
    ur: "ٹیم کی حد اور فیس ترتیب دیں",
  },
  optional: {
    en: "Optional",
    ur: "اختیاری",
  },
  schedulePreview: {
    en: "Schedule Preview",
    ur: "شیڈول کا پیش منظر",
  },
  schedulePreviewDescription: {
    en: "Auto-generated schedule based on your settings",
    ur: "آپ کی ترتیبات کے مطابق خودکار طور پر بنایا گیا شیڈول",
  },
  totalMatches: {
    en: "Total Matches",
    ur: "کل میچ",
  },
  duration: {
    en: "Duration",
    ur: "دورانیہ",
  },
  matchesPerDay: {
    en: "Matches/Day",
    ur: "میچ/دن",
  },
  seedingNotRequired: {
    en: "Team seeding is not required for league format",
    ur: "لیگ کی شکل کے لیے ٹیم کی ترتیب کی ضرورت نہیں",
  },
  brandingDescription: {
    en: "Customize your tournament appearance",
    ur: "اپنے ٹورنامنٹ کی ظاہری شکل کو اپنی مرضی کے مطابق بنائیں",
  },
  tournamentCreated: {
    en: "Tournament Created!",
    ur: "ٹورنامنٹ بن گیا!",
  },
  tournamentCreatedDescription: {
    en: "Your tournament has been successfully created",
    ur: "آپ کا ٹورنامنٹ کامیابی سے بن گیا",
  },
  goToDashboard: {
    en: "Go to Dashboard",
    ur: "ڈیش بورڈ پر جائیں",
  },
  createAnother: {
    en: "Create Another",
    ur: "ایک اور بنائیں",
  },
}

interface LanguageContextType {
  language: Language
  toggleLanguage: () => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ur" : "en"))
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}

