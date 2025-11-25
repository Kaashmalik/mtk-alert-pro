import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Translations
const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      matches: "Matches",
      live: "Live",
      upcoming: "Upcoming",
      completed: "Completed",
      players: "Players",
      profile: "Profile",
      settings: "Settings",
      
      // Match
      match: "Match",
      liveScore: "Live Score",
      scorecard: "Scorecard",
      commentary: "Commentary",
      "match.start": "Match Started",
      "match.wicket": "Wicket!",
      "match.over": "Over",
      "match.runs": "Runs",
      "match.wickets": "Wickets",
      "match.overs": "Overs",
      "match.required": "Required",
      "match.target": "Target",
      "match.currentRunRate": "Current RR",
      "match.requiredRunRate": "Required RR",
      
      // Player
      "player.profile": "Player Profile",
      "player.stats": "Statistics",
      "player.matches": "Matches",
      "player.runs": "Runs",
      "player.wickets": "Wickets",
      "player.average": "Average",
      "player.strikeRate": "Strike Rate",
      "player.economy": "Economy",
      
      // Common
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      offline: "Offline",
      online: "Online",
      sync: "Sync",
      "sync.pending": "Syncing pending data...",
      "sync.complete": "Sync complete",
      
      // Notifications
      "notification.wicket": "Wicket! {{batsman}} out",
      "notification.matchStart": "Match started: {{team1}} vs {{team2}}",
      "notification.matchUpdate": "{{team}} is now {{score}}",
      
      // Settings
      "settings.language": "Language",
      "settings.notifications": "Notifications",
      "settings.offlineMode": "Offline Mode",
      "settings.about": "About",
    },
  },
  ur: {
    translation: {
      // Navigation
      home: "ہوم",
      matches: "میچز",
      live: "لائیو",
      upcoming: "آنے والے",
      completed: "مکمل",
      players: "کھلاڑی",
      profile: "پروفائل",
      settings: "ترتیبات",
      
      // Match
      match: "میچ",
      liveScore: "لائیو اسکور",
      scorecard: "اسکور کارڈ",
      commentary: "کمنٹری",
      "match.start": "میچ شروع",
      "match.wicket": "وکٹ!",
      "match.over": "اوور",
      "match.runs": "رنز",
      "match.wickets": "وکٹیں",
      "match.overs": "اوورز",
      "match.required": "درکار",
      "match.target": "ہدف",
      "match.currentRunRate": "موجودہ رن ریٹ",
      "match.requiredRunRate": "درکار رن ریٹ",
      
      // Player
      "player.profile": "کھلاڑی پروفائل",
      "player.stats": "شماریات",
      "player.matches": "میچز",
      "player.runs": "رنز",
      "player.wickets": "وکٹیں",
      "player.average": "اوسط",
      "player.strikeRate": "سٹرائیک ریٹ",
      "player.economy": "اکانومی",
      
      // Common
      loading: "لوڈ ہو رہا ہے...",
      error: "خرابی",
      retry: "دوبارہ کوشش",
      offline: "آف لائن",
      online: "آن لائن",
      sync: "سینک",
      "sync.pending": "پینڈنگ ڈیٹا سینک ہو رہا ہے...",
      "sync.complete": "سینک مکمل",
      
      // Notifications
      "notification.wicket": "وکٹ! {{batsman}} آؤٹ",
      "notification.matchStart": "میچ شروع: {{team1}} بمقابلہ {{team2}}",
      "notification.matchUpdate": "{{team}} اب {{score}} پر ہے",
      
      // Settings
      "settings.language": "زبان",
      "settings.notifications": "اطلاعات",
      "settings.offlineMode": "آف لائن موڈ",
      "settings.about": "کے بارے میں",
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v3",
  });

// Load saved language preference
AsyncStorage.getItem("language").then((lang) => {
  if (lang && (lang === "en" || lang === "ur")) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;

