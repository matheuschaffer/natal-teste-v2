"use client"

import { useRef } from "react"
import { SimpleBackground } from "@/components/SimpleBackground"
import { FontType } from "@/components/FontSelector"
import { ThemeType } from "@/components/ThemeSystem"
import { GalleryLayout, FrameStyle } from "@/components/PhotoUploader"
import { motion, useInView } from "framer-motion"
import { Sparkles, Smile, Heart, Gift, Play, Pause } from "lucide-react"

// Componente Separador Decorativo
const DecorativeSeparator = () => (
  <div className="flex items-center justify-center py-6">
    <div className="flex items-center gap-4 w-full max-w-md">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-amber-400/50" />
      <Sparkles className="w-5 h-5 text-amber-400" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-400/50 to-amber-400/50" />
    </div>
  </div>
)

interface PageViewerProps {
  title: string
  message: string
  selectedFont: FontType | null
  selectedTheme: ThemeType | null
  galleryLayout: GalleryLayout
  selectedFrame: FrameStyle
  photoUrls: string[]
  audioUrl?: string | null
  hasAudio?: boolean
  isPublic?: boolean
  showPreviewWatermark?: boolean
}

export function PageViewer({
  title,
  message,
  selectedFont,
  selectedTheme,
  galleryLayout,
  selectedFrame,
  photoUrls,
  audioUrl,
  hasAudio = false,
  isPublic = false,
  showPreviewWatermark = false,
}: PageViewerProps) {
  const galleryRef = useRef(null)
  const messageRef = useRef(null)
  const galleryInView = useInView(galleryRef, { once: true, margin: "-100px" })
  const messageInView = useInView(messageRef, { once: true, margin: "-100px" })

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
  const isDarkTheme = currentTheme === "classic"

  // Obter classe de fundo do tema
  const getThemeBackground = () => {
    if (currentTheme === "classic") {
      return "bg-gradient-to-b from-red-600 via-red-500 to-red-700"
    }
    return "bg-gradient-to-b from-slate-50 to-slate-100"
  }

  // Obter cor de texto baseada no tema
  const getTextColor = () => {
    if (currentTheme === "classic") {
      return "text-white"
    }
    return "text-slate-900"
  }

  // Obter classes CSS para a moldura
  const getFrameClasses = () => {
    switch (selectedFrame) {
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

  // Renderizar galeria de fotos
  const renderPhotoGallery = () => {
    if (photoUrls.length === 0) return null

    // Modo Masonry
    if (galleryLayout === "masonry") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {photoUrls.map((url, index) => {
            const rotation = [-3, 2, -2, 3, -1][index % 5]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0, rotate: rotation }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
                className={getFrameClasses()}
              >
                <img
                  src={url}
                  alt={`Foto ${index + 1}`}
                  className={`w-full h-full object-cover ${selectedFrame === "polaroid" ? "rounded-sm" : selectedFrame === "minimalist" ? "rounded-xl" : "rounded-lg"}`}
                />
                {selectedFrame === "polaroid" && <div className="h-8 bg-white"></div>}
              </motion.div>
            )
          })}
        </div>
      )
    }

    // Modo Grid
    if (galleryLayout === "grid") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photoUrls.map((url, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.05, duration: 0.6, ease: "easeOut" }}
              className={`aspect-square ${getFrameClasses()} overflow-hidden`}
            >
              <img
                src={url}
                alt="Foto"
                className={`w-full h-full object-cover ${selectedFrame === "polaroid" ? "rounded-sm" : selectedFrame === "minimalist" ? "rounded-xl" : "rounded-lg"}`}
              />
            </motion.div>
          ))}
        </div>
      )
    }

    // Modo Carousel
    if (galleryLayout === "carousel") {
      return (
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6">
            {photoUrls.map((url, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
                className="flex-shrink-0 w-[90%] md:w-[80%] lg:w-[70%] snap-center"
              >
                <div className={getFrameClasses()}>
                  <img
                    src={url}
                    alt="Foto"
                    className={`w-full aspect-[4/3] object-cover ${selectedFrame === "polaroid" ? "rounded-sm" : selectedFrame === "minimalist" ? "rounded-xl" : "rounded-lg"}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen relative overflow-x-hidden ${getThemeBackground()} pb-24`}
    >
      <SimpleBackground theme={currentTheme} />

      {/* Marca d'água de prévia (se necessário) */}
      {showPreviewWatermark && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
          <p className="text-white text-sm font-semibold">PRÉVIA</p>
        </div>
      )}

      {/* DOBRA 1: O Impacto (Hero Section) */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Imagem de fundo */}
        <img
          src="https://images.unsplash.com/photo-1544967082-d9d3f4266324?q=80&w=1000"
          alt="Natal"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay escuro com cor do tema */}
        <div className={`absolute inset-0 ${currentTheme === "classic" ? "bg-black/40" : "bg-black/20"} mix-blend-multiply`}></div>

        {/* Conteúdo */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-sm md:text-base ${isDarkTheme ? "text-amber-200" : "text-slate-600"} mb-4 tracking-wider uppercase`}
          >
            Uma homenagem especial para...
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={`text-4xl md:text-6xl lg:text-8xl font-bold ${getFontClass()} ${getTextColor()} mb-6 drop-shadow-2xl`}
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className={`text-lg md:text-xl ${isDarkTheme ? "text-amber-100" : "text-slate-700"} font-serif italic`}
          >
            Celebre o amor e a união neste Natal.
          </motion.p>
        </div>

        {/* Separador */}
        <div className="absolute bottom-0 left-0 right-0">
          <DecorativeSeparator />
        </div>
      </section>

      {/* DOBRA 2: As Memórias (Galeria de Fotos) */}
      {photoUrls.length > 0 && (
        <section ref={galleryRef} className="py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className={`text-3xl md:text-4xl font-serif ${getTextColor()} mb-2`}>
                Nossos Melhores Momentos
              </h2>
              <p className={`text-sm md:text-base ${isDarkTheme ? "text-amber-100/80" : "text-slate-600"}`}>
                Memórias que aquecem o coração.
              </p>
            </motion.div>

            {galleryInView && renderPhotoGallery()}
            <DecorativeSeparator />
          </div>
        </section>
      )}

      {/* DOBRA 3: A Receita da Nossa Felicidade */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`rounded-2xl p-8 md:p-12 ${currentTheme === "classic" ? "bg-amber-50/90" : "bg-amber-50/80"} shadow-xl`}
          >
            <h3 className={`text-2xl md:text-3xl font-serif text-center ${getTextColor()} mb-6`}>
              A Receita da Nossa Felicidade
            </h3>
            <div className="space-y-4">
              {[
                { icon: Smile, text: "1 Xícara de Risadas Sem Fim", color: "text-yellow-600" },
                { icon: Heart, text: "2 Colheres de Abraços Apertados", color: "text-red-500" },
                { icon: Gift, text: "Uma pitada de Magia e Surpresas", color: "text-green-600" },
                { icon: Sparkles, text: "Misture tudo com muito Amor", color: "text-amber-500" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-full ${item.color} bg-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`text-lg md:text-xl font-medium ${getTextColor()}`}>{item.text}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
          <DecorativeSeparator />
        </div>
      </section>

      {/* DOBRA 4: A Mensagem (O Coração) */}
      <section ref={messageRef} className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className={`text-3xl md:text-4xl font-serif ${getTextColor()} mb-2`}>
              Uma mensagem especial...
            </h2>
            <p className={`text-sm md:text-base ${isDarkTheme ? "text-amber-100/80" : "text-slate-600"}`}>
              Escrita com todo carinho para vocês.
            </p>
          </motion.div>

          {messageInView && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-[#fffdf7] border-2 border-amber-400/50 rounded-2xl p-8 md:p-10 shadow-2xl relative"
            >
              {/* Decoração de canto */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-400/30"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-400/30"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-400/30"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-400/30"></div>

              <p className="text-slate-800 text-lg md:text-xl leading-relaxed font-serif text-center">
                {message}
              </p>
            </motion.div>
          )}
          <DecorativeSeparator />
        </div>
      </section>

      {/* DOBRA 5: O Áudio (Condicional) */}
      {hasAudio && audioUrl && (
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h3 className={`text-2xl md:text-3xl font-serif ${getTextColor()} mb-2`}>
                Escute esse áudio especial
              </h3>
              <p className={`text-sm md:text-base mb-6 ${isDarkTheme ? "text-amber-100/80" : "text-slate-600"}`}>
                Sua voz torna tudo mais real.
              </p>
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl max-w-md mx-auto">
                <audio
                  src={audioUrl}
                  controls
                  className="w-full"
                />
              </div>
            </motion.div>
            <DecorativeSeparator />
          </div>
        </section>
      )}

      {/* Assinatura Final */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`text-xl md:text-2xl font-serif ${getTextColor()} mb-4`}
          >
            Feliz Natal e um Próspero Ano Novo!
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-lg md:text-xl ${getFontClass()} italic ${isDarkTheme ? "text-amber-200" : "text-slate-700"}`}
          >
            Com carinho, de alguém que te ama muito.
          </motion.p>
        </div>
      </section>
    </motion.div>
  )
}

