"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CheckoutFailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 via-red-500 to-red-700 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "3s" }}>
          🎄
        </div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
          ❄️
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
            <AlertCircle className="w-12 h-12 text-red-600" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">
            Pagamento não processado
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Não foi possível processar seu pagamento. Isso pode ter acontecido por vários motivos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-white text-red-600 hover:bg-red-50 font-bold text-lg px-8 py-6 rounded-xl shadow-xl flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                Voltar para o Início
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 font-bold text-lg px-8 py-6 rounded-xl shadow-xl flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Tentar Novamente
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

