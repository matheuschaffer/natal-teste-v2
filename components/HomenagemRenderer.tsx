"use client";

import { useState, useRef, useEffect } from "react";
import { SimpleBackground } from "@/components/SimpleBackground";
import { FontType } from "@/components/FontSelector";
import { ThemeType } from "@/components/ThemeSystem";
import { GalleryLayout, FrameStyle } from "@/components/PhotoUploader";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  Smile,
  Heart,
  Gift,
  ArrowLeft,
  Lock,
  QrCode,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCelebration } from "@/hooks/useCelebration";
import { QRCodeCanvas } from "qrcode.react";

// Componente Separador Decorativo
const DecorativeSeparator = () => (
  <div className="flex items-center justify-center py-6">
    <div className="flex items-center gap-4 w-full max-w-md">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-amber-400/50" />
      <Sparkles className="w-5 h-5 text-amber-400" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-400/50 to-amber-400/50" />
    </div>
  </div>
);

// Interface para dados da página (do Supabase)
interface PageDataFromDB {
  id: string;
  title: string;
  message: string;
  selected_font: FontType | null;
  selected_theme: ThemeType | null;
  gallery_layout: GalleryLayout;
  selected_frame: FrameStyle;
  photo_urls: string[];
  audio_url?: string | null;
  has_audio?: boolean;
  is_paid?: boolean;
  slug?: string;
}

interface HomenagemRendererProps {
  // Modo 1: Props individuais (para Preview)
  title?: string;
  message?: string;
  selectedFont?: FontType | null;
  selectedTheme?: ThemeType | null;
  galleryLayout?: GalleryLayout;
  selectedFrame?: FrameStyle;
  photos?: Array<{ id: string; preview: string } | string>;
  audioUrl?: string | null;
  hasAudio?: boolean;
  isPreviewMode?: boolean;
  onEdit?: () => void;
  children?: React.ReactNode;

  // Modo 2: Objeto data (para Página Pública)
  data?: PageDataFromDB;
}

