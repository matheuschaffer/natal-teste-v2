import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { supabase } from "@/lib/supabase"

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
  const requestId = Math.random().toString(36).substring(2, 9)
  console.log(`[webhook-mercadopago:${requestId}] Webhook recebido do Mercado Pago`)

  try {
    // Validar Access Token
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      console.error(`[webhook-mercadopago:${requestId}] MERCADO_PAGO_ACCESS_TOKEN não configurada`)
      // Retornar 200 mesmo em erro para não fazer o MP repetir
      return NextResponse.json({}, { status: 200 })
    }

    // Parse do body da requisição
    let body: any
    try {
      body = await request.json()
      console.log(`[webhook-mercadopago:${requestId}] Body recebido:`, {
        type: body.type || body.action || body.topic || "não informado",
        hasData: !!body.data,
        dataId: body.data?.id || "não informado",
      })
    } catch (error) {
      console.error(`[webhook-mercadopago:${requestId}] Erro ao parsear body:`, error)
      // Retornar 200 para não fazer o MP repetir requisições inválidas
      return NextResponse.json({}, { status: 200 })
    }

    // Extrair type/topic e data.id
    // O Mercado Pago pode enviar de diferentes formas:
    // - body.type ou body.action ou body.topic
    // - body.data.id (ID do pagamento)
    // - Ou via query params: ?type=payment&data.id=123
    const type = body.type || body.action || body.topic || request.nextUrl.searchParams.get("type")
    const paymentId = body.data?.id || request.nextUrl.searchParams.get("data.id") || request.nextUrl.searchParams.get("data_id")

    console.log(`[webhook-mercadopago:${requestId}] Dados extraídos:`, {
      type,
      paymentId,
    })

    // Verificar se é um evento relacionado a pagamento
    if (!type || !type.includes("payment")) {
      console.log(`[webhook-mercadopago:${requestId}] Evento não relacionado a pagamento, ignorando:`, type)
      return NextResponse.json({}, { status: 200 })
    }

    // Validar se temos o ID do pagamento
    if (!paymentId) {
      console.warn(`[webhook-mercadopago:${requestId}] ID do pagamento não encontrado no webhook`)
      return NextResponse.json({}, { status: 200 })
    }

    // SEGURANÇA: Não confiar apenas no JSON recebido
    // Consultar a API do Mercado Pago para confirmar o status real
    const client = getMercadoPagoClient()
    const payment = new Payment(client)

    let paymentData
    try {
      console.log(`[webhook-mercadopago:${requestId}] Consultando pagamento na API do Mercado Pago:`, paymentId)
      paymentData = await payment.get({ id: paymentId.toString() })
      
      console.log(`[webhook-mercadopago:${requestId}] Dados do pagamento consultados:`, {
        paymentId: paymentData.id,
        status: paymentData.status,
        external_reference: paymentData.external_reference,
      })
    } catch (error) {
      console.error(`[webhook-mercadopago:${requestId}] Erro ao consultar pagamento no Mercado Pago:`, {
        error: error instanceof Error ? error.message : String(error),
        paymentId,
      })
      // Retornar 200 para não fazer o MP repetir
      return NextResponse.json({}, { status: 200 })
    }

    // Verificar se o pagamento foi aprovado
    if (paymentData.status !== "approved" && paymentData.status !== "authorized") {
      console.log(`[webhook-mercadopago:${requestId}] Pagamento não aprovado, status:`, paymentData.status)
      return NextResponse.json({}, { status: 200 })
    }

    // Extrair external_reference (que é o pageId)
    const pageId = paymentData.external_reference

    if (!pageId || typeof pageId !== "string") {
      console.warn(`[webhook-mercadopago:${requestId}] external_reference não encontrado ou inválido:`, pageId)
      return NextResponse.json({}, { status: 200 })
    }

    console.log(`[webhook-mercadopago:${requestId}] Pagamento aprovado! Atualizando página:`, {
      paymentId: paymentData.id,
      pageId,
      status: paymentData.status,
    })

    // Verificar se a página já está paga (evitar atualizações desnecessárias)
    const { data: existingPage, error: checkError } = await supabase
      .from("pages")
      .select("id, is_paid")
      .eq("id", pageId)
      .single()

    if (checkError) {
      console.error(`[webhook-mercadopago:${requestId}] Erro ao verificar página no Supabase:`, {
        error: checkError,
        pageId,
      })
      return NextResponse.json({}, { status: 200 })
    }

    if (!existingPage) {
      console.warn(`[webhook-mercadopago:${requestId}] Página não encontrada no Supabase:`, pageId)
      return NextResponse.json({}, { status: 200 })
    }

    // Se já está paga, não precisa atualizar novamente
    if (existingPage.is_paid) {
      console.log(`[webhook-mercadopago:${requestId}] Página já está paga, ignorando atualização`)
      return NextResponse.json({}, { status: 200 })
    }

    // Atualizar página no Supabase
    const paidAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("pages")
      .update({
        is_paid: true,
        payment_id: paymentData.id?.toString() || null,
        payment_status: paymentData.status || "approved",
        paid_at: paidAt,
      })
      .eq("id", pageId)

    if (updateError) {
      console.error(`[webhook-mercadopago:${requestId}] Erro ao atualizar página no Supabase:`, {
        error: updateError,
        pageId,
        paymentId: paymentData.id,
      })
      return NextResponse.json({}, { status: 200 })
    }

    console.log(`[webhook-mercadopago:${requestId}] Página atualizada com sucesso!`, {
      pageId,
      paymentId: paymentData.id,
      status: paymentData.status,
    })

    // Sempre retornar 200 para o Mercado Pago saber que recebemos
    return NextResponse.json({}, { status: 200 })

  } catch (error) {
    // Erro genérico não capturado
    console.error(`[webhook-mercadopago:${requestId}] Erro inesperado no webhook:`, {
      error,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
    })

    // IMPORTANTE: Sempre retornar 200 para não fazer o Mercado Pago repetir a requisição
    return NextResponse.json({}, { status: 200 })
  }
}

