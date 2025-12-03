"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { FontType } from "./FontSelector"

interface StepCardProps {
  stepNumber: number
  title: string
  subtitle?: string
  children: ReactNode
  selectedFont?: FontType | null
  theme?: "classic" | "winter" | null
}

const fontClasses: Record<FontType, string> = {
  signature: "font-great-vibes",
  luxury: "font-playfair",
  modern: "font-outfit",
  magic: "font-mountains-christmas",
}

export function StepCard({ stepNumber, title, subtitle, children, selectedFont = "signature", theme = "classic" }: StepCardProps) {
  const fontClass = selectedFont ? fontClasses[selectedFont] : fontClasses.signature
  const borderColor = theme === "winter" ? "border-red-300" : "border-amber-200/50"
  const cardShadow = theme === "winter" ? "shadow-2xl" : "shadow-xl"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={`bg-white/95 backdrop-blur-sm border ${borderColor} rounded-2xl p-8 md:p-10 ${cardShadow} relative`}
    >
      {/* Badge centralizado no topo */}
      <div className="text-center mb-6">
        <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 font-semibold rounded-full text-sm md:text-base">
          PASSO {stepNumber}
        </span>
      </div>

      {/* Conteúdo centralizado */}
      <div className="space-y-6 text-center">
        <div>
          <h3 className={`${fontClass} text-3xl md:text-4xl text-slate-800 mb-2`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-slate-600 text-sm md:text-base">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-slate-800">
          {children}
        </div>
      </div>
    </motion.div>
  )
}
