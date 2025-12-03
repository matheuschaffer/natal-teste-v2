"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { ReactNode } from "react"

interface ConfirmButtonProps {
  onClick: () => void
  disabled?: boolean
  confirmed?: boolean
  children: ReactNode
  confirmedText?: string
  className?: string
}

export function ConfirmButton({
  onClick,
  disabled = false,
  confirmed = false,
  children,
  confirmedText = "Confirmado!",
  className = "",
}: ConfirmButtonProps) {
  return (
    <motion.div
      whileHover={!disabled && !confirmed ? { scale: 1.02 } : {}}
      whileTap={!disabled && !confirmed ? { scale: 0.98 } : {}}
      className={className}
    >
      <Button
        onClick={onClick}
        disabled={disabled || confirmed}
        className={`
          w-full font-medium py-6 text-lg rounded-xl
          transition-all duration-500
          ${
            confirmed
              ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/20 opacity-100 cursor-default"
              : "bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          }
        `}
      >
        {confirmed ? (
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 15 }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
            <span>{confirmedText}</span>
          </motion.div>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  )
}

