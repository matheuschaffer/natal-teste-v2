"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Heart, Sparkles, BookOpen, Undo2, Edit, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeType } from "./ThemeSystem"
import { useCelebration } from "@/hooks/useCelebration"
import { elfAssistant } from "@/lib/elfAssistant"
import { toast } from "sonner"

// Mapeamento dos tipos de mensagem para a API
const MESSAGE_TYPE_MAP = {
  emocionante: "emotional",
  engraçada: "funny",
  poetica: "poetic",
} as const

interface MessageGeneratorProps {
  theme: ThemeType | null
  onMessageChange?: (message: string) => void
  onConfirm?: () => void
}

export function MessageGenerator({ theme, onMessageChange, onConfirm }: MessageGeneratorProps) {
  const [message, setMessage] = useState("")
  const [editingText, setEditingText] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previousMessage, setPreviousMessage] = useState("")
  const { celebrate } = useCelebration()
  const elf = elfAssistant()

  // Auto-confirmar quando houver mensagem
  useEffect(() => {
    if (message.trim().length > 0) {
      onConfirm?.()
    }
  }, [message, onConfirm])

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage)
    onMessageChange?.(newMessage)
  }

  const generateMessage = async (type: keyof typeof MESSAGE_TYPE_MAP) => {
    setIsLoading(true)
    setPreviousMessage(message)
    
    try {
      // Chamada real para a API
      const response = await fetch("/api/generate-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptType: MESSAGE_TYPE_MAP[type],
          userContext: "", // Pode ser expandido no futuro para incluir contexto do usuário
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || "Erro ao gerar mensagem")
      }

      const data = await response.json()
      const newMessage = data.message

      if (!newMessage) {
        throw new Error("Mensagem vazia retornada pela API")
      }

      setMessage(newMessage)
      onMessageChange?.(newMessage)
      setIsEditing(false) // Sair do modo de edição se estiver
      
      // Celebração quando a IA gera a mensagem
      celebrate("burst")
      elf.celebrateMessage()
      // Auto-confirmar após gerar
      onConfirm?.()
    } catch (error) {
      console.error("Erro ao gerar mensagem:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar mensagem. Tente novamente."
      
      toast.error("Erro ao gerar mensagem", {
        description: errorMessage,
        duration: 5000,
      })
      
      // Manter a mensagem anterior em caso de erro
      setMessage(previousMessage || message)
    } finally {
      setIsLoading(false)
    }
  }

  const undoMessage = () => {
    handleMessageChange(previousMessage)
    setPreviousMessage("")
    setIsEditing(false)
  }

  const enterEditMode = () => {
    setEditingText(message) // Sincronizar o texto de edição com a mensagem atual
    setIsEditing(true)
  }

  const saveEdit = () => {
    if (editingText.trim().length > 0) {
      handleMessageChange(editingText)
      setIsEditing(false)
      celebrate("spray")
      // Auto-confirmar após salvar edição
      onConfirm?.()
    }
  }

  const handleBlur = () => {
    // Auto-confirmar quando o usuário terminar de digitar
    if (message.trim().length > 0) {
      onConfirm?.()
    }
  }

  const cancelEdit = () => {
    setEditingText("")
    setIsEditing(false)
  }

  const getInputClasses = () => {
    if (theme === "winter") {
      return "bg-white border-2 border-red-300 text-slate-800 placeholder:text-slate-400"
    }
    return "bg-white border-2 border-amber-200 text-slate-800 placeholder:text-slate-400"
  }

  return (
    <div className="w-full space-y-4">
      <AnimatePresence mode="wait">
        {isEditing ? (
          // MODO EDIÇÃO: Textarea com texto atual
          <motion.div
            key="editing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="relative">
              <Textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleBlur}
                placeholder="Escreva uma mensagem especial do coração para sua família..."
                className={`
                  min-h-[200px] text-base leading-relaxed resize-none
                  ${getInputClasses()}
                  focus-visible:ring-2 focus-visible:ring-amber-400
                  focus-visible:border-amber-400
                  transition-all duration-300
                `}
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={saveEdit}
                disabled={!editingText.trim()}
                className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={cancelEdit}
                className="gap-2 bg-slate-50 border-amber-300 text-slate-700 hover:bg-amber-50"
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        ) : message ? (
          // MODO LEITURA: Card bonito com o texto
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Card estilo citação */}
            <div className={`
              relative p-6 rounded-xl border-2
              ${theme === "winter" 
                ? "bg-white border-red-200" 
                : "bg-amber-50/50 border-amber-200"
              }
              shadow-md
            `}>
              <div className="absolute top-4 left-4 text-4xl text-amber-300/50 leading-none">&ldquo;</div>
              <p className="text-slate-800 text-base leading-relaxed pl-8 pr-4 italic">
                {message}
              </p>
              <div className="absolute bottom-4 right-4 text-4xl text-amber-300/50 leading-none">&rdquo;</div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap justify-center">
                {previousMessage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={undoMessage}
                    className="gap-2 bg-slate-50 border-amber-300 text-slate-700 hover:bg-amber-50"
                  >
                    <Undo2 className="w-4 h-4" />
                    Desfazer
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enterEditMode}
                  className="gap-2 bg-slate-50 border-amber-300 text-slate-700 hover:bg-amber-50"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          // MODO VAZIO: Textarea inicial
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
              <Textarea
                value={message}
                onChange={(e) => {
                  const newValue = e.target.value
                  handleMessageChange(newValue)
                }}
                onBlur={handleBlur}
                placeholder="Escreva uma mensagem especial do coração para sua família..."
                className={`
                  min-h-[200px] text-base leading-relaxed resize-none
                  ${getInputClasses()}
                  focus-visible:ring-2 focus-visible:ring-amber-400
                  focus-visible:border-amber-400
                  transition-all duration-300
                `}
              />
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-600">Gerando mensagem mágica...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-amber-200 pt-4">
        <p className="text-sm font-medium text-slate-700 mb-3 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Assistente Mágico (IA)
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMessage("emocionante")}
            disabled={isLoading}
            className="gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 border-0 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Heart className="w-4 h-4" />
            Gerar Emocionante
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMessage("engraçada")}
            disabled={isLoading}
            className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 border-0 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Engraçada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMessage("poetica")}
            disabled={isLoading}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <BookOpen className="w-4 h-4" />
            Gerar Poética
          </Button>
        </div>
      </div>
    </div>
  )
}
