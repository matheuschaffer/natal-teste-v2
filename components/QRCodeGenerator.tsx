"use client"

import { useRef, useEffect, useCallback } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface QRCodeGeneratorProps {
  slug: string
  onDownloadReady?: (downloadFn: () => void) => void
}

export function QRCodeGenerator({ slug, onDownloadReady }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Construir URL completa (hardcoded para produção, mas pode usar env)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")
    : "https://natal-surpresa.vercel.app"
  
  const fullUrl = `${baseUrl}/${slug}`

  // Função para baixar o QR Code
  const downloadQR = useCallback(() => {
    try {
      // Buscar o canvas do QR Code
      const canvas = canvasRef.current?.querySelector("canvas")
      
      if (!canvas) {
        console.error("Canvas do QR Code não encontrado")
        return
      }

      // Converter canvas para data URL
      const dataUrl = canvas.toDataURL("image/png")
      
      // Criar link temporário para download
      const link = document.createElement("a")
      link.download = `natal-magico-${slug}.png`
      link.href = dataUrl
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao baixar QR Code:", error)
    }
  }, [slug])

  // Expor função de download para o componente pai
  useEffect(() => {
    if (onDownloadReady) {
      onDownloadReady(downloadQR)
    }
  }, [onDownloadReady, downloadQR])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="flex justify-center"
    >
      <div
        ref={canvasRef}
        className="relative bg-white rounded-xl p-6 shadow-2xl border-4 border-amber-400 flex items-center justify-center"
      >
        {/* QR Code */}
        <div className="relative">
          <QRCodeCanvas
            id="qr-code-canvas"
            value={fullUrl}
            size={256}
            level="H" // Alto nível de correção de erro
            includeMargin={true}
            imageSettings={{
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dominant-baseline='middle' fill='%23f59e0b'%3E🎄%3C/text%3E%3C/svg%3E",
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
          
          {/* Decoração: Logo/Texto no centro (opcional) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-full p-2 shadow-lg">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

