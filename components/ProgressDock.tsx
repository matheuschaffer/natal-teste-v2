"use client"

import { motion } from "framer-motion"

interface StepStatus {
  step: number
  completed: boolean
  current: boolean
}

interface ProgressDockProps {
  steps: StepStatus[]
  onFinalize: () => void
  theme: "classic" | "winter" | null
}

export function ProgressDock({ steps, onFinalize, theme }: ProgressDockProps) {
  const allCompleted = steps.every((s) => s.completed)
  const currentStep = steps.find((s) => s.current)?.step || 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-4 left-4 right-4 z-50 ${
        theme === "winter" ? "bg-white/90" : "bg-black/20"
      } backdrop-blur-md border border-white/20 rounded-full px-4 py-3 shadow-2xl`}
    >
          <div className="flex items-center justify-between px-2">
            {steps.map((stepStatus, index) => {
              const isCompleted = stepStatus.completed
              const isCurrent = stepStatus.current
              const stepNumber = stepStatus.step
              const nextStep = steps[index + 1]
              const isNextCompleted = nextStep?.completed

              return (
                <div key={stepNumber} className="flex items-center flex-1">
                  <motion.div
                    className="relative flex items-center justify-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Círculo do passo */}
                    <div
                      className={`
                        relative w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-300 z-10
                        ${
                          isCompleted
                            ? "bg-emerald-500 text-white shadow-lg scale-110"
                            : isCurrent
                            ? `${
                                theme === "winter"
                                  ? "bg-red-500 text-white"
                                  : "bg-white text-slate-800"
                              } shadow-md scale-105`
                            : "bg-transparent border-2 border-white/40 text-white/60"
                        }
                      `}
                    >
                      <span className="text-sm font-bold">{stepNumber}</span>
                    </div>
                  </motion.div>

                  {/* Linha conectora (exceto no último) */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 relative">
                      <div className="absolute inset-0 bg-white/20" />
                      {isCompleted && (
                        <motion.div
                          className="absolute inset-0 bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
  )
}

