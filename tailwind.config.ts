import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "flex", "flex-col", "flex-row", "items-center", "justify-center", "justify-between",
    "grid", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4",
    "gap-4", "gap-6", "gap-8", "gap-12",
    "p-4", "p-6", "p-8", "p-12", "px-4", "px-6", "px-8", "py-4", "py-6", "py-8", "py-12", "py-24",
    "mt-4", "mt-6", "mt-8", "mb-4", "mb-6", "mb-8",
    "mx-auto", "max-w-7xl", "max-w-4xl", "max-w-2xl", "max-w-xl",
    "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl",
    "font-bold", "font-semibold", "font-medium", "font-light",
    "text-white", "text-white/60", "text-white/40", "text-white/80",
    "text-violet-400", "text-violet-500", "text-cyan-400", "text-cyan-500",
    "text-center", "text-left", "leading-tight", "tracking-tight",
    "bg-black", "bg-white", "bg-white/5", "bg-white/10", "bg-violet-500", "bg-violet-600", "bg-cyan-500",
    "bg-violet-500/10", "bg-violet-500/20", "bg-cyan-500/10",
    "border", "border-white/10", "border-white/20", "border-violet-500/30",
    "rounded", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-full",
    "opacity-0", "opacity-100", "transition", "duration-300", "ease-in-out",
    "hover:bg-violet-600", "hover:bg-white/10", "hover:text-white", "hover:border-violet-500/50",
    "cursor-pointer", "select-none", "overflow-hidden", "relative", "absolute", "inset-0", "z-10", "z-50",
    "w-full", "h-full", "w-screen", "h-screen", "min-h-screen",
    "w-4", "h-4", "w-6", "h-6", "w-8", "h-8", "w-12", "h-12",
    "md:grid-cols-2", "md:grid-cols-3", "md:text-5xl", "md:text-6xl", "md:flex-row",
    "lg:grid-cols-4", "lg:text-7xl",
    "glass", "gradient-text", "glow-violet", "glow-cyan",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
