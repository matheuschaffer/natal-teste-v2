"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Upload, X, Image as ImageIcon, LayoutGrid, Images, GalleryHorizontal, Frame, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeType } from "./ThemeSystem"

const MAX_PHOTOS = 5

export type GalleryLayout = "masonry" | "grid" | "carousel"
export type FrameStyle = "polaroid" | "minimalist" | "gold"

interface Photo {
  id: string
  file: File
  preview: string
}

interface PhotoUploaderProps {
  theme: ThemeType | null
  onPhotosChange?: (count: number) => void
  onPhotosUpdate?: (photos: Photo[]) => void
  onConfirm?: () => void
  galleryLayout?: GalleryLayout
  onLayoutChange?: (layout: GalleryLayout) => void
  selectedFrame?: FrameStyle
  onFrameChange?: (frame: FrameStyle) => void
}

const layoutOptions: Array<{
  id: GalleryLayout
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: "masonry",
    name: "Varal de Memórias",
    description: "Fotos rotacionadas e espalhadas",
    icon: Images,
  },
  {
    id: "grid",
    name: "Álbum Clássico",
    description: "Grid organizado e alinhado",
    icon: LayoutGrid,
  },
  {
    id: "carousel",
    name: "Carrossel Mágico",
    description: "Slider com foto em destaque",
    icon: GalleryHorizontal,
  },
]

const frameOptions: Array<{
  id: FrameStyle
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: "polaroid",
    name: "Polaroid",
    description: "Borda branca grossa",
    icon: Frame,
  },
  {
    id: "minimalist",
    name: "Minimalista",
    description: "Sem borda, apenas sombra",
    icon: Sparkles,
  },
  {
    id: "gold",
    name: "Elegant Gold",
    description: "Borda dourada fina",
    icon: Frame,
  },
]

