"use client"

import { useCallback } from "react"
import confetti from "canvas-confetti"

export type CelebrationType = "spray" | "burst" | "grand-finale"

export function useCelebration() {
  const celebrate = useCallback((type: CelebrationType) => {
    const duration = 3000
    const end = Date.now() + duration

    switch (type) {
      case "spray":
        // Confetes laterais leves
        const sprayInterval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(sprayInterval)
            return
          }

          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D"],
          })
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D"],
          })
        }, 100)
        break

      case "burst":
        // Explosão central
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3"],
        })
        break

      case "grand-finale":
        // Celebração leve e rápida (1.5 segundos)
        const finaleDuration = 1500 // 1.5 segundos
        const finaleEnd = Date.now() + finaleDuration
        const finaleInterval = setInterval(() => {
          if (Date.now() > finaleEnd) {
            clearInterval(finaleInterval)
            return
          }

          confetti({
            particleCount: 50,
            angle: 60,
            spread: 70,
            origin: { x: 0 },
            gravity: 1.2,
            colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D"],
          })
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 70,
            origin: { x: 1 },
            gravity: 1.2,
            colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D"],
          })
        }, 100)
        break
    }
  }, [])

  const grandFinale = useCallback(() => {
    celebrate("grand-finale")
  }, [celebrate])

  return { celebrate, grandFinale }
}

