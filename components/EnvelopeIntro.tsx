"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Sparkles } from "lucide-react"
import { ThemeType } from "./ThemeSystem"
import { SimpleBackground } from "./SimpleBackground"

interface EnvelopeIntroProps {
  theme: ThemeType | null
  onOpen: () => void
}

export function EnvelopeIntro({ theme, onOpen }: EnvelopeIntroProps) {
  const [isOpening, setIsOpening] = useState(false)

  const currentTheme = theme || "classic"
  const isDarkTheme = currentTheme === "classic"

  const handleEnvelopeClick = () => {
    setIsOpening(true)
    // Aguardar animação de saída antes de chamar onOpen
    setTimeout(() => {
      onOpen()
    }, 800)
  }

  return (
    <AnimatePresence>
      {!isOpening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Background com tema (mais escuro) */}
          <div className="absolute inset-0">
            <SimpleBackground theme={theme} />
            <div
              className={`absolute inset-0 ${
                currentTheme === "classic"
                  ? "bg-gradient-to-b from-red-950/90 via-red-900/80 to-red-950/90"
                  : "bg-gradient-to-b from-slate-900/80 via-slate-800/70 to-slate-900/80"
              }`}
            />
          </div>

          {/* Conteúdo Central */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <div className="text-center space-y-8 max-w-2xl mx-auto">
              {/* Texto acima do envelope */}
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-xl md:text-2xl lg:text-3xl font-playfair italic text-white/90"
              >
                Alguém deixou uma mensagem especial pra você...
              </motion.p>

              {/* Envelope Gigante com Animação de Pulsação */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  onClick={handleEnvelopeClick}
                  className="cursor-pointer group"
                >
                  <div className="relative">
                    {/* Glow Effect */}
                    <motion.div
                      className="absolute inset-0 blur-3xl bg-amber-400/30 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Envelope */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      <Mail className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 text-amber-400 drop-shadow-2xl" />
                      
                      {/* Brilho no envelope */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Sparkles className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 text-amber-300/50" />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Texto abaixo do envelope */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="text-base md:text-lg lg:text-xl text-white/70 font-light"
              >
                Toque no envelope para abrir.
              </motion.p>

              {/* Indicador de toque (opcional) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-white/50"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Animação de abertura do envelope (quando clicado) */}
          <AnimatePresence>
            {isOpening && (
              <motion.div
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: 1.5, rotate: 15 }}
                exit={{ opacity: 0, scale: 2, rotate: 45 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center z-20"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 300 }}
                >
                  <Mail className="w-48 h-48 md:w-64 md:h-64 text-amber-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

