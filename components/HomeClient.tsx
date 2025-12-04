"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageGenerator } from "@/components/MessageGenerator"
import { PhotoUploader, GalleryLayout } from "@/components/PhotoUploader"
import dynamic from "next/dynamic"
import { SimpleBackground } from "@/components/SimpleBackground"

// Importação dinâmica do AudioRecorderStep para evitar erro de SSR (usa Worker)
const AudioRecorderStep = dynamic(
  () => import("@/components/AudioRecorderStep").then((mod) => ({ default: mod.AudioRecorderStep })),
  { ssr: false }
)
import { FontSelector, FontType } from "@/components/FontSelector"
import { ThemeSystem, ThemeType } from "@/components/ThemeSystem"
import { StepCard } from "@/components/StepCard"
import { ProgressBar } from "@/components/ProgressBar"
import { ProgressDock } from "@/components/ProgressDock"
import { useCelebration } from "@/hooks/useCelebration"
import { elfAssistant } from "@/lib/elfAssistant"
import { ConfirmButton } from "@/components/ui/confirm-button"
import { FinalResultPreview } from "@/components/FinalResultPreview"
import { EnvelopeIntro } from "@/components/EnvelopeIntro"
import { Gift } from "lucide-react"
import { motion } from "framer-motion"

function HomeContent() {
  const searchParams = useSearchParams()
  const influencerRef = searchParams.get("ref") || null
  
  const [title, setTitle] = useState("")
  const [titleConfirmed, setTitleConfirmed] = useState(false)
  const [message, setMessage] = useState("")
  const [messageConfirmed, setMessageConfirmed] = useState(false)
  const [photosCount, setPhotosCount] = useState(0)
  const [photos, setPhotos] = useState<Array<{ id: string; preview: string; file?: File }>>([])
  const [photosConfirmed, setPhotosConfirmed] = useState(false)
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>("masonry")
  const [selectedFrame, setSelectedFrame] = useState<"polaroid" | "minimalist" | "gold">("polaroid")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioConfirmed, setAudioConfirmed] = useState(false)
  const [audioSkipped, setAudioSkipped] = useState(false)
  const [selectedFont, setSelectedFont] = useState<FontType | null>(null)
  const [fontConfirmed, setFontConfirmed] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeType | null>(null)
  const [themeConfirmed, setThemeConfirmed] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showEnvelopeIntro, setShowEnvelopeIntro] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const { celebrate } = useCelebration()
  const elf = elfAssistant()
  const [hasCelebratedCompletion, setHasCelebratedCompletion] = useState(false)
  
  // Detectar quando todos os passos estão completos
  useEffect(() => {
    const audioCompleted = audioConfirmed || audioSkipped
    const isComplete = fontConfirmed && themeConfirmed && titleConfirmed && messageConfirmed && photosConfirmed && audioCompleted
    if (isComplete && !hasCelebratedCompletion) {
      elf.celebrateCompletion()
      setHasCelebratedCompletion(true)
    } else if (!isComplete) {
      setHasCelebratedCompletion(false)
    }
  }, [fontConfirmed, themeConfirmed, titleConfirmed, messageConfirmed, photosConfirmed, audioConfirmed, audioSkipped, hasCelebratedCompletion, elf])
  
  // Calcular passo atual baseado no preenchimento
  const getCurrentStep = () => {
    const audioCompleted = audioConfirmed || audioSkipped
    if (fontConfirmed && themeConfirmed && titleConfirmed && messageConfirmed && photosConfirmed && audioCompleted) return 6
    if (fontConfirmed && themeConfirmed && titleConfirmed && messageConfirmed && photosConfirmed) return 5
    if (fontConfirmed && themeConfirmed && titleConfirmed && messageConfirmed) return 4
    if (fontConfirmed && themeConfirmed && titleConfirmed) return 3
    if (fontConfirmed && themeConfirmed) return 2
    if (fontConfirmed) return 1
    return 0
  }
  
  const currentStep = getCurrentStep()
  const totalSteps = 6

  // Calcular status dos passos para o ProgressDock
  const getStepsStatus = () => {
    return [
      {
        step: 1,
        completed: fontConfirmed,
        current: !fontConfirmed,
      },
      {
        step: 2,
        completed: themeConfirmed,
        current: fontConfirmed && !themeConfirmed,
      },
      {
        step: 3,
        completed: titleConfirmed,
        current: fontConfirmed && themeConfirmed && !titleConfirmed,
      },
      {
        step: 4,
        completed: messageConfirmed,
        current: fontConfirmed && themeConfirmed && titleConfirmed && !messageConfirmed,
      },
      {
        step: 5,
        completed: photosConfirmed,
        current: fontConfirmed && themeConfirmed && titleConfirmed && messageConfirmed && !photosConfirmed,
      },
      {
        step: 6,
        completed: audioConfirmed || audioSkipped,
        current: fontConfirmed && themeConfirmed && titleConfirmed && messageConfirmed && photosConfirmed && !audioConfirmed && !audioSkipped,
      },
    ]
  }

  const handleFinalize = () => {
    setIsPreviewMode(true)
    setShowEnvelopeIntro(true)
  }

  // Garantir que o tema padrão seja usado quando null
  const currentTheme = selectedTheme || "classic"

  const getHeaderTextColor = () => {
    return currentTheme === "winter" ? "text-slate-800" : "text-white"
  }

  const getHeaderBg = () => {
    return currentTheme === "winter" ? "bg-white/80" : "bg-white/20"
  }

  const getSubtitleColor = () => {
    if (currentTheme === "winter") return "text-slate-700"
    return "text-white/90"
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-500`}>
      {/* Background Dinâmico (Sempre atrás de tudo) */}
      <div className="fixed inset-0 -z-10">
        <SimpleBackground theme={selectedTheme} />
      </div>

      {/* Renderização Condicional: Preview ou Edição */}
      {isPreviewMode ? (
        // ---- MODO PREVIEW ----
        <>
          {showEnvelopeIntro ? (
            <EnvelopeIntro
              theme={selectedTheme}
              onOpen={() => setShowEnvelopeIntro(false)}
            />
          ) : (
                <FinalResultPreview
                  title={title}
                  message={message}
                  selectedFont={selectedFont}
                  selectedTheme={selectedTheme}
                  galleryLayout={galleryLayout}
                  selectedFrame={selectedFrame}
                  photos={photos}
                  audioBlob={audioBlob}
                  hasAudio={audioConfirmed}
                  audioSkipped={audioSkipped}
                  isPaid={isPaid}
                  influencerRef={influencerRef}
                  onEdit={() => {
                    setIsPreviewMode(false)
                    setShowEnvelopeIntro(false)
                  }}
                  onPaymentSuccess={() => setIsPaid(true)}
                />
          )}
        </>
      ) : (
        // ---- MODO EDIÇÃO ----
        <>
          {/* Barra de Progresso no Topo */}
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          {/* Conteúdo Principal */}
          <main className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 pt-10 pb-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`inline-block px-5 py-2 ${getHeaderBg()} backdrop-blur-sm border-2 border-amber-300/50 rounded-full mb-6`}
          >
            <span className={`${getHeaderTextColor()} text-sm font-semibold tracking-wide`}>
              Natal Mágico 🎄
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`font-dm-serif-display text-5xl md:text-6xl lg:text-7xl ${getHeaderTextColor()} mb-4 leading-tight`}
            style={{ fontFamily: "var(--font-dm-serif-display)" }}
          >
            Crie a sua homenagem<br />personalizada para sua família
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`${getSubtitleColor()} text-lg md:text-xl max-w-2xl mx-auto`}
          >
            Siga os passos abaixo para criar um presente inesquecível.
          </motion.p>
        </motion.header>

        {/* Passos */}
        <div className="container mx-auto px-4 py-8 space-y-10 pb-32">
          {/* Passo 1: Escolha da Tipografia */}
          <StepCard
            stepNumber={1}
            title="O Estilo da Letra"
            subtitle="Selecione uma fonte elegante para sua homenagem"
            selectedFont={selectedFont}
            theme={selectedTheme}
          >
            <FontSelector 
              selectedFont={selectedFont} 
              onFontChange={setSelectedFont}
              onConfirm={() => setFontConfirmed(true)}
              onReset={() => setFontConfirmed(false)}
              fontConfirmed={fontConfirmed}
            />
          </StepCard>

          {/* Passo 2: Escolha do Tema */}
          <StepCard
            stepNumber={2}
            title="O Clima de Natal"
            subtitle="Selecione a atmosfera perfeita para sua homenagem"
            selectedFont={selectedFont}
            theme={selectedTheme}
          >
            <ThemeSystem 
              theme={selectedTheme} 
              onThemeChange={setSelectedTheme}
              onConfirm={() => setThemeConfirmed(true)}
              onReset={() => setThemeConfirmed(false)}
              themeConfirmed={themeConfirmed}
            />
          </StepCard>

          {/* Passo 3: O Título */}
          <StepCard
            stepNumber={3}
            title="Dê um título para sua página"
            subtitle="Um título especial torna tudo mais pessoal"
            selectedFont={selectedFont}
            theme={selectedTheme}
          >
            <div className="space-y-4">
              <Input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  // Resetar confirmação quando o título mudar
                  if (titleConfirmed) {
                    setTitleConfirmed(false)
                  }
                }}
                placeholder="Ex: Natal da Família Santos"
                className={`
                  text-xl md:text-2xl font-semibold h-16 md:h-20
                  ${currentTheme === "winter" 
                    ? "bg-white border-2 border-red-300 text-slate-800 placeholder:text-slate-400" 
                    : "bg-white border-2 border-amber-200 text-slate-800 placeholder:text-slate-400"
                  }
                  focus-visible:ring-2 focus-visible:ring-amber-400
                  focus-visible:border-amber-400
                  transition-all duration-300
                  text-center
                `}
              />
              <ConfirmButton
                onClick={() => {
                  if (title.trim().length > 0) {
                    setTitleConfirmed(true)
                    celebrate("spray")
                    elf.celebrateTitle()
                  }
                }}
                disabled={!title.trim()}
                confirmed={titleConfirmed}
                confirmedText="Título Confirmado!"
              >
                Confirmar Título
              </ConfirmButton>
            </div>
          </StepCard>

          {/* Passo 4: A Mensagem */}
          <StepCard
            stepNumber={4}
            title="Escreva uma mensagem emocionante"
            subtitle="Deixe sua mensagem tocar o coração"
            selectedFont={selectedFont}
            theme={selectedTheme}
          >
                  <MessageGenerator 
                    theme={selectedTheme} 
                    onMessageChange={setMessage}
                    onConfirm={() => setMessageConfirmed(true)}
                  />
          </StepCard>

          {/* Passo 5: Galeria */}
          <StepCard
            stepNumber={5}
            title="Momentos Especiais"
            subtitle="Adicione até 5 fotos que contam sua história"
            selectedFont={selectedFont}
            theme={selectedTheme}
          >
            <PhotoUploader 
              theme={selectedTheme} 
              onPhotosChange={setPhotosCount}
              onPhotosUpdate={(photos) => setPhotos(photos.map(p => ({ id: p.id, preview: p.preview, file: p.file })))}
              onConfirm={() => setPhotosConfirmed(true)}
              galleryLayout={galleryLayout}
              onLayoutChange={(layout) => {
                setGalleryLayout(layout)
              }}
            />
          </StepCard>

          {/* Passo 6: A Voz do Coração */}
          <StepCard
            stepNumber={6}
            title="Grave um áudio especial"
            subtitle="Grave um áudio de até 30 segundos falando o quanto sua família é especial."
            selectedFont={selectedFont}
            theme={selectedTheme}
          >
            <AudioRecorderStep
              theme={selectedTheme}
              onAudioConfirm={(blob) => {
                setAudioBlob(blob)
                setAudioConfirmed(true)
                setAudioSkipped(false)
                celebrate("spray")
                elf.celebrateAudio()
              }}
              onSkip={() => {
                setAudioBlob(null)
                setAudioConfirmed(false)
                setAudioSkipped(true)
                celebrate("spray")
              }}
            />
          </StepCard>

          {/* Botão Finalizar (no final da página) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-8 pb-8"
          >
            <Button
              onClick={handleFinalize}
              size="lg"
              disabled={!fontConfirmed || !themeConfirmed || !titleConfirmed || !messageConfirmed || !photosConfirmed || !(audioConfirmed || audioSkipped)}
              className="w-full text-lg py-6 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Gift className="w-5 h-5 mr-2" />
              Finalizar e Ver Prévia 🎁
            </Button>
          </motion.div>
        </div>
      </main>

          {/* Progress Dock (Footer Interativo) */}
          <ProgressDock
            steps={getStepsStatus()}
            onFinalize={handleFinalize}
            theme={currentTheme}
          />
        </>
      )}
    </div>
  )
}

export default function HomeClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

