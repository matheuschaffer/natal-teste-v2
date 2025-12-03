"use client"

import { toast } from "sonner"
import { FontType } from "@/components/FontSelector"
import { ThemeType } from "@/components/ThemeSystem"

export function elfAssistant() {
  const celebrateFont = (font: FontType) => {
    const messages: Record<FontType, string> = {
      signature: "Uau, essa letra é super elegante! Parece uma carta do Papai Noel! ✒️🎄",
      luxury: "Ótima escolha, bem clássica e sofisticada! 👑✨",
      modern: "Moderno e limpo, perfeito para uma homenagem contemporânea! 🚀",
      magic: "Que mágico! Essa fonte tem toda a personalidade do Natal! 🎅🎁",
    }
    toast.success(messages[font], {
      duration: 3000,
      icon: "🎄",
    })
  }

  const celebrateTheme = (theme: ThemeType) => {
    if (theme === "winter") {
      toast.success("Brrr! O clima ficou gelado e lindo! ❄️✨", {
        duration: 3000,
        icon: "❄️",
      })
    } else {
      toast.success("Hmm, quentinho como chocolate quente! ☕❤️", {
        duration: 3000,
        icon: "🔥",
      })
    }
  }

  const celebrateMessage = () => {
    toast.success("Caprichei nessa! O que achou? 🤖✨", {
      duration: 4000,
      icon: "✨",
    })
  }

  const celebratePhotos = (count: number) => {
    if (count === 1) {
      toast.success("Que família linda você tem! 📸❤️", {
        duration: 3000,
        icon: "📸",
      })
    } else if (count > 1) {
      toast.success(`Que lindas essas ${count} fotos! Cada uma conta uma história! 📸❤️`, {
        duration: 3000,
        icon: "📸",
      })
    }
  }

  const celebrateTitle = () => {
    toast.success("Título perfeito! Vai ficar lindo! ✨📝", {
      duration: 3000,
      icon: "✨",
    })
  }

  const celebrateAudio = () => {
    toast.success("Sua voz vai emocionar todo mundo. Ficou perfeito! 🎤🎉", {
      duration: 4000,
      icon: "🎤",
    })
  }

  const celebrateCompletion = () => {
    toast.success("🎉 INCRÍVEL! Você completou tudo! Agora é só finalizar e surpreender! 🎁✨", {
      duration: 5000,
      icon: "🎉",
    })
  }

  return {
    celebrateFont,
    celebrateTheme,
    celebrateMessage,
    celebratePhotos,
    celebrateTitle,
    celebrateAudio,
    celebrateCompletion,
  }
}

