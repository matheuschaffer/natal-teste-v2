"use client"

import { motion } from "framer-motion"
import { Snowflake, Flame, Sparkles } from "lucide-react"
import { ThemeType } from "./ChristmasBackground"

interface ThemeSelectorProps {
  currentTheme: ThemeType
  onThemeChange: (theme: ThemeType) => void
}

const themes: Array<{
  id: ThemeType
  name: string
  icon: React.ReactNode
  gradient: string
  preview: string
}> = [
  {
    id: "snowy-night",
    name: "Noite Nevada",
    icon: <Snowflake />,
    gradient: "from-[#0f172a] via-slate-800 to-[#1e1b4b]",
    preview: "bg-gradient-to-br from-[#0f172a] via-slate-800 to-[#1e1b4b]",
  },
  {
    id: "golden-glow",
    name: "Brilho Dourado",
    icon: <Flame />,
    gradient: "from-[#7f1d1d] via-red-900 to-rose-950",
    preview: "bg-gradient-to-br from-[#7f1d1d] via-red-900 to-rose-950",
  },
  {
    id: "northern-lights",
    name: "Aurora Boreal",
    icon: <Sparkles />,
    gradient: "from-purple-950 via-indigo-950 to-emerald-950",
    preview: "bg-gradient-to-br from-purple-950 via-indigo-950 to-emerald-950",
  },
]

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`
            relative transition-all duration-300
            ${currentTheme === theme.id
              ? "scale-110"
              : "hover:scale-105"
            }
          `}
          whileHover={{ scale: currentTheme === theme.id ? 1.1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Círculo grande com preview do tema */}
          <div className={`
            ${theme.preview} 
            rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32
            flex items-center justify-center text-white shadow-2xl
            border-4 transition-all duration-300
            ${currentTheme === theme.id
              ? "border-amber-400 shadow-amber-400/30"
              : "border-amber-200/30"
            }
          `}>
            <div className="text-3xl sm:text-4xl md:text-5xl">
              {theme.icon}
            </div>
          </div>

          {/* Nome do tema */}
          <p className={`
            text-slate-800 font-semibold text-center mt-3 text-sm sm:text-base
            ${currentTheme === theme.id ? "text-amber-600" : "text-slate-600"}
          `}>
            {theme.name}
          </p>

          {/* Anel de destaque brilhante quando selecionado */}
          {currentTheme === theme.id && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-amber-400"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  top: '-8px',
                  left: '-8px',
                  right: '-8px',
                  bottom: '-8px',
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  top: '-12px',
                  left: '-12px',
                  right: '-12px',
                  bottom: '-12px',
                }}
              />
            </>
          )}
        </motion.button>
      ))}
    </div>
  )
}
