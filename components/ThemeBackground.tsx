"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export type ThemeType = "noite-magica" | "manha-natal" | "lareira-aconchegante"

interface ThemeBackgroundProps {
  theme: ThemeType
}

export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([])

  useEffect(() => {
    if (theme === "noite-magica") {
      // Gerar estrelas para o tema Noite Mágica
      const newStars = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() * 3 + 1,
      }))
      setStars(newStars)
    }
  }, [theme])

  const getBackgroundClasses = () => {
    switch (theme) {
      case "noite-magica":
        return "bg-gradient-radial from-blue-900 via-purple-900 to-indigo-950"
      case "manha-natal":
        return "bg-gradient-to-b from-sky-300 via-blue-100 to-slate-50"
      case "lareira-aconchegante":
        return "bg-gradient-radial from-red-950 via-amber-900 to-orange-950"
      default:
        return "bg-gradient-to-b from-sky-300 via-blue-100 to-slate-50"
    }
  }

  const getTextColor = () => {
    switch (theme) {
      case "noite-magica":
      case "lareira-aconchegante":
        return "text-white"
      case "manha-natal":
        return "text-slate-900"
      default:
        return "text-slate-900"
    }
  }

  return (
    <motion.div
      key={theme}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className={`fixed inset-0 ${getBackgroundClasses()} -z-10 overflow-hidden`}
    >
      {/* Noite Mágica - Estrelas */}
      {theme === "noite-magica" && (
        <div className="absolute inset-0">
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Manhã de Natal - Neve */}
      {theme === "manha-natal" && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/40 text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10%",
              }}
              animate={{
                y: "110vh",
                x: [0, Math.random() * 50 - 25, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear",
              }}
            >
              ❄
            </motion.div>
          ))}
        </div>
      )}

      {/* Lareira Aconchegante - Brilho pulsante */}
      {theme === "lareira-aconchegante" && (
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Overlay sutil para melhor contraste */}
      <div className="absolute inset-0 bg-black/10" />
    </motion.div>
  )
}

