import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

// Inicializar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: "abc",
  },
})

const preference = new Preference(client)

export async function POST(request: NextRequest) {
  try {
    // Validar Access Token
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "MERCADO_PAGO_ACCESS_TOKEN não configurada" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { pageId, title, email, name } = body

    if (!pageId || !title || !email) {
      return NextResponse.json(
        { error: "Dados incompletos. Forneça pageId, title e email" },
        { status: 400 }
      )
    }

    // Obter URL base da variável de ambiente (obrigatória em produção)
    // Em desenvolvimento, usa localhost como fallback
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
    
    // Validar formato da URL
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BASE_URL deve ser uma URL válida (http:// ou https://)" },
        { status: 500 }
      )
    }

    // Criar preferência de pagamento
    const preferenceData = {
      items: [
        {
          title: `Homenagem Natal Mágico - ${title}`,
          quantity: 1,
          unit_price: 3.00,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: email,
        name: name || undefined, // Nome do pagador (opcional, mas recomendado)
      },
      external_reference: pageId, // ID da página no Supabase
      back_urls: {
        success: `${baseUrl}/checkout/success`,
        failure: `${baseUrl}/checkout/failure`,
        pending: `${baseUrl}/checkout/pending`,
      },
      auto_return: "approved" as const,
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" }, // Remove Boleto
        ],
        excluded_payment_methods: [
          { id: "pec" }, // Remove pagamento em lotérica (boa prática para digital)
        ],
        default_payment_method_id: "pix", // Sugere Pix como padrão
        installments: 1, // Limita parcelamento a 1x (valor baixo)
      },
      // notification_url: `${baseUrl}/api/webhook/mercadopago`, // Webhook opcional para atualizações automáticas
    } as any // Type assertion para contornar incompatibilidade de tipos do SDK

    const response = await preference.create({ body: preferenceData })

    if (!response.init_point) {
      return NextResponse.json(
        { error: "Não foi possível criar a preferência de pagamento" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      init_point: response.init_point,
      preference_id: response.id,
    })
  } catch (error) {
    console.error("Erro ao criar preferência:", error)
    
    return NextResponse.json(
      { 
        error: "Erro ao processar pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}

