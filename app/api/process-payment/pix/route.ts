import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

// Inicializar cliente do Mercado Pago
const getMercadoPagoClient = () => {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurada")
  }

  return new MercadoPagoConfig({
    accessToken: accessToken,
    options: {
      timeout: 10000, // 10 segundos de timeout
    },
  })
}

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
    // Validar Access Token
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { 
          error: "MERCADO_PAGO_ACCESS_TOKEN não configurada",
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

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { 
          error: "amount é obrigatório e deve ser um número positivo",
          message: "Valor do pagamento inválido"
        },
        { status: 400 }
      )
    }

    // Obter URL base da variável de ambiente
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
    
    // Validar formato da URL
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      return NextResponse.json(
        { 
          error: "NEXT_PUBLIC_BASE_URL deve ser uma URL válida (http:// ou https://)",
          message: "URL base inválida para notificação"
        },
        { status: 500 }
      )
    }

    // Construir URL de notificação
    const notificationUrl = `${baseUrl}/api/webhook/mercadopago`

    // Inicializar cliente e instância de Payment
    const client = getMercadoPagoClient()
    const payment = new Payment(client)

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

    // Criar pagamento Pix
    const paymentData = {
      transaction_amount: amount,
      payment_method_id: "pix",
      payer: payer,
      external_reference: pageId,
      notification_url: notificationUrl,
    }

    console.log("[process-payment/pix] Criando pagamento Pix:", {
      pageId,
      email,
      phone: phone || "não fornecido",
      phoneParsed: phoneData ? `${phoneData.area_code} ${phoneData.number}` : "não parseado",
      amount,
      notificationUrl,
    })

    const response = await payment.create({ body: paymentData })

    // Validar resposta
    if (!response || !response.id) {
      return NextResponse.json(
        { 
          error: "Não foi possível criar o pagamento",
          message: "Resposta inválida do Mercado Pago"
        },
        { status: 500 }
      )
    }

    // Extrair dados do QR Code Pix
    const pointOfInteraction = response.point_of_interaction
    const transactionData = pointOfInteraction?.transaction_data

    if (!transactionData) {
      return NextResponse.json(
        { 
          error: "Dados do QR Code não encontrados",
          message: "Resposta do pagamento não contém informações do Pix"
        },
        { status: 500 }
      )
    }

    const qrCode = transactionData.qr_code || null
    const qrCodeBase64 = transactionData.qr_code_base64 || null

    if (!qrCode) {
      return NextResponse.json(
        { 
          error: "QR Code não gerado",
          message: "Não foi possível gerar o código Pix"
        },
        { status: 500 }
      )
    }

    console.log("[process-payment/pix] Pagamento criado com sucesso:", {
      paymentId: response.id,
      pageId,
      hasQrCode: !!qrCode,
      hasQrCodeBase64: !!qrCodeBase64,
    })

    // Retornar resposta com sucesso
    return NextResponse.json({
      id: response.id,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
    })

  } catch (error) {
    console.error("[process-payment/pix] Erro ao processar pagamento Pix:", {
      error,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { 
        error: "Erro ao processar pagamento",
        message: error instanceof Error ? error.message : "Erro desconhecido ao criar pagamento Pix"
      },
      { status: 500 }
    )
  }
}

