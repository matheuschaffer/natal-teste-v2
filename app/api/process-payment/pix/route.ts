import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { supabase } from "@/lib/supabase"

// Função para extrair DDD e número do telefone formatado
// Aceita formatos como: (11) 98765-4321, (11) 8765-4321, 11987654321, etc.
const parsePhone = (phone: string): { area_code: string; number: string } | null => {
  if (!phone || typeof phone !== "string") {
    return null
  }

  try {
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, "")

    // Valida se tem pelo menos 10 dígitos (DDD + número mínimo)
    if (numbers.length < 10 || numbers.length > 11) {
      return null
    }

    // Extrai DDD (2 primeiros dígitos) e número (restante)
    const areaCode = numbers.substring(0, 2)
    const number = numbers.substring(2)

    // Valida DDD (deve estar entre 11 e 99)
    const dddNum = parseInt(areaCode, 10)
    if (dddNum < 11 || dddNum > 99) {
      return null
    }

    // Valida número (deve ter 8 ou 9 dígitos)
    if (number.length < 8 || number.length > 9) {
      return null
    }

    return {
      area_code: areaCode,
      number: number,
    }
  } catch (error) {
    console.warn("[process-payment/pix] Erro ao parsear telefone:", phone, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Gerar chave de idempotência única
    const idempotencyKey = randomUUID()

    // Validar Access Token
    const accessToken = process.env.MP_ACCESS_TOKEN

    if (!accessToken) {
      console.error("MP_ACCESS_TOKEN não configurada")
      return NextResponse.json(
        { 
          error: "Configuração do servidor ausente",
          message: "Token de acesso do Mercado Pago não encontrado"
        },
        { status: 500 }
      )
    }

    // Parse do body da requisição
    const body = await request.json()
    const { pageId, email, name, phone, amount } = body

    // Validação dos campos obrigatórios
    if (!pageId || typeof pageId !== "string" || pageId.trim() === "") {
      return NextResponse.json(
        { 
          error: "pageId é obrigatório",
          message: "ID da página não fornecido"
        },
        { status: 400 }
      )
    }

    if (!email || typeof email !== "string" || email.trim() === "") {
      return NextResponse.json(
        { 
          error: "email é obrigatório",
          message: "Email do pagador não fornecido"
        },
        { status: 400 }
      )
    }

    // Garantir que amount seja número
    // Se amount não for fornecido ou inválido, usar valor padrão de 19.90
    let numericAmount: number
    if (amount && typeof amount === "number" && !isNaN(amount) && amount > 0) {
      numericAmount = amount
    } else if (amount && typeof amount === "string") {
      const parsed = Number(amount)
      numericAmount = (!isNaN(parsed) && parsed > 0) ? parsed : 19.90
    } else {
      // Valor padrão: 19.90
      numericAmount = 19.90
    }
    
    // Garantir que o valor seja exatamente 19.90 (correção de segurança)
    if (numericAmount !== 19.90) {
      console.warn(`[process-payment/pix] Valor recebido (${numericAmount}) diferente do esperado (19.90). Corrigindo para 19.90.`)
      numericAmount = 19.90
    }

    // Obter URL de notificação
    const notificationUrl = process.env.MP_WEBHOOK_URL

    // Parsear telefone se fornecido
    let phoneData = null
    if (phone) {
      phoneData = parsePhone(phone)
      if (!phoneData) {
        console.warn("[process-payment/pix] Telefone fornecido mas não pôde ser parseado:", phone)
      }
    }

    // Criar objeto payer
    const payer: any = {
      email: email.trim(),
      first_name: name?.trim() || email.split("@")[0], // Usa nome ou parte do email
    }

    // Adicionar telefone ao payer se foi parseado com sucesso
    if (phoneData) {
      payer.phone = {
        area_code: phoneData.area_code,
        number: phoneData.number,
      }
    }

    // Criar payload para o Mercado Pago
    const paymentPayload = {
      transaction_amount: numericAmount,
      description: "Página de Natal personalizada",
      payment_method_id: "pix",
      notification_url: notificationUrl,
      external_reference: pageId,
      payer: payer,
    }

    console.log("[process-payment/pix] Criando pagamento Pix:", {
      pageId,
      email,
      phone: phone || "não fornecido",
      phoneParsed: phoneData ? `${phoneData.area_code} ${phoneData.number}` : "não parseado",
      amount: numericAmount,
      notificationUrl,
    })

    // Fazer requisição direta à API do Mercado Pago
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    })

    const mpData = await mpRes.json()

    // Verificar se houve erro na resposta do Mercado Pago
    if (!mpRes.ok) {
      console.error(
        "[process-payment/pix] Erro ao processar pagamento Pix:",
        JSON.stringify(mpData, null, 2)
      )
      return NextResponse.json(
        {
          error: "Erro ao processar pagamento Pix",
          detail: mpData,
        },
        { status: 500 }
      )
    }

    // Extrair dados do QR Code Pix
    const pointOfInteraction = mpData.point_of_interaction
    const transactionData = pointOfInteraction?.transaction_data

    if (!transactionData) {
      console.error("[process-payment/pix] Dados do QR Code não encontrados na resposta:", mpData)
      return NextResponse.json(
        { 
          error: "Dados do QR Code não encontrados",
          message: "Resposta do pagamento não contém informações do Pix",
          detail: mpData,
        },
        { status: 500 }
      )
    }

    const qrCode = transactionData.qr_code || null
    const qrCodeBase64 = transactionData.qr_code_base64 || null

    if (!qrCode) {
      console.error("[process-payment/pix] QR Code não gerado na resposta:", mpData)
      return NextResponse.json(
        { 
          error: "QR Code não gerado",
          message: "Não foi possível gerar o código Pix",
          detail: mpData,
        },
        { status: 500 }
      )
    }

    console.log("[process-payment/pix] Pagamento criado com sucesso:", {
      paymentId: mpData.id,
      pageId,
      hasQrCode: !!qrCode,
      hasQrCodeBase64: !!qrCodeBase64,
    })

    // Salvar payment_id no Supabase
    const paymentId = mpData.id
    const { data: updatedPages, error: supabaseError } = await supabase
      .from("pages")
      .update({
        payment_id: String(paymentId),
        payment_status: "pending",
        is_paid: false,
      })
      .eq("id", pageId)
      .select("id, slug, payment_id, payment_status, is_paid")
      .limit(1)

    if (supabaseError) {
      console.error("[process-payment/pix] Erro ao atualizar página com payment_id:", supabaseError, { pageId, paymentId })
      return NextResponse.json(
        {
          error: "Erro ao salvar informações de pagamento da página",
          detail: supabaseError,
        },
        { status: 500 }
      )
    }

    const updatedPage = updatedPages?.[0]
    console.log("[process-payment/pix] Página atualizada com payment_id:", { pageId, paymentId, updatedPage })

    // Retornar resposta com sucesso
    return NextResponse.json({
      id: mpData.id,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
    })

  } catch (error) {
    console.error("[process-payment/pix] Erro inesperado ao processar pagamento Pix:", {
      error,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { 
        error: "Erro ao processar pagamento",
        message: error instanceof Error ? error.message : "Erro desconhecido ao criar pagamento Pix",
        detail: error instanceof Error ? { message: error.message } : error,
      },
      { status: 500 }
    )
  }
}

