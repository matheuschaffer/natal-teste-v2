"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Gift, Sparkles, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCelebration } from "@/hooks/useCelebration"
import { toast } from "sonner"

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [pageSlug, setPageSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [externalReference, setExternalReference] = useState<string | null>(null)
  const { celebrate } = useCelebration()

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Ler query params do Mercado Pago
        const paymentId = searchParams.get("payment_id")
        const status = searchParams.get("status")
        const externalRef = searchParams.get("external_reference") // pageId

        if (!externalRef) {
          setError("Referência de pagamento não encontrada")
          setIsProcessing(false)
          return
        }

        setExternalReference(externalRef)

        // Chamar API para confirmar pagamento
        const response = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({
          pageId: externalRef,
          paymentId,
          status: status || "approved",
        }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
          throw new Error(errorData.error || "Erro ao confirmar pagamento")
        }

        const data = await response.json()
        
        if (data.success) {
          setPageSlug(data.slug)
          setIsConfirmed(true)
          celebrate("burst")
        } else {
          throw new Error("Pagamento não confirmado")
        }
      } catch (error) {
        console.error("Erro ao processar pagamento:", error)
        setError(error instanceof Error ? error.message : "Erro ao processar pagamento")
      } finally {
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [searchParams, celebrate])

  // Função para verificar pagamento manualmente
  const handleCheckPayment = async () => {
    if (!externalReference) {
      toast.error("Referência de pagamento não encontrada")
      return
    }

    setIsCheckingPayment(true)

    try {
      const response = await fetch("/api/check-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageId: externalReference }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao verificar pagamento")
      }

      if (data.status === "approved" && data.isPaid) {
        // Pagamento confirmado!
        toast.success("Pagamento confirmado! 🎉", {
          duration: 5000,
        })
        celebrate("burst")
        setIsConfirmed(true)
        
        // Buscar slug da página para redirecionar
        try {
          const slugResponse = await fetch(`/api/get-page-slug?pageId=${externalReference}`)
          if (slugResponse.ok) {
            const slugData = await slugResponse.json()
            if (slugData.slug) {
              setPageSlug(slugData.slug)
            }
          }
        } catch (err) {
          console.error("Erro ao buscar slug:", err)
          // Continuar mesmo sem o slug
        }
      } else {
        toast.info(data.message || "Pagamento ainda não foi confirmado. Tente novamente em alguns instantes.", {
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
      toast.error(
        error instanceof Error ? error.message : "Erro ao verificar pagamento. Tente novamente.",
        {
          duration: 4000,
        }
      )
    } finally {
      setIsCheckingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-500 via-green-500 to-emerald-600 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "3s" }}>
          🎄
        </div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
          🎁
        </div>
        <div className="absolute top-1/2 left-1/4 text-4xl opacity-20 animate-bounce" style={{ animationDuration: "5s", animationDelay: "2s" }}>
          ✨
        </div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {isProcessing ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border-2 border-white/20"
          >
            <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Confirmando seu pagamento...
            </h1>
            <p className="text-lg text-white/90 mb-6">
              Aguarde um momento enquanto processamos sua compra.
            </p>
            
            {/* Botão de Verificação Manual (quando está processando) */}
            {externalReference && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button
                  onClick={handleCheckPayment}
                  disabled={isCheckingPayment}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 font-medium"
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Verificar pagamento agora 🔄
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border-2 border-white/20"
          >
            <div className="text-6xl mb-6">😔</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ops! Algo deu errado
            </h1>
            <p className="text-lg text-white/90 mb-8">
              {error}
            </p>
            <Link href="/">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-lg px-8 py-6 rounded-xl shadow-xl"
              >
                Voltar para o Início
              </Button>
            </Link>
          </motion.div>
        ) : isConfirmed ? (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <Check className="w-12 h-12 text-emerald-600" />
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 font-serif">
                Pagamento Confirmado! 🎉
              </h1>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-8 h-8 text-amber-300" />
                <p className="text-2xl md:text-3xl text-amber-100 font-serif">
                  Sua homenagem está liberada!
                </p>
                <Sparkles className="w-8 h-8 text-amber-300" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border-2 border-white/20"
            >
              <p className="text-lg md:text-xl text-white/90 mb-4">
                Agora você pode compartilhar sua homenagem especial com sua família!
              </p>
              <p className="text-base md:text-lg text-amber-100">
                Acesse sua página e gere o QR Code para compartilhar.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {pageSlug ? (
                <Link href={`/${pageSlug}`}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    Ver Minha Homenagem
                  </Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    Voltar para o Início
                  </Button>
                </Link>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-12 text-center"
            >
              <p className="text-white/60 text-sm">
                ✨ Obrigado por escolher o Natal Mágico! ✨
              </p>
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-emerald-500 via-green-500 to-emerald-600 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}

