"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function ChristmasDecorations() {
  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden z-0">
      {/* Flocos de neve decorativos no topo */}
      <div className="flex justify-center items-start pt-4 gap-8 md:gap-16">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="text-white/30 text-2xl md:text-3xl"
            animate={{
              y: [0, 10, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          >
            ❄
          </motion.div>
        ))}
      </div>

      {/* Estrelas decorativas */}
      <div className="absolute top-8 left-8 md:left-16">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-amber-400/40" />
        </motion.div>
      </div>

      <div className="absolute top-8 right-8 md:right-16">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-amber-400/40" />
        </motion.div>
      </div>
    </div>
  )
}

