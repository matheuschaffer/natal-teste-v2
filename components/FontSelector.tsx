"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ConfirmButton } from "@/components/ui/confirm-button"
import { useCelebration } from "@/hooks/useCelebration"
import { elfAssistant } from "@/lib/elfAssistant"

export type FontType = "signature" | "luxury" | "modern" | "magic"

interface FontSelectorProps {
  selectedFont: FontType | null
  onFontChange: (font: FontType) => void
  onConfirm?: () => void
  onReset?: () => void
  fontConfirmed?: boolean
}

const fonts: Array<{
  id: FontType
  name: string
  subtitle: string
  className: string
  variable: string
}> = [
  {
    id: "signature",
    name: "Assinatura de Natal",
    subtitle: "Clássico",
    className: "font-great-vibes",
    variable: "var(--font-great-vibes)",
  },
  {
    id: "luxury",
    name: "Luxo Elegante",
    subtitle: "Tradicional",
    className: "font-playfair",
    variable: "var(--font-playfair)",
  },
  {
    id: "modern",
    name: "Moderno & Limpo",
    subtitle: "Minimalista",
    className: "font-outfit",
    variable: "var(--font-outfit)",
  },
  {
    id: "magic",
    name: "Magia de Natal",
    subtitle: "Divertido",
    className: "font-mountains-christmas",
    variable: "var(--font-mountains-christmas)",
  },
]

export function FontSelector({ selectedFont, onFontChange, onConfirm, onReset, fontConfirmed = false }: FontSelectorProps) {
  const [tempSelection, setTempSelection] = useState<FontType | null>(selectedFont)
  const { celebrate } = useCelebration()
  const elf = elfAssistant()

  // Sincronizar tempSelection quando selectedFont mudar externamente
  useEffect(() => {
    setTempSelection(selectedFont)
  }, [selectedFont])

  const handleFontSelect = (font: FontType) => {
    // Aplicar mudança visual IMEDIATAMENTE
    onFontChange(font)
    setTempSelection(font)
    // Resetar confirmação ao mudar seleção
    if (fontConfirmed) {
      onReset?.()
    }
  }

  const handleConfirm = () => {
    // Apenas validar o passo (a escolha já foi aplicada)
    if (tempSelection) {
      celebrate("spray")
      elf.celebrateFont(tempSelection)
      onConfirm?.()
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fonts.map((font) => (
          <motion.button
            key={font.id}
            onClick={() => handleFontSelect(font.id)}
            className={`
              relative rounded-xl p-6 border-2 transition-all duration-300
              bg-white text-left
              ${tempSelection === font.id
                ? "border-amber-500 shadow-lg scale-105 ring-2 ring-amber-200"
                : "border-amber-200 hover:border-amber-300 hover:shadow-md"
              }
            `}
            whileHover={{ scale: tempSelection === font.id ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-2">
              <p
                className={`text-3xl md:text-4xl font-semibold text-slate-800 ${font.className}`}
                style={{ fontFamily: font.variable }}
              >
                {font.name}
              </p>
              <p className="text-xs text-slate-500 font-sans">
                {font.subtitle}
              </p>
            </div>
            {tempSelection === font.id && (
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
        confirmed={fontConfirmed}
        confirmedText="Fonte Confirmada!"
      >
        Confirmar Escolha
      </ConfirmButton>
    </div>
  )
}
