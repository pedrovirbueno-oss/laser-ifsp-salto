import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#090D16',
        },
        nexo: {
          blue: '#0284C7',
          cyan: '#06B6D4',
          accent: '#2563EB',
          dark: '#0B132B',
          panel: '#1C2541',
        },
        status: {
          producing: '#10B981', // 🟢
          stopped: '#F59E0B',   // 🟡
          setup: '#3B82F6',     // 🔵
          maintenance: '#EF4444',// 🔴
          inactive: '#6B7280',  // ⚪
        }
      },
    },
  },
  plugins: [],
};
export default config;
