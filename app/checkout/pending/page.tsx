"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, Home, Sparkles, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

function CheckoutPendingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const externalReference = searchParams.get("external_reference")

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
        // Pagamento confirmado! Redirecionar para success
        toast.success("Pagamento confirmado! 🎉", {
          duration: 5000,
        })
        // Redirecionar para a página de sucesso
        router.push(`/checkout/success?payment_id=${data.paymentStatus}&status=approved&external_reference=${externalReference}`)
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
    <div className="min-h-screen bg-gradient-to-b from-amber-600 via-yellow-500 to-amber-700 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "3s" }}>
          🎄
        </div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
          ⏳
        </div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border-2 border-white/20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Clock className="w-12 h-12 text-amber-600" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">
            Pagamento em Análise
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-amber-200" />
            <p className="text-lg md:text-xl text-white/90">
              Estamos processando seu pagamento
            </p>
            <Sparkles className="w-6 h-6 text-amber-200" />
          </div>

          <p className="text-base md:text-lg text-amber-100 mb-8">
            Você receberá um e-mail assim que o pagamento for confirmado. 
            Isso pode levar alguns minutos.
          </p>

          <div className="flex flex-col gap-4 items-center">
            {/* Botão de Verificação Manual */}
            {externalReference && (
              <Button
                onClick={handleCheckPayment}
                disabled={isCheckingPayment}
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 font-medium px-6 py-3 rounded-xl flex items-center gap-2"
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Verificar pagamento agora 🔄
                  </>
                )}
              </Button>
            )}

            <Link href="/">
              <Button
                size="lg"
                className="bg-white text-amber-600 hover:bg-amber-50 font-bold text-lg px-8 py-6 rounded-xl shadow-xl flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                Voltar para o Início
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function CheckoutPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-amber-600 via-yellow-500 to-amber-700 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        </div>
      }
    >
      <CheckoutPendingContent />
    </Suspense>
  )
}

