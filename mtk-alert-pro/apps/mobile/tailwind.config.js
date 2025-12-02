/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#EF4444",
          blue: "#2563EB",
          green: "#10B981",
          navy: "#1E293B",
          orange: "#F59E0B",
          cyan: "#06B6D4",
          purple: "#8B5CF6",
        },
      },
    },
  },
  plugins: [],
};