export function PhotoUploader({ theme, onPhotosChange, onPhotosUpdate, onConfirm, galleryLayout: externalLayout, onLayoutChange, selectedFrame: externalFrame, onFrameChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedLayout, setSelectedLayout] = useState<GalleryLayout>(externalLayout || "masonry")
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle>(externalFrame || "polaroid")
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Sincronizar layout quando mudar externamente
  useEffect(() => {
    if (externalLayout !== undefined) {
      setSelectedLayout(externalLayout)
    }
  }, [externalLayout])

  // Sincronizar frame quando mudar externamente
  useEffect(() => {
    if (externalFrame !== undefined) {
      setSelectedFrame(externalFrame)
    }
  }, [externalFrame])

  const currentLayout = externalLayout !== undefined ? externalLayout : selectedLayout
  const currentFrame = externalFrame !== undefined ? externalFrame : selectedFrame

  // Aplicar mudança de layout IMEDIATAMENTE
  const handleLayoutChange = (layout: GalleryLayout) => {
    setSelectedLayout(layout)
    onLayoutChange?.(layout)
  }

  // Aplicar mudança de moldura IMEDIATAMENTE
  const handleFrameChange = (frame: FrameStyle) => {
    setSelectedFrame(frame)
    onFrameChange?.(frame)
  }

  // Obter classes CSS para a moldura
  const getFrameClasses = () => {
    switch (currentFrame) {
      case "polaroid":
        return "bg-white p-2 rounded-sm shadow-2xl"
      case "minimalist":
        return "rounded-xl shadow-lg"
      case "gold":
        return "border-2 border-amber-400 rounded-lg shadow-xl"
      default:
        return "bg-white p-2 rounded-sm shadow-2xl"
    }
  }

  const getTextColor = () => {
    return "text-slate-700"
  }

  const getBorderColor = () => {
    return "border-amber-300"
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const newPhotos: Photo[] = []
    const remainingSlots = MAX_PHOTOS - photos.length

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const id = Math.random().toString(36).substring(7)
        const preview = URL.createObjectURL(file)
        newPhotos.push({ id, file, preview })
      }
    })

    setPhotos((prev) => {
      const updated = [...prev, ...newPhotos]
      const newCount = updated.length
      onPhotosChange?.(newCount)
      onPhotosUpdate?.(updated)
      // Auto-confirmar quando houver fotos
      if (newCount > 0) {
        onConfirm?.()
      }
      return updated
    })
  }, [photos.length, onPhotosChange, onPhotosUpdate, onConfirm])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }, [handleFiles])

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id)
      if (photo) {
        URL.revokeObjectURL(photo.preview)
      }
      const updated = prev.filter((p) => p.id !== id)
      onPhotosChange?.(updated.length)
      onPhotosUpdate?.(updated)
      // Auto-confirmar se ainda houver fotos
      if (updated.length > 0) {
        onConfirm?.()
      }
      return updated
    })
  }, [onPhotosChange, onPhotosUpdate, onConfirm])

  // Função para gerar rotação aleatória para o modo Masonry
  const getRandomRotation = (index: number) => {
    const rotations = [-3, -2, -1, 0, 1, 2, 3]
    return rotations[index % rotations.length]
  }

  // Renderizar fotos no modo Masonry/Polaroid
  const renderMasonryLayout = () => {
    const getGridClass = (index: number) => {
      if (photos.length === 1) return "col-span-2 row-span-2"
      if (photos.length === 2) return index === 0 ? "col-span-2 row-span-2" : "col-span-2 row-span-2"
      if (photos.length === 3) {
        if (index === 0) return "col-span-2 row-span-2"
        return "col-span-1 row-span-1"
      }
      if (photos.length === 4) {
        return "col-span-1 row-span-1"
      }
      if (photos.length === 5) {
        if (index === 0) return "col-span-2 row-span-2"
        return "col-span-1 row-span-1"
      }
      return "col-span-1 row-span-1"
    }

    return (
      <div className="grid grid-cols-2 gap-3 min-h-[300px]">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: getRandomRotation(index) }}
              exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
              className={`relative ${getGridClass(index)} group min-h-[150px]`}
            >
              {/* Aplicar moldura selecionada */}
              <div className={`${getFrameClasses()} transform hover:scale-105 transition-transform duration-300`}>
                <div className={`relative overflow-hidden ${currentFrame === "polaroid" ? "rounded-sm" : currentFrame === "minimalist" ? "rounded-xl" : "rounded-lg"}`}>
                  <img
                    src={photo.preview}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-10"
                    aria-label="Remover foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Espaço inferior estilo Polaroid (apenas para polaroid) */}
                {currentFrame === "polaroid" && <div className="h-8 bg-white"></div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < MAX_PHOTOS && (
          <label
            htmlFor="photo-upload"
            className={`col-span-1 row-span-1 border-2 border-dashed ${getBorderColor()} rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all duration-300 min-h-[150px] bg-slate-50`}
          >
            <ImageIcon className={`w-8 h-8 ${getTextColor()}`} />
            <span className={`text-xs ${getTextColor()}`}>
              Adicionar mais
            </span>
          </label>
        )}
      </div>
    )
  }

  // Renderizar fotos no modo Grid Limpo
  const renderGridLayout = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-h-[300px]">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-square group"
            >
              <div className={`relative w-full h-full ${getFrameClasses()} overflow-hidden transition-shadow duration-300`}>
                <img
                  src={photo.preview}
                  alt={`Foto ${index + 1}`}
                  className={`w-full h-full object-cover ${currentFrame === "polaroid" ? "rounded-sm" : currentFrame === "minimalist" ? "rounded-xl" : "rounded-lg"}`}
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-10"
                  aria-label="Remover foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < MAX_PHOTOS && (
          <label
            htmlFor="photo-upload"
            className={`aspect-square border-2 border-dashed ${getBorderColor()} rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all duration-300 bg-slate-50`}
          >
            <ImageIcon className={`w-8 h-8 ${getTextColor()}`} />
            <span className={`text-xs ${getTextColor()}`}>
              Adicionar mais
            </span>
          </label>
        )}
      </div>
    )
  }

  // Atualizar índice do carrossel quando houver scroll
  useEffect(() => {
    if (currentLayout !== "carousel") return
    
    const container = carouselRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const itemWidth = container.clientWidth * 0.9 + 16 // 90% width + gap
      const newIndex = Math.round(scrollLeft / itemWidth)
      setCarouselIndex(Math.min(newIndex, photos.length - 1))
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [photos.length, currentLayout])


  // Renderizar fotos no modo Carrossel
  const renderCarouselLayout = () => {
    return (
      <div className="space-y-4">
        <div className="relative">
          <div
            ref={carouselRef}
            className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <div className="flex gap-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative flex-shrink-0 w-[90%] snap-center group"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <div className={`relative aspect-[4/3] ${getFrameClasses()} overflow-hidden`}>
                    <img
                      src={photo.preview}
                      alt={`Foto ${index + 1}`}
                      className={`w-full h-full object-cover ${currentFrame === "polaroid" ? "rounded-sm" : currentFrame === "minimalist" ? "rounded-xl" : "rounded-lg"}`}
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-10"
                      aria-label="Remover foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Indicadores de bolinhas */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (carouselRef.current) {
                    const itemWidth = carouselRef.current.clientWidth * 0.9 + 16
                    carouselRef.current.scrollTo({ left: index * itemWidth, behavior: 'smooth' })
                  }
                  setCarouselIndex(index)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === carouselIndex ? "bg-amber-500 w-6" : "bg-amber-200 w-2"
                }`}
                aria-label={`Ir para foto ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <motion.div
        animate={{
          scale: photos.length === 0 ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: photos.length === 0 ? Infinity : 0,
          ease: "easeInOut",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          bg-slate-50
          ${isDragging ? `${getBorderColor()} bg-amber-50 scale-105 border-amber-400` : getBorderColor()}
          ${photos.length >= MAX_PHOTOS ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={photos.length >= MAX_PHOTOS}
        />
        
        {photos.length === 0 ? (
          <label htmlFor="photo-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center"
              >
                <Upload className={`w-8 h-8 ${getTextColor()}`} />
              </motion.div>
              <div>
                <p className={`text-sm font-medium ${getTextColor()}`}>
                  Arraste fotos aqui ou clique para selecionar
                </p>
                <p className={`text-xs ${getTextColor()} opacity-70 mt-1`}>
                  Máximo de {MAX_PHOTOS} fotos
                </p>
              </div>
            </div>
          </label>
        ) : (
          <motion.div
            key={currentLayout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {currentLayout === "masonry" && renderMasonryLayout()}
            {currentLayout === "grid" && renderGridLayout()}
            {currentLayout === "carousel" && (
              <>
                {renderCarouselLayout()}
                {photos.length < MAX_PHOTOS && (
                  <div className="mt-4">
                    <label
                      htmlFor="photo-upload"
                      className={`block border-2 border-dashed ${getBorderColor()} rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all duration-300 bg-slate-50`}
                    >
                      <ImageIcon className={`w-8 h-8 ${getTextColor()}`} />
                      <span className={`text-xs ${getTextColor()}`}>
                        Adicionar mais fotos
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {photos.length > 0 && (
        <div className="space-y-4">
          <p className={`text-xs text-center ${getTextColor()}`}>
            {photos.length} de {MAX_PHOTOS} fotos adicionadas
          </p>

          {/* Seleção de Layout da Galeria */}
          <div className="space-y-3">
            <p className={`text-sm font-medium text-center ${getTextColor()}`}>
              Escolha o estilo de exibição:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {layoutOptions.map((option) => {
                const Icon = option.icon
                const isSelected = currentLayout === option.id
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleLayoutChange(option.id)}
                    className={`
                      relative rounded-lg p-3 border-2 transition-all duration-300
                      bg-white text-center
                      ${isSelected
                        ? "border-amber-500 shadow-md scale-105 ring-2 ring-amber-200"
                        : "border-amber-200 hover:border-amber-300 hover:shadow-sm"
                      }
                    `}
                    whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon className={`w-5 h-5 ${isSelected ? "text-amber-600" : "text-slate-600"}`} />
                      <span className={`text-xs font-medium ${isSelected ? "text-amber-700" : "text-slate-700"}`}>
                        {option.name}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <span className="text-white text-[10px]">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Seleção de Moldura */}
          <div className="space-y-3">
            <p className={`text-sm font-medium text-center ${getTextColor()}`}>
              Escolha o estilo de moldura:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {frameOptions.map((option) => {
                const Icon = option.icon
                const isSelected = currentFrame === option.id
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleFrameChange(option.id)}
                    className={`
                      relative rounded-lg p-3 border-2 transition-all duration-300
                      bg-white text-center
                      ${isSelected
                        ? "border-amber-500 shadow-md scale-105 ring-2 ring-amber-200"
                        : "border-amber-200 hover:border-amber-300 hover:shadow-sm"
                      }
                    `}
                    whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon className={`w-5 h-5 ${isSelected ? "text-amber-600" : "text-slate-600"}`} />
                      <span className={`text-xs font-medium ${isSelected ? "text-amber-700" : "text-slate-700"}`}>
                        {option.name}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <span className="text-white text-[10px]">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
