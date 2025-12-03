"use client"

import { useState, useEffect, useRef } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { Mic, Square, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ThemeType } from "./ThemeSystem"
import { ConfirmButton } from "@/components/ui/confirm-button"

interface AudioRecorderStepProps {
  theme: ThemeType | null
  onAudioConfirm: (blob: Blob) => void
  onSkip: () => void
}

export function AudioRecorderStep({ theme, onAudioConfirm, onSkip }: AudioRecorderStepProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    error: recorderError,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      // Limpar erros quando gravar com sucesso
      setError(null)
      // Parar o timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    },
  })

  // Tratar erros do recorder
  useEffect(() => {
    if (recorderError) {
      console.error("Erro na gravação:", recorderError)
      // Parar o timer em caso de erro
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // recorderError é uma string no react-media-recorder
      const errorMessage = String(recorderError).toLowerCase()
      
      if (errorMessage.includes("permission") || errorMessage.includes("denied") || errorMessage.includes("notallowed")) {
        setError("Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.")
      } else if (errorMessage.includes("not found") || errorMessage.includes("device") || errorMessage.includes("notfound")) {
        setError("Nenhum microfone encontrado. Verifique se há um dispositivo de áudio conectado.")
      } else {
        setError("Erro ao acessar o microfone. Tente novamente.")
      }
    }
  }, [recorderError])

  const isRecording = status === "recording"
  const hasRecorded = !!mediaBlobUrl

  // Timer: Gerenciar contador de tempo quando está gravando
  useEffect(() => {
    // Resetar tempo quando começar a gravar
    if (status === "recording") {
      setRecordingTime(0)
      
      // Limpar qualquer timer anterior
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Iniciar novo timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1
          // Parar automaticamente após 30 segundos
          if (newTime >= 30) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            stopRecording()
            return 30
          }
          return newTime
        })
      }, 1000)
    } else {
      // Limpar timer quando parar de gravar ou mudar status
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]) // stopRecording é estável do hook, não precisa estar nas dependências

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartRecording = () => {
    setError(null)
    setIsConfirmed(false)
    startRecording()
  }

  const handleStopRecording = () => {
    stopRecording()
  }

  const handleConfirm = async () => {
    if (!mediaBlobUrl) return

    try {
      // Buscar o blob da URL
      const response = await fetch(mediaBlobUrl)
      const blob = await response.blob()
      
      // Confirmar o áudio
      onAudioConfirm(blob)
      setIsConfirmed(true)
    } catch (err) {
      console.error("Erro ao processar áudio:", err)
      setError("Erro ao processar áudio. Tente gravar novamente.")
    }
  }

  const handleDelete = () => {
    clearBlobUrl()
    setIsConfirmed(false)
    setError(null)
  }

  const handleSkip = () => {
    clearBlobUrl()
    setIsConfirmed(false)
    setError(null)
    onSkip()
  }

  return (
    <div className="w-full space-y-6">
      {/* Mensagem de erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">⚠️ Erro ao acessar microfone</p>
              <p>{error}</p>
            </div>
            <Button
              onClick={() => setError(null)}
              variant="ghost"
              size="sm"
              className="text-red-700 hover:text-red-900 flex-shrink-0"
            >
              Fechar
            </Button>
          </div>
        </motion.div>
      )}

      {!hasRecorded ? (
        <div className="space-y-4">
          {/* Botão Gravar/Parar */}
          <motion.button
            whileHover={{ scale: isRecording ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`
              w-full rounded-2xl p-6 flex flex-col items-center justify-center gap-4
              border-2 transition-all duration-300
              ${isRecording 
                ? "bg-red-600 border-red-700 text-white shadow-lg" 
                : "bg-red-500 hover:bg-red-600 border-red-600 text-white shadow-md hover:shadow-lg"
              }
            `}
          >
            <motion.div
              animate={isRecording ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
              className="relative"
            >
              {isRecording ? (
                <Square className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-700/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <p className="font-semibold text-lg">
                {isRecording ? "Gravando..." : "Gravar Agora"}
              </p>
              {isRecording && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm mt-2 font-mono"
                >
                  {formatTime(recordingTime)}
                </motion.p>
              )}
            </div>
            
            {/* Barras de onda sonora (apenas quando gravando) */}
            {isRecording && (
              <div className="flex items-end gap-1 h-12">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 bg-white rounded-full"
                    animate={{
                      height: [10, 30, 10],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}
          </motion.button>

          {/* Botão Pular */}
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-50"
          >
            Pular etapa de áudio / Não quero gravar
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border-2 border-amber-200 rounded-2xl p-6 space-y-4"
        >
          {/* Player de Áudio */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Áudio Gravado</p>
                <p className="text-sm text-slate-600">Ouça antes de confirmar</p>
              </div>
              <button
                onClick={handleDelete}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                aria-label="Remover áudio"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Player nativo */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <audio
                src={mediaBlobUrl || undefined}
                controls
                className="w-full"
              />
            </div>
          </div>

          {/* Botão Confirmar */}
          <ConfirmButton
            onClick={handleConfirm}
            disabled={isConfirmed}
            confirmed={isConfirmed}
            confirmedText="Áudio Confirmado!"
          >
            Confirmar e Salvar Áudio
          </ConfirmButton>
        </motion.div>
      )}
    </div>
  )
}