export function HomenagemRenderer({
  // Props individuais
  title: propTitle,
  message: propMessage,
  selectedFont: propSelectedFont,
  selectedTheme: propSelectedTheme,
  galleryLayout: propGalleryLayout,
  selectedFrame: propSelectedFrame,
  photos: propPhotos,
  audioUrl: propAudioUrl,
  hasAudio: propHasAudio,
  isPreviewMode = false,
  onEdit,
  children,
  // Objeto data
  data,
}: HomenagemRendererProps) {
  const galleryRef = useRef(null);
  const messageRef = useRef(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const galleryInView = useInView(galleryRef, { once: true, margin: "-100px" });
  const messageInView = useInView(messageRef, { once: true, margin: "-100px" });
  const { celebrate } = useCelebration();

  const qrImageRef = useRef<HTMLCanvasElement>(null);

  // Estados para modo público
  const [isPaid, setIsPaid] = useState(data?.is_paid || false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const downloadQRRef = useRef<(() => void) | null>(null);

  // Extrair dados (prioriza objeto data se fornecido)
  const title = data?.title || propTitle || "";
  const message = data?.message || propMessage || "";
  const selectedFont = data?.selected_font || propSelectedFont || null;
  const selectedTheme = data?.selected_theme || propSelectedTheme || null;
  const galleryLayout = data?.gallery_layout || propGalleryLayout || "masonry";
  const selectedFrame = data?.selected_frame || propSelectedFrame || "polaroid";
  const audioUrl = data?.audio_url || propAudioUrl || null;
  const hasAudio = data?.has_audio || propHasAudio || false;

  // Preparar fotos
  let photos: Array<{ id: string; preview: string }> = [];
  if (data?.photo_urls && Array.isArray(data.photo_urls)) {
    photos = data.photo_urls.map((url: string, index: number) => ({
      id: `photo-${index}`,
      preview: url,
    }));
  } else if (propPhotos) {
    photos = propPhotos.map((photo, index) => {
      if (typeof photo === "string") {
        return { id: `photo-${index}`, preview: photo };
      }
      return photo;
    });
  }

  // Gerar URL de compartilhamento
  const generateShareUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")
      : typeof window !== "undefined"
      ? window.location.origin
      : "https://surpresadenatal.com";

    const domain = baseUrl.replace(/^https?:\/\//, "");

    if (data?.slug) {
      return `${domain}/${data.slug}`;
    }
    const slug =
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "familia-especial";
    return `${domain}/${slug}`;
  };

  const shareUrl = generateShareUrl();

  // Efeito para revelar QR Code quando pagamento confirmado (modo público)
  useEffect(() => {
    if (!isPreviewMode && isPaid && !hasRevealed && data?.id) {
      setHasRevealed(true);
      celebrate("burst");
      setTimeout(() => {
        qrCodeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
    }
  }, [isPaid, hasRevealed, isPreviewMode, data?.id, celebrate]);

  // Função para verificar pagamento (modo público)
  const handleCheckPayment = async () => {
    if (!data?.id) {
      toast.error("Erro: ID da página não encontrado.");
      return;
    }

    setIsCheckingPayment(true);

    try {
      const response = await fetch("/api/check-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageId: data.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.error || result.details || "Erro ao verificar pagamento";
        console.error("[Frontend] Erro na verificação de pagamento:", {
          status: response.status,
          error: errorMessage,
          pageId: data.id,
        });

        toast.error(errorMessage, {
          duration: 5000,
          description:
            response.status === 500
              ? "Erro interno do servidor. Tente novamente mais tarde."
              : undefined,
        });
        return;
      }

      if (result.status === "approved" && result.isPaid) {
        toast.success("Pagamento confirmado! 🎉", {
          duration: 5000,
        });
        celebrate("burst");
        setIsPaid(true);
        setHasRevealed(true);

        setTimeout(() => {
          qrCodeRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 500);
      } else {
        toast.info(
          result.message ||
            "Pagamento ainda não foi confirmado. Tente novamente em alguns instantes.",
          {
            duration: 4000,
          }
        );
      }
    } catch (error) {
      console.error("[Frontend] Erro ao verificar pagamento:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro de conexão. Verifique sua internet e tente novamente.";

      toast.error(errorMessage, {
        duration: 5000,
        description: "Não foi possível conectar ao servidor.",
      });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Função para copiar link
  const handleCopyLink = async () => {
    try {
      const fullUrl = `https://${shareUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setIsLinkCopied(true);
      toast.success("Link copiado! 🎉");
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast.error("Erro ao copiar link");
    }
  };

  // Função para baixar QR Code
  const handleDownloadQR = () => {
    try {
      const canvas = qrImageRef.current;
      if (!canvas) {
        toast.error("Erro ao gerar QR Code.");
        return;
      }

      const pngUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qr-code-${data?.slug || "natal"}.png`;
      link.click();

      toast.success("QR Code baixado com sucesso! 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível baixar o QR Code.");
    }
  };

  // Função para redirecionar para pagamento
  const handlePayNow = () => {
    if (!data?.id) {
      toast.error("Erro: ID da página não encontrado.");
      return;
    }
    // Redirecionar para página de checkout ou abrir modal
    window.location.href = `/checkout?pageId=${data.id}`;
  };

  const getFontClass = () => {
    if (!selectedFont) return "font-outfit";
    switch (selectedFont) {
      case "signature":
        return "font-great-vibes";
      case "luxury":
        return "font-playfair";
      case "modern":
        return "font-outfit";
      case "magic":
        return "font-mountains-christmas";
      default:
        return "font-outfit";
    }
  };

  const currentTheme = selectedTheme || "classic";
  const isDarkTheme = currentTheme === "classic";

  const getThemeBackground = () => {
    if (currentTheme === "classic") {
      return "bg-gradient-to-b from-red-600 via-red-500 to-red-700";
    }
    return "bg-gradient-to-b from-slate-50 to-slate-100";
  };

  const getTextColor = () => {
    if (currentTheme === "classic") {
      return "text-white";
    }
    return "text-slate-900";
  };

  const getFrameClasses = () => {
    switch (selectedFrame) {
      case "polaroid":
        return "bg-white p-2 rounded-sm shadow-2xl";
      case "minimalist":
        return "rounded-xl shadow-lg";
      case "gold":
        return "border-2 border-amber-400 rounded-lg shadow-xl";
      default:
        return "bg-white p-2 rounded-sm shadow-2xl";
    }
  };

  // Renderizar galeria de fotos
  const renderPhotoGallery = () => {
    if (photos.length === 0) return null;

    if (galleryLayout === "masonry") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {photos.map((photo, index) => {
            const rotation = [-3, 2, -2, 3, -1][index % 5];
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0, rotate: rotation }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className={getFrameClasses()}
              >
                <img
                  src={photo.preview}
                  alt={`Foto ${index + 1}`}
                  className={`w-full h-full object-cover ${
                    selectedFrame === "polaroid"
                      ? "rounded-sm"
                      : selectedFrame === "minimalist"
                      ? "rounded-xl"
                      : "rounded-lg"
                  }`}
                />
                {selectedFrame === "polaroid" && (
                  <div className="h-8 bg-white"></div>
                )}
              </motion.div>
            );
          })}
        </div>
      );
    }

    if (galleryLayout === "grid") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: index * 0.05,
                duration: 0.6,
                ease: "easeOut",
              }}
              className={`aspect-square ${getFrameClasses()} overflow-hidden`}
            >
              <img
                src={photo.preview}
                alt="Foto"
                className={`w-full h-full object-cover ${
                  selectedFrame === "polaroid"
                    ? "rounded-sm"
                    : selectedFrame === "minimalist"
                    ? "rounded-xl"
                    : "rounded-lg"
                }`}
              />
            </motion.div>
          ))}
        </div>
      );
    }

    if (galleryLayout === "carousel") {
      return (
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="flex-shrink-0 w-[90%] md:w-[80%] lg:w-[70%] snap-center"
              >
                <div className={getFrameClasses()}>
                  <img
                    src={photo.preview}
                    alt="Foto"
                    className={`w-full aspect-[4/3] object-cover ${
                      selectedFrame === "polaroid"
                        ? "rounded-sm"
                        : selectedFrame === "minimalist"
                        ? "rounded-xl"
                        : "rounded-lg"
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`min-h-screen relative overflow-x-hidden ${getThemeBackground()} ${
        isPreviewMode ? "pb-24" : "pb-16"
      }`}
    >
      <div className="fixed inset-0 -z-10">
        <SimpleBackground theme={selectedTheme} />
      </div>

      <div className="relative z-10">
        {/* Botão Voltar (apenas em preview mode) */}
        {isPreviewMode && onEdit && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-6 left-4 z-50"
          >
            <Button
              onClick={onEdit}
              variant="ghost"
              className={`${
                currentTheme === "winter"
                  ? "text-slate-800 hover:bg-white/80 bg-white/20"
                  : "text-white hover:bg-white/20 bg-black/20"
              } backdrop-blur-md`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar e Editar
            </Button>
          </motion.div>
        )}

        {/* DOBRA 1: Hero Header com Imagem de Capa */}
        <section className="relative w-full">
          {/* Imagem de Capa */}
          <div className="w-full h-64 md:h-80 lg:h-96 relative overflow-hidden">
            <img
              src="/capa-natal.jpg"
              alt="Capa de Natal"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback: aplicar cor de fundo festiva se a imagem falhar
                const target = e.currentTarget;
                target.style.display = "none";
                if (target.parentElement) {
                  target.parentElement.className += ` ${
                    currentTheme === "classic"
                      ? "bg-gradient-to-b from-red-600 via-red-500 to-red-700"
                      : "bg-gradient-to-b from-slate-100 to-slate-200"
                  }`;
                }
              }}
            />
            {/* Gradiente na parte inferior para acabamento */}
            <div className="absolute bottom-0 left-0 right-0 w-full h-24 bg-gradient-to-t from-black/60 via-black/40 to-transparent pointer-events-none" />
          </div>

          {/* Título e Subtítulo (Logo abaixo da imagem) */}
          <div className="relative z-10 container mx-auto px-4 text-center space-y-3 pt-12 pb-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className={`text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold ${getFontClass()} text-white`}
              style={{
                textShadow:
                  "0 2px 30px rgba(0,0,0,0.5), 0 4px 60px rgba(0,0,0,0.3)",
              }}
            >
              {title || "Nossa Família"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-base md:text-lg lg:text-xl font-playfair italic text-white/90"
            >
              Celebre o amor e a união neste Natal.
            </motion.p>
          </div>

          {/* Separador Decorativo */}
          <div className="py-2">
            <DecorativeSeparator />
          </div>
        </section>

        {/* DOBRA 2: Galeria */}
        {photos.length > 0 && (
          <section
            ref={galleryRef}
            className={`py-6 ${
              isDarkTheme ? "bg-[#f5f0e8]/80" : "bg-slate-50/80"
            }`}
          >
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-6"
              >
                <h2
                  className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 ${
                    isDarkTheme ? "text-slate-800" : "text-slate-900"
                  }`}
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Nossos Melhores Momentos
                </h2>
                <p
                  className={`text-base md:text-lg italic ${
                    isDarkTheme ? "text-slate-600" : "text-slate-700"
                  }`}
                >
                  Memórias que aquecem o coração.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={galleryInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8 }}
                className="w-full"
              >
                {renderPhotoGallery()}
              </motion.div>
            </div>

            <DecorativeSeparator />
          </section>
        )}

        {/* DOBRA 3: Receita da Felicidade */}
        <section
          className={`py-6 ${
            isDarkTheme ? "bg-amber-50/90" : "bg-amber-50/80"
          }`}
        >
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-6"
            >
              <h2
                className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 ${
                  isDarkTheme ? "text-slate-800" : "text-slate-900"
                }`}
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                A Receita da Nossa Felicidade
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <p
                className={`text-xl md:text-2xl font-semibold text-center mb-8 ${
                  isDarkTheme ? "text-slate-700" : "text-slate-800"
                }`}
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Ingredientes deste Natal:
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Smile,
                    text: "1 Xícara de Risadas Sem Fim",
                    color: "text-amber-600",
                    bg: "bg-amber-100",
                  },
                  {
                    icon: Heart,
                    text: "2 Colheres de Abraços Apertados",
                    color: "text-red-500",
                    bg: "bg-red-100",
                  },
                  {
                    icon: Gift,
                    text: "Uma pitada de Magia e Surpresas",
                    color: "text-purple-600",
                    bg: "bg-purple-100",
                  },
                  {
                    icon: Sparkles,
                    text: "Misture tudo com muito Amor",
                    color: "text-pink-500",
                    bg: "bg-pink-100",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md border border-amber-200/50"
                    >
                      <div
                        className={`flex-shrink-0 w-14 h-14 ${item.bg} rounded-full flex items-center justify-center`}
                      >
                        <Icon className={`w-7 h-7 ${item.color}`} />
                      </div>
                      <p className="text-lg md:text-xl font-medium text-slate-800 flex-1">
                        <span className={`font-bold ${item.color}`}>
                          {item.text.split(" ")[0]} {item.text.split(" ")[1]}
                        </span>{" "}
                        {item.text.split(" ").slice(2).join(" ")}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <DecorativeSeparator />
        </section>

        {/* DOBRA 4: Mensagem */}
        {message && (
          <section
            ref={messageRef}
            className={`py-6 ${
              isDarkTheme ? "bg-[#fffdf7]/90" : "bg-slate-50/90"
            }`}
          >
            <div className="container mx-auto px-4 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-6"
              >
                <h2
                  className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 ${
                    isDarkTheme ? "text-slate-800" : "text-slate-900"
                  }`}
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Uma mensagem especial...
                </h2>
                <p
                  className={`text-base md:text-lg italic ${
                    isDarkTheme ? "text-slate-600" : "text-slate-700"
                  }`}
                >
                  Escrita com todo carinho para vocês.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={messageInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative"
              >
                <div className="relative bg-[#fffdf7] border-4 border-amber-500/40 shadow-2xl rounded-lg p-8 md:p-12 lg:p-16">
                  <div
                    className="absolute inset-0 opacity-5 rounded-lg"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grain' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='25' cy='25' r='1' fill='%23000'/%3E%3Ccircle cx='75' cy='75' r='1' fill='%23000'/%3E%3Ccircle cx='50' cy='10' r='0.5' fill='%23000'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grain)'/%3E%3C/svg%3E")`,
                    }}
                  />
                  <div className="absolute inset-2 border-2 border-amber-400/20 rounded" />
                  <div className="relative z-10">
                    <p
                      className="text-lg md:text-xl lg:text-2xl leading-loose text-slate-800 font-lora"
                      style={{ lineHeight: "2", letterSpacing: "0.5px" }}
                    >
                      {message}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <DecorativeSeparator />
          </section>
        )}

        {/* DOBRA 5: Áudio */}
        {hasAudio && audioUrl && (
          <section
            className={`py-6 ${
              isDarkTheme ? "bg-[#f5f0e8]/80" : "bg-slate-50/80"
            }`}
          >
            <div className="container mx-auto px-4 text-center space-y-8 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                <div>
                  <h3
                    className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${
                      isDarkTheme ? "text-slate-800" : "text-slate-900"
                    }`}
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    Escute esse áudio especial
                  </h3>
                  <p
                    className={`text-base md:text-lg italic ${
                      isDarkTheme ? "text-slate-600" : "text-slate-700"
                    }`}
                  >
                    Sua voz torna tudo mais real.
                  </p>
                </div>

                <div className="flex justify-center">
                  <div
                    className={`rounded-2xl p-6 shadow-xl ${
                      isDarkTheme
                        ? "bg-white/90 border-2 border-amber-200"
                        : "bg-white border-2 border-slate-200"
                    }`}
                  >
                    <audio
                      src={audioUrl}
                      controls
                      className="w-full"
                      style={{ minWidth: "280px" }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
            <DecorativeSeparator />
          </section>
        )}

        {/* DOBRA 6: Assinatura */}
        <section
          className={`py-6 ${isPreviewMode ? "pb-32" : "pb-16"} ${
            isDarkTheme ? "bg-[#f5f0e8]/80" : "bg-slate-50/80"
          }`}
        >
          <div className="container mx-auto px-4 text-center space-y-8 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              <h3
                className={`text-2xl md:text-3xl lg:text-4xl font-bold ${
                  isDarkTheme ? "text-slate-800" : "text-slate-900"
                }`}
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Feliz Natal e um Próspero Ano Novo!
              </h3>

              <p
                className={`text-lg md:text-xl italic ${getFontClass()} ${
                  isDarkTheme ? "text-slate-700" : "text-slate-800"
                }`}
              >
                Com carinho, de alguém que te ama muito.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Seção de QR Code - Modo Público */}
        {!isPreviewMode && data && (
          <section
            ref={qrCodeRef}
            className={`py-16 ${
              isDarkTheme ? "bg-[#f5f0e8]/80" : "bg-slate-50/80"
            }`}
          >
            <div className="container mx-auto px-4 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-10"
              >
                <h2
                  className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-3 ${
                    isDarkTheme ? "text-slate-800" : "text-slate-900"
                  }`}
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Gere o QR Code para compartilhar sua mensagem 🚀
                </h2>
                <p
                  className={`text-base md:text-lg ${
                    isDarkTheme ? "text-slate-600" : "text-slate-700"
                  }`}
                >
                  {isPaid
                    ? "Sua homenagem está liberada! Compartilhe com sua família."
                    : "Finalize o pagamento para desbloquear o acesso eterno."}
                </p>
              </motion.div>

              {!isPaid ? (
                /* ESTADO A: Bloqueado */
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-300 rounded-xl flex items-center justify-center blur-md">
                      <QrCode className="w-40 h-40 md:w-48 md:h-48 text-slate-400" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="bg-white rounded-full p-4 shadow-2xl border-4 border-amber-400"
                      >
                        <Lock className="w-10 h-10 md:w-12 md:h-12 text-amber-500" />
                      </motion.div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePayNow}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Pagar Agora - R$ 3,00
                  </motion.button>

                  {data.id && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckPayment}
                      disabled={isCheckingPayment}
                      className="w-full py-2 px-4 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-300 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCheckingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verificando pagamento...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Já paguei? Verificar agora
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                /* ESTADO B: Desbloqueado */
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="space-y-8"
                >
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                      className="bg-white rounded-xl p-4 shadow-2xl border-4 border-amber-400"
                    >
                      <QRCodeCanvas
                        value={`https://${shareUrl}`}
                        size={300}
                        level="H"
                        includeMargin={true}
                        ref={qrImageRef}
                        id="qr-code-canvas"
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex justify-center"
                  >
                    <Button
                      onClick={handleDownloadQR}
                      size="lg"
                      className="w-full md:w-auto px-8 py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 rounded-xl"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Baixar QR Code (Imagem)
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="space-y-3"
                  >
                    <label className="block text-sm font-semibold text-slate-700 text-center">
                      Seu link exclusivo:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={shareUrl}
                        className="flex-1 p-3 text-base border-2 border-slate-300 bg-white rounded-lg text-center font-mono"
                      />
                      <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        className="px-6 py-3 border-2 border-amber-400 hover:bg-amber-50 transition-colors"
                      >
                        {isLinkCopied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              <DecorativeSeparator />
            </div>
          </section>
        )}

        {/* Conteúdo Adicional (QR Code Preview) - apenas em preview mode */}
        {isPreviewMode && children && (
          <section
            className={`py-16 ${
              isDarkTheme ? "bg-[#f5f0e8]/80" : "bg-slate-50/80"
            }`}
          >
            {children}
          </section>
        )}

        {/* Rodapé "Feito com Natal Mágico" - apenas em modo público */}
        {!isPreviewMode && (
          <section className="py-8 border-t border-amber-200/30">
            <div className="container mx-auto px-4 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`text-sm md:text-base ${
                  isDarkTheme ? "text-amber-200/80" : "text-slate-600"
                }`}
              >
                Feito com{" "}
                <span className="font-semibold text-amber-500">
                  Natal Mágico
                </span>{" "}
                ✨
              </motion.p>
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}
