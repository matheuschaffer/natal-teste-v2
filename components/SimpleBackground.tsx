"use client"

import { ThemeType } from "./ThemeSystem"

interface SimpleBackgroundProps {
  theme: ThemeType | null
}

export function SimpleBackground({ theme }: SimpleBackgroundProps) {
  const getBackgroundClass = () => {
    switch (theme) {
      case "classic":
        return "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500 via-red-600 to-red-900"
      case "winter":
        return "bg-gradient-to-b from-slate-50 to-slate-100"
      default:
        return "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500 via-red-600 to-red-900"
    }
  }

  return (
    <div className={`fixed inset-0 ${getBackgroundClass()} -z-10 transition-colors duration-500`}>
      {/* Textura de ruído sutil */}
      {theme === "classic" && (
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  )
}
