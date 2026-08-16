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
          light: "#2563EB",
          dark: "#172554",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#B45309",
        },
        night: {
          DEFAULT: "#0B1120",
          light: "#111A2E",
          card: "#0F172A",
          line: "#1E293B",
        },
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "Arial", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 24px rgba(37, 99, 235, 0.35), 0 8px 30px rgba(245, 158, 11, 0.15)",
        neonSm: "0 0 14px rgba(37, 99, 235, 0.3)",
        neumorphic:
          "8px 8px 16px rgba(4, 8, 20, 0.85), -8px -8px 16px rgba(30, 41, 59, 0.45)",
        neumorphicSm:
          "4px 4px 8px rgba(4, 8, 20, 0.75), -4px -4px 8px rgba(30, 41, 59, 0.4)",
        glowAccent: "0 0 20px rgba(245, 158, 11, 0.4)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(30, 64, 175, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 64, 175, 0.12) 1px, transparent 1px)",
        heroGlow:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(30, 64, 175, 0.35), transparent 70%)",
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
