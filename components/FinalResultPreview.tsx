"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontType } from "@/components/FontSelector";
import { ThemeType } from "@/components/ThemeSystem";
import { GalleryLayout, FrameStyle } from "@/components/PhotoUploader";
import { CheckoutModal } from "@/components/CheckoutModal";
import { motion } from "framer-motion";
import {
  Rocket,
  Sparkles,
  Lock,
  QrCode,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { useCelebration } from "@/hooks/useCelebration";
import { uploadFile } from "@/services/uploadService";
import { createPage } from "@/services/pageService";
import { toast } from "sonner";
import { HomenagemRenderer } from "@/components/HomenagemRenderer";
import { QRCodeCanvas } from "qrcode.react";

interface FinalResultPreviewProps {
  title: string;
  message: string;
  selectedFont: FontType | null;
  selectedTheme: ThemeType | null;
  galleryLayout: GalleryLayout;
  selectedFrame: FrameStyle;
  photos: Array<{ id: string; preview: string; file?: File }>;
  audioBlob?: Blob | null;
  hasAudio?: boolean;
  audioSkipped?: boolean;
  isPaid: boolean;
  onEdit: () => void;
  onPaymentSuccess: () => void;
}

export function FinalResultPreview({
  title,
  message,
  selectedFont,
  selectedTheme,
  galleryLayout,
  selectedFrame,
  photos,
  audioBlob,
  hasAudio = false,
  audioSkipped = false,
  isPaid,
  onEdit,
  onPaymentSuccess,
}: FinalResultPreviewProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPageId, setSavedPageId] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [savedAudioUrl, setSavedAudioUrl] = useState<string | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { celebrate } = useCelebration();

  const currentTheme = selectedTheme || "classic";
  const isDarkTheme = currentTheme === "classic";

  const qrImageRef = useRef<HTMLCanvasElement>(null);

  // Gerar URL única baseada no slug salvo ou título
  const generateUniqueUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")
      : typeof window !== "undefined"
      ? window.location.origin
      : "https://surpresadenatal.com";

    const domain = baseUrl.replace(/^https?:\/\//, "");

    if (savedSlug) {
      return `${domain}/${savedSlug}`;
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

  const shareUrl = generateUniqueUrl();

  // Efeito para revelar QR Code quando pagamento confirmado
  useEffect(() => {
    if (isPaid && !hasRevealed) {
      setHasRevealed(true);
      celebrate("burst");
      setTimeout(() => {
        qrCodeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
    }
  }, [isPaid, hasRevealed, celebrate]);

  // Função para copiar link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${shareUrl}`);
      setIsLinkCopied(true);
      toast.success("Link copiado! 🎉");
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast.error("Erro ao copiar link");
    }
  };

  // Função para baixar QR Code (placeholder)
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
      link.download = `qr-code-${savedSlug || "natal"}.png`;
      link.click();

      toast.success("QR Code baixado com sucesso! 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível baixar o QR Code.");
    }
  };

  // Função para verificar manualmente o status do pagamento
  const handleCheckPaymentStatus = async () => {
    if (!savedPageId) {
      toast.error("Erro: ID da página não encontrado. Tente salvar novamente.");
      return;
    }

    setIsCheckingPayment(true);

    try {
      const response = await fetch("/api/check-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageId: savedPageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Erro do servidor (400, 404, 500, etc.)
        const errorMessage =
          data.error || data.details || "Erro ao verificar pagamento";
        console.error("[Frontend] Erro na verificação de pagamento:", {
          status: response.status,
          error: errorMessage,
          pageId: savedPageId,
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

      // Verificar se o pagamento foi aprovado
      if (data.status === "approved" && data.isPaid) {
        toast.success("Pagamento confirmado! 🎉", {
          duration: 5000,
        });
        celebrate("burst");
        onPaymentSuccess();
        setHasRevealed(true);

        setTimeout(() => {
          qrCodeRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 500);
      } else {
        // Pagamento ainda não aprovado
        toast.info(
          data.message ||
            "Pagamento ainda não foi confirmado. Tente novamente em alguns instantes.",
          {
            duration: 4000,
          }
        );
      }
    } catch (error) {
      // Erro de rede ou parsing
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

  // Função para fazer upload e salvar antes de abrir checkout
  const handleSaveAndOpenCheckout = async () => {
    setIsSaving(true);

    try {
      // 1. Fazer upload das fotos
      const photoFiles = photos.filter((p) => p.file).map((p) => p.file!);
      let photoUrls: string[] = [];

      if (photoFiles.length > 0) {
        toast.loading("Enviando fotos...", { id: "upload-photos" });
        photoUrls = await Promise.all(
          photoFiles.map((file) => uploadFile(file, "photos"))
        );
        toast.success(`${photoFiles.length} foto(s) enviada(s)!`, {
          id: "upload-photos",
        });
      }

      // 2. Fazer upload do áudio (se houver)
      let audioUrl: string | null = null;
      if (hasAudio && audioBlob) {
        toast.loading("Enviando áudio...", { id: "upload-audio" });
        const audioFile = new File([audioBlob], "audio-recording.webm", {
          type: audioBlob.type || "audio/webm",
        });
        audioUrl = await uploadFile(audioFile, "audio");
        setSavedAudioUrl(audioUrl);
        toast.success("Áudio enviado!", { id: "upload-audio" });
      }

      // 3. Salvar dados no banco
      toast.loading("Salvando memórias...", { id: "save-page" });
      const pageResult = await createPage({
        title,
        message,
        selectedFont: selectedFont || null,
        selectedTheme: selectedTheme || null,
        galleryLayout,
        selectedFrame,
        photoUrls,
        audioUrl,
        hasAudio: hasAudio,
        audioSkipped: audioSkipped,
      });

      setSavedPageId(pageResult.id);
      setSavedSlug(pageResult.slug);
      toast.success("Homenagem salva com sucesso! 🎉", { id: "save-page" });

      // 4. Abrir modal de checkout
      setIsCheckoutOpen(true);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar. Tente novamente.", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Preparar fotos para o renderer (aceita objetos ou URLs)
  const photosForRenderer = photos.map((p) => ({
    id: p.id,
    preview: p.preview,
  }));

  // Preparar URL de áudio (prioriza savedAudioUrl se disponível)
  const audioUrlForRenderer =
    savedAudioUrl || (audioBlob ? URL.createObjectURL(audioBlob) : null);

  return (
    <>
      <HomenagemRenderer
        title={title}
        message={message}
        selectedFont={selectedFont}
        selectedTheme={selectedTheme}
        galleryLayout={galleryLayout}
        selectedFrame={selectedFrame}
        photos={photosForRenderer}
        audioUrl={audioUrlForRenderer}
        hasAudio={hasAudio}
        isPreviewMode={true}
        onEdit={onEdit}
      >
        {/* Seção de Compartilhamento (QR Code) */}
        <div ref={qrCodeRef} className="container mx-auto px-4 max-w-3xl">
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
              Finalize o pagamento para desbloquear o acesso eterno.
            </p>
          </motion.div>

          {!isPaid ? (
            /* ESTADO A: Bloqueado (Antes de Pagar) */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="relative flex items-center justify-center">
                {/* QR Code Borrado */}
                <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-300 rounded-xl flex items-center justify-center blur-md">
                  <QrCode className="w-40 h-40 md:w-48 md:h-48 text-slate-400" />
                </div>

                {/* Cadeado Pulsante */}
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
                whileHover={{ scale: isSaving ? 1 : 1.05 }}
                whileTap={{ scale: isSaving ? 1 : 0.95 }}
                onClick={handleSaveAndOpenCheckout}
                disabled={isSaving}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando memórias...
                  </>
                ) : (
                  "Desbloquear meu QR Code exclusivo"
                )}
              </motion.button>

              {/* Botão de Verificação Manual */}
              {savedPageId && (
                <motion.button
                  whileHover={{ scale: isCheckingPayment ? 1 : 1.02 }}
                  whileTap={{ scale: isCheckingPayment ? 1 : 0.98 }}
                  onClick={handleCheckPaymentStatus}
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
                      Já fiz o pagamento via Pix? Clique aqui.
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          ) : (
            /* ESTADO B: Desbloqueado (Sucesso/Pós-Pagamento) */
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* QR Code Nítido */}
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

              {/* Botão Download */}
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

              {/* Campo de URL com Copiar */}
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

          {/* Separador Gráfico Final */}
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-4 w-full max-w-md">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-amber-400/50" />
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-400/50 to-amber-400/50" />
            </div>
          </div>
        </div>
      </HomenagemRenderer>

      {/* Barra Fixa de Conversão (Sticky Footer) - Escondida se já pagou */}
      {!isPaid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="fixed bottom-0 left-0 right-0 w-full z-50"
        >
          <motion.button
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
            onClick={handleSaveAndOpenCheckout}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-emerald-600/90 to-green-600/90 backdrop-blur-md hover:from-emerald-700/90 hover:to-green-700/90 text-white font-medium text-sm md:text-base h-12 py-3 px-4 shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                Salvando memórias...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 md:w-5 md:h-5" />
                GERAR QR CODE E COMPARTILHAR 🚀
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={onPaymentSuccess}
        pageId={savedPageId}
        pageTitle={title}
      />
    </>
  );
}
