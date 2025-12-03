"use client"

import { useState, useEffect } from "react"

interface Snowflake {
  id: number
  left: number
  animationDuration: number
  animationDelay: number
  size: number
}

export function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (!enabled) return

    const flakes: Snowflake[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 10 + Math.random() * 10,
      animationDelay: Math.random() * 5,
      size: 2 + Math.random() * 3,
    }))

    setSnowflakes(flakes)
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute top-0 text-white opacity-30"
            style={{
              left: `${flake.left}%`,
              fontSize: `${flake.size}px`,
              animation: `snow ${flake.animationDuration}s linear infinite`,
              animationDelay: `${flake.animationDelay}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className="fixed bottom-20 right-4 z-50 bg-white/80 hover:bg-white text-gray-700 px-3 py-1.5 rounded-full text-xs shadow-md transition-colors sm:bottom-24"
        aria-label={enabled ? "Desativar neve" : "Ativar neve"}
      >
        {enabled ? "❄️" : "🌤️"}
      </button>
    </>
  )
}

