"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 via-red-500 to-red-700 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce"
          style={{ animationDuration: "3s" }}
        >
          🎄
        </div>
        <div
          className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        >
          ❄️
        </div>
        <div
          className="absolute top-1/2 left-1/4 text-4xl opacity-20 animate-bounce"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        >
          ⭐
        </div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-9xl mb-4">🎁</div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 font-serif">
            Ops!
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-amber-300" />
            <p className="text-2xl md:text-3xl text-amber-100 font-serif">
              Esta homenagem não foi encontrada
            </p>
            <Sparkles className="w-8 h-8 text-amber-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border-2 border-white/20"
        >
          <p className="text-lg md:text-xl text-white/90 mb-4">
            Parece que esta página especial ainda não foi criada ou o link está
            incorreto.
          </p>
          <p className="text-base md:text-lg text-amber-100">
            Que tal criar sua própria homenagem de Natal?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Voltar para o Início
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 font-bold text-lg px-8 py-6 rounded-xl shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Gift className="w-5 h-5" />
              Criar Homenagem
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-white/60 text-sm">
            ✨ Que a magia do Natal esteja sempre com você ✨
          </p>
        </motion.div>
      </div>
    </div>
  );
}
