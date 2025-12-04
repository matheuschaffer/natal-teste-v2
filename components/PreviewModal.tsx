"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SimpleBackground } from "@/components/SimpleBackground"
import { FontType } from "@/components/FontSelector"
import { ThemeType } from "@/components/ThemeSystem"
import { GalleryLayout } from "@/components/PhotoUploader"
import { useCelebration } from "@/hooks/useCelebration"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, Sparkles, Rocket } from "lucide-react"

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  selectedFont: FontType | null
  selectedTheme: ThemeType | null
  galleryLayout: GalleryLayout
  photos: Array<{ id: string; preview: string }>
}

export function PreviewModal({
  open,
  onOpenChange,
  title,
  message,
  selectedFont,
  selectedTheme,
  galleryLayout,
  photos,
}: PreviewModalProps) {
  const { grandFinale } = useCelebration()

  // Disparar confete quando o modal abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        grandFinale()
      }, 300)
    }
  }, [open, grandFinale])

  const getFontClass = () => {
    if (!selectedFont) return "font-outfit"
    switch (selectedFont) {
      case "signature":
        return "font-great-vibes"
      case "luxury":
        return "font-playfair"
      case "modern":
        return "font-outfit"
      case "magic":
        return "font-mountains-christmas"
      default:
        return "font-outfit"
    }
  }

  const currentTheme = selectedTheme || "classic"

  // Renderizar galeria de fotos no preview
  const renderPhotoGallery = () => {
    if (photos.length === 0) return null

    // Modo Masonry
    if (galleryLayout === "masonry") {
      return (
        <div className="grid grid-cols-2 gap-2">
          {photos.slice(0, 4).map((photo, index) => {
            const rotation = [-2, 1, -1, 2][index % 4]
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, rotate: rotation }}
                className="bg-white p-1 rounded shadow-lg"
              >
                <img
                  src={photo.preview}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                />
              </motion.div>
            )
          })}
        </div>
      )
    }

    // Modo Grid
    if (galleryLayout === "grid") {
      return (
        <div className="grid grid-cols-2 gap-2">
          {photos.slice(0, 4).map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-lg overflow-hidden shadow-md"
            >
              <img
                src={photo.preview}
                alt="Foto"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      )
    }

    // Modo Carousel
    if (galleryLayout === "carousel") {
      return (
        <div className="relative overflow-hidden rounded-lg">
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="flex-shrink-0 w-full snap-center"
              >
                <img
                  src={photo.preview}
                  alt="Foto"
                  className="w-full aspect-[4/3] object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }


    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Eye className="w-6 h-6 text-amber-500" />
            <span>Sua homenagem ficou assim...</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </DialogTitle>
          <DialogDescription>
            Veja como sua página ficará para sua família
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Celular Virtual */}
          <div className="max-w-[350px] mx-auto">
            <div className="relative bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />
              
              {/* Tela do Celular */}
              <div className="relative bg-white rounded-[2rem] overflow-hidden min-h-[600px]">
                {/* Background */}
                <div className="absolute inset-0">
                  <SimpleBackground theme={selectedTheme} />
                </div>

                {/* Conteúdo */}
                <div className="relative z-10 p-6 space-y-6 min-h-[600px]">
                  {/* Título */}
                  {title && (
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-3xl font-bold text-center ${getFontClass()}`}
                      style={{
                        color: currentTheme === "winter" ? "#1e293b" : "#ffffff",
                      }}
                    >
                      {title}
                    </motion.h1>
                  )}

                  {/* Mensagem */}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg"
                    >
                      <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                        {message}
                      </p>
                    </motion.div>
                  )}

                  {/* Galeria de Fotos */}
                  {photos.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2"
                    >
                      {renderPhotoGallery()}
                    </motion.div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* Área de Venda */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-center text-lg font-medium text-slate-800">
              Lindo, né? Sua família vai amar. ❤️
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Button
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                onClick={() => {
                  // Aqui você pode adicionar a lógica de checkout
                  alert("Redirecionando para checkout...")
                }}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Liberar QR Code e Colocar no Ar 🚀
              </Button>

              <p className="text-center text-sm text-slate-600">
                Acesso vitalício + QR Code para imprimir por apenas{" "}
                <span className="font-bold text-amber-600">R$ 19,90</span>
              </p>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

