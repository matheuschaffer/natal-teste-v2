"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function WarmChristmasBackground() {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([])

  useEffect(() => {
    // Flocos de neve sutis
    const flakes = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
    }))
    setSnowflakes(flakes)
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-red-700 via-red-600 to-red-800 -z-10 overflow-hidden">
      {/* Flocos de neve sutis */}
      <div className="absolute inset-0 overflow-hidden">
        {snowflakes.map((flake) => (
          <motion.div
            key={flake.id}
            className="absolute text-white/20 text-2xl"
            style={{
              left: `${flake.x}%`,
              top: "-10%",
            }}
            animate={{
              y: "110vh",
              x: [0, Math.random() * 20 - 10, 0],
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

      {/* Overlay sutil para profundidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
    </div>
  )
}

