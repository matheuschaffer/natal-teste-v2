"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, QrCode, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

import { useCelebration } from "@/hooks/useCelebration"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: () => void
  pageId?: string | null
  pageTitle?: string
}

export function CheckoutModal({ isOpen, onClose, onPaymentSuccess, pageId, pageTitle }: CheckoutModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { celebrate } = useCelebration()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !email.trim()) {
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
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || "Erro ao salvar dados do cliente")
      }

      // 2. Depois, criar preferência de pagamento no Mercado Pago
      const response = await fetch("/api/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          title: pageTitle || "Homenagem Natal Mágico",
          email: email.trim(),
          name: name.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || "Erro ao criar pagamento")
      }

      const data = await response.json()
      
      if (!data.init_point) {
        throw new Error("URL de pagamento não retornada")
      }

      // Redirecionar para o Mercado Pago
      window.location.href = data.init_point
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      setIsProcessing(false)
      // Você pode adicionar um toast de erro aqui se quiser
      alert(error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] flex flex-col">
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

            {/* Botão de Pagamento */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-4"
            >
              <Button
                type="submit"
                disabled={isProcessing || !name.trim() || !email.trim()}
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
                    Finalizar Compra e Liberar - R$ 3,00
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
      </DialogContent>
    </Dialog>
  )
}

