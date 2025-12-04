"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, QrCode, Sparkles, Copy, Check } from "lucide-react"
import { motion } from "framer-motion"

import { useCelebration } from "@/hooks/useCelebration"
import { trackInitiateCheckout, trackPurchase } from "@/lib/fbq"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: () => void
  pageId?: string | null
  pageTitle?: string
}

interface PixData {
  qr_code: string
  qr_code_base64: string
  id: string | number
}

// Função para formatar telefone (máscara simples)
const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "")
  
  // Aplica máscara: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
  }
}

export function CheckoutModal({ isOpen, onClose, onPaymentSuccess, pageId, pageTitle }: CheckoutModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"form" | "payment">("form")
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [amount] = useState(19.90) // Valor fixo do pagamento
  const { celebrate } = useCelebration()

  // Resetar estados quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setStep("form")
      setPixData(null)
      setName("")
      setEmail("")
      setPhone("")
      setCopied(false)
      setIsProcessing(false)
      setIsCheckingPayment(false)
    }
  }, [isOpen])

  // Disparar InitiateCheckout quando o modal entrar na etapa de pagamento (QR Code exibido)
  useEffect(() => {
    if (step === "payment" && pixData && pageId) {
      trackInitiateCheckout({
        value: amount,
        currency: "BRL",
        page_id: pageId,
      })
    }
  }, [step, pixData, pageId, amount])

  // Polling para verificar pagamento quando estiver na tela de pagamento
  useEffect(() => {
    if (step === "payment" && pixData && pageId) {
      console.log("[CheckoutModal] Iniciando polling de verificação de pagamento")
      
      const interval = setInterval(async () => {
        try {
          const resp = await fetch("/api/check-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ pageId }),
          })

          const json = await resp.json()

          if (!resp.ok) {
            console.error("[CheckoutModal] Erro ao verificar pagamento:", json)
            return
          }

          // Verificar se o pagamento foi aprovado
          if (json.paid) {
            console.log("[CheckoutModal] Pagamento aprovado! Parando polling e redirecionando")
            
            // Parar o intervalo
            clearInterval(interval)
            
            // Disparar evento Purchase antes de redirecionar
            trackPurchase({
              value: amount,
              currency: "BRL",
              transaction_id: json.paymentId || pageId || json.slug,
              page_id: pageId || json.slug,
            })
            
            // Mostrar feedback de sucesso (confetes)
            celebrate()
            
            // Redirecionar para a página personalizada
            const redirectSlug = json.slug
            if (redirectSlug) {
              setTimeout(() => {
                window.location.href = `/${redirectSlug}`
              }, 1500)
            } else {
              console.warn("[CheckoutModal] Pagamento aprovado mas slug não veio na resposta")
            }
          }
        } catch (error) {
          console.error("[CheckoutModal] Erro ao verificar pagamento:", error)
          // Não parar o polling em caso de erro, continuar tentando
        }
      }, 5000) // Verifica a cada 5 segundos

      // Cleanup: limpar intervalo quando o componente desmontar ou step mudar
      return () => {
        console.log("[CheckoutModal] Parando polling de verificação")
        clearInterval(interval)
      }
    }
  }, [step, pixData, pageId, celebrate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos obrigatórios
    if (!name.trim() || !email.trim() || !phone.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    if (!pageId) {
      console.error("PageId não disponível")
      return
    }

    setIsProcessing(true)
    
    try {
      // 1. Primeiro, atualizar os dados do cliente no Supabase
      const updateResponse = await fetch("/api/update-customer-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || "Erro ao salvar dados do cliente")
      }

      // 2. Criar pagamento Pix via API
      // Garantir que amount seja número (valor fixo: 19.90)
      const amount = 19.90

      const payload = {
        pageId,
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        amount: amount,
      }

      const response = await fetch("/api/process-payment/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const json = await response.json()

      if (!response.ok) {
        console.error("Erro detalhado ao processar pagamento:", json)
        const errorMessage =
          json?.detail?.message ||
          json?.detail?.error ||
          json?.error ||
          "ver console para mais detalhes"
        throw new Error(`Erro ao processar pagamento: ${errorMessage}`)
      }

      if (!json.id || !json.qr_code) {
        throw new Error("Dados do pagamento não retornados corretamente")
      }

      const data = json

      // Salvar dados do Pix e mudar para tela de pagamento
      setPixData({
        id: data.id,
        qr_code: data.qr_code,
        qr_code_base64: data.qr_code_base64 || "",
      })
      setStep("payment")
      setIsProcessing(false)
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      setIsProcessing(false)
      alert(error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente.")
    }
  }

  const handleCopyQrCode = async () => {
    if (!pixData?.qr_code) return

    try {
      await navigator.clipboard.writeText(pixData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
      // Fallback para navegadores antigos
      const textArea = document.createElement("textarea")
      textArea.value = pixData.qr_code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCheckPayment = async () => {
    if (!pageId) return

    setIsCheckingPayment(true)
    try {
      const resp = await fetch("/api/check-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageId }),
      })

      const json = await resp.json()

      if (!resp.ok) {
        console.error("Erro ao verificar pagamento:", json)
        alert("Erro ao verificar pagamento. Tente novamente.")
        setIsCheckingPayment(false)
        return
      }

      if (json.paid) {
        // Disparar evento Purchase antes de redirecionar
        trackPurchase({
          value: amount,
          currency: "BRL",
          transaction_id: json.paymentId || pageId || json.slug,
          page_id: pageId || json.slug,
        })

        // Se a API retornar slug, usa ele para redirecionar
        const redirectSlug = json.slug
        if (redirectSlug) {
          // Mostrar feedback de sucesso (confetes)
          celebrate()
          
          // Pequeno delay para garantir que os confetes apareçam
          setTimeout(() => {
            window.location.href = `/${redirectSlug}`
          }, 1500)
        } else {
          console.warn("Pagamento aprovado mas slug não veio na resposta.")
          setIsCheckingPayment(false)
        }
        return
      }

      // Caso ainda não esteja pago: apenas informa o usuário, sem fechar o modal
      console.log("Pagamento ainda não confirmado, tente novamente em alguns segundos.")
      setIsCheckingPayment(false)
      alert("Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.")
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
      setIsCheckingPayment(false)
      alert("Erro ao verificar pagamento. Tente novamente.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] flex flex-col">
        {step === "form" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-center text-slate-800">
                Quase lá! Finalize para liberar seu presente.
              </DialogTitle>
              <DialogDescription className="text-center text-slate-600 mt-2">
                Preencha seus dados para gerar o QR Code e compartilhar sua homenagem
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-10 space-y-6 overflow-y-auto flex-1">
              {/* Visual do Produto (QR Code Borrado com Cadeado) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border-2 border-slate-200"
              >
                {/* QR Code Borrado */}
                <div className="relative">
                  <div className="w-48 h-48 bg-slate-300 rounded-lg flex items-center justify-center blur-sm">
                    <QrCode className="w-32 h-32 text-slate-400" />
                  </div>
                  
                  {/* Cadeado Sobreposto */}
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
                      className="bg-white rounded-full p-4 shadow-xl border-2 border-amber-400"
                    >
                      <Lock className="w-8 h-8 text-amber-500" />
                    </motion.div>
                  </div>
                </div>

                {/* Texto Informativo */}
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    QR Code será liberado após o pagamento
                  </p>
                </div>
              </motion.div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                    Seu Nome Completo
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Maria Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-3 text-base border-2 border-slate-300 focus:border-amber-400 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Seu Melhor E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: maria@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 text-base border-2 border-slate-300 focus:border-amber-400 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                    Telefone/WhatsApp
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: (11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                    maxLength={15}
                    className="w-full p-3 text-base border-2 border-slate-300 focus:border-amber-400 rounded-lg"
                  />
                </div>

                {/* Botão de Pagamento */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-4"
                >
                  <Button
                    type="submit"
                    disabled={isProcessing || !name.trim() || !email.trim() || !phone.trim()}
                    className="w-full py-6 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-xl hover:shadow-amber-500/50 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        Processando...
                      </div>
                    ) : (
                      <>
                        Gerar QR Code Pix - R$ 19,90
                      </>
                    )}
                  </Button>
                  
                  <p className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Ambiente Seguro 🔒
                  </p>
                </motion.div>
              </form>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-center text-slate-800">
                Escaneie o QR Code Pix
              </DialogTitle>
              <DialogDescription className="text-center text-slate-600 mt-2">
                Use o app do seu banco para escanear e pagar
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-10 space-y-6 overflow-y-auto flex-1">
              {/* QR Code */}
              {pixData?.qr_code_base64 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border-2 border-slate-200"
                >
                  <img
                    src={`data:image/jpeg;base64,${pixData.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="mx-auto w-64 h-64 object-contain"
                  />
                </motion.div>
              )}

              {/* Copia e Cola */}
              {pixData?.qr_code && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Ou copie o código Pix:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={pixData.qr_code}
                      readOnly
                      className="flex-1 p-3 text-base border-2 border-slate-300 rounded-lg bg-slate-50 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleCopyQrCode}
                      className="px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 font-medium">Código copiado!</p>
                  )}
                </div>
              )}

              {/* Aviso */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 text-center">
                  <strong>Aguardando confirmação...</strong>
                  <br />
                  A tela atualizará automaticamente assim que você pagar no app do banco.
                </p>
              </div>

              {/* Botão de Emergência */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  onClick={handleCheckPayment}
                  disabled={isCheckingPayment}
                  className="w-full py-4 text-base font-semibold bg-slate-600 hover:bg-slate-700 text-white shadow-lg transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingPayment ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Verificando...
                    </div>
                  ) : (
                    "Já paguei (Verificar agora)"
                  )}
                </Button>
              </motion.div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

