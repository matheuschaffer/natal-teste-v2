"use client"

import { useEffect, useState } from "react"

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const christmas = new Date(new Date().getFullYear(), 11, 25, 0, 0, 0).getTime()
      const difference = christmas - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden sm:inline opacity-80">Faltam</span>
      <div className="flex items-center gap-1">
        <span className="font-bold">{timeLeft.days}</span>
        <span className="text-xs opacity-70">d</span>
      </div>
      <span className="opacity-50">:</span>
      <div className="flex items-center gap-1">
        <span className="font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-xs opacity-70">h</span>
      </div>
      <span className="opacity-50">:</span>
      <div className="flex items-center gap-1">
        <span className="font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-xs opacity-70">m</span>
      </div>
    </div>
  )
}
