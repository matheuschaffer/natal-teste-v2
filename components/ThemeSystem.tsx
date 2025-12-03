"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ConfirmButton } from "@/components/ui/confirm-button"
import { useCelebration } from "@/hooks/useCelebration"
import { elfAssistant } from "@/lib/elfAssistant"

export type ThemeType = "classic" | "winter"

interface ThemeSystemProps {
  theme: ThemeType | null
  onThemeChange: (theme: ThemeType) => void
  onConfirm?: () => void
  onReset?: () => void
  themeConfirmed?: boolean
}

const themes: Array<{
  id: ThemeType
  name: string
  description: string
  bgClass: string
  textClass: string
}> = [
  {
    id: "classic",
    name: "Natal Clássico",
    description: "Vermelho vibrante e elegante",
    bgClass: "bg-gradient-to-b from-red-600 via-red-500 to-red-700",
    textClass: "text-white",
  },
  {
    id: "winter",
    name: "Inverno Suave",
    description: "Branco suave e acolhedor",
    bgClass: "bg-gradient-to-b from-slate-50 to-slate-100",
    textClass: "text-slate-800",
  },
]

export function ThemeSystem({ theme, onThemeChange, onConfirm, onReset, themeConfirmed = false }: ThemeSystemProps) {
  const [tempSelection, setTempSelection] = useState<ThemeType | null>(theme)
  const { celebrate } = useCelebration()
  const elf = elfAssistant()

  // Sincronizar tempSelection quando theme mudar externamente
  useEffect(() => {
    setTempSelection(theme)
  }, [theme])

  const handleThemeSelect = (newTheme: ThemeType) => {
    // Aplicar mudança visual IMEDIATAMENTE
    onThemeChange(newTheme)
    setTempSelection(newTheme)
    // Resetar confirmação ao mudar seleção
    if (themeConfirmed) {
      onReset?.()
    }
  }

  const handleConfirm = () => {
    // Apenas validar o passo (a escolha já foi aplicada)
    if (tempSelection) {
      celebrate("spray")
      elf.celebrateTheme(tempSelection)
      onConfirm?.()
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {themes.map((themeOption) => (
          <motion.button
            key={themeOption.id}
            onClick={() => handleThemeSelect(themeOption.id)}
            className={`
              relative rounded-xl p-6 border-2 transition-all duration-300
              ${themeOption.bgClass}
              ${tempSelection === themeOption.id
                ? "border-amber-500 shadow-xl scale-105 ring-4 ring-amber-200"
                : "border-amber-200 hover:border-amber-300 hover:shadow-lg"
              }
            `}
            whileHover={{ scale: tempSelection === themeOption.id ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`${themeOption.textClass} text-center`}>
              <h3 className="font-bold text-lg mb-1">{themeOption.name}</h3>
              <p className="text-sm opacity-80">{themeOption.description}</p>
            </div>
            {tempSelection === themeOption.id && (
              <motion.div
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      
      <ConfirmButton
        onClick={handleConfirm}
        disabled={!tempSelection}
        confirmed={themeConfirmed}
        confirmedText="Tema Confirmado!"
      >
        Confirmar Escolha
      </ConfirmButton>
    </div>
  )
}

