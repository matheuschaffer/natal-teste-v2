"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export type ThemeType = "snowy-night" | "golden-glow" | "northern-lights"

interface ChristmasBackgroundProps {
  theme: ThemeType
}

export function ChristmasBackground({ theme }: ChristmasBackgroundProps) {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([])
  const [bokehLights, setBokehLights] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])

  useEffect(() => {
    if (theme === "snowy-night") {
      const flakes = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
      }))
      setSnowflakes(flakes)
    }

    if (theme === "golden-glow") {
      const lights = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 20 + Math.random() * 40,
        delay: Math.random() * 3,
      }))
      setBokehLights(lights)
    }
  }, [theme])

  const getBackgroundClasses = () => {
    switch (theme) {
      case "snowy-night":
        return "bg-gradient-to-b from-[#0f172a] via-slate-800 to-[#1e1b4b]"
      case "golden-glow":
        return "bg-gradient-to-b from-[#7f1d1d] via-red-900 to-rose-950"
      case "northern-lights":
        return "bg-gradient-to-b from-purple-950 via-indigo-950 to-emerald-950"
      default:
        return "bg-gradient-to-b from-[#0f172a] via-slate-800 to-[#1e1b4b]"
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
      {/* Snowy Night - Neve caindo */}
      {theme === "snowy-night" && (
        <div className="absolute inset-0 overflow-hidden">
          {snowflakes.map((flake) => (
            <motion.div
              key={flake.id}
              className="absolute text-white/60 text-xl"
              style={{
                left: `${flake.x}%`,
                top: "-10%",
              }}
              animate={{
                y: "110vh",
                x: [0, Math.random() * 30 - 15, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: flake.duration,
                repeat: Infinity,
                delay: flake.delay,
                ease: "linear",
              }}
            >
              ❄
            </motion.div>
          ))}
        </div>
      )}

      {/* Golden Glow - Luzes douradas piscando */}
      {theme === "golden-glow" && (
        <div className="absolute inset-0">
          {bokehLights.map((light) => (
            <motion.div
              key={light.id}
              className="absolute rounded-full bg-gradient-radial from-yellow-400/40 via-amber-300/20 to-transparent blur-xl"
              style={{
                left: `${light.x}%`,
                top: `${light.y}%`,
                width: `${light.size}px`,
                height: `${light.size}px`,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: light.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Northern Lights - Efeito aurora */}
      {theme === "northern-lights" && (
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-emerald-500/30 via-transparent to-transparent blur-3xl"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              x: [-100, 100, -100],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/4 left-0 right-0 h-1/3 bg-gradient-to-b from-purple-500/30 via-transparent to-transparent blur-3xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              x: [100, -100, 100],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Overlay sutil */}
      <div className="absolute inset-0 bg-black/20" />
    </motion.div>
  )
}

