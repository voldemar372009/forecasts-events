import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E40AF",
          light: "#3B82F6",
          dark: "#172554",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#B45309",
        },
        night: {
          DEFAULT: "#070809",
          light: "#0D1014",
          card: "#0B0E12",
          line: "#1F242B",
        },
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "Arial", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 28px rgba(245, 158, 11, 0.25), 0 10px 40px rgba(245, 158, 11, 0.12)",
        neonSm: "0 0 16px rgba(245, 158, 11, 0.22)",
        neumorphic:
          "6px 6px 14px rgba(0, 0, 0, 0.7), -6px -6px 14px rgba(30, 36, 44, 0.35)",
        neumorphicSm:
          "3px 3px 7px rgba(0, 0, 0, 0.65), -3px -3px 7px rgba(30, 36, 44, 0.3)",
        glowAccent: "0 0 22px rgba(245, 158, 11, 0.45)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(245, 158, 11, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.05) 1px, transparent 1px)",
        heroGlow:
          "radial-gradient(ellipse 70% 55% at 50% -10%, rgba(245, 158, 11, 0.16), transparent 70%), radial-gradient(ellipse 45% 40% at 85% 10%, rgba(30, 64, 175, 0.22), transparent 70%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
