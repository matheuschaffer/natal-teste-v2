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
    const { pageId, email, name, amount } = body

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

    // Criar pagamento Pix
    const paymentData = {
      transaction_amount: amount,
      payment_method_id: "pix",
      payer: {
        email: email.trim(),
        first_name: name?.trim() || email.split("@")[0], // Usa nome ou parte do email
      },
      external_reference: pageId,
      notification_url: notificationUrl,
    }

    console.log("[process-payment/pix] Criando pagamento Pix:", {
      pageId,
      email,
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

