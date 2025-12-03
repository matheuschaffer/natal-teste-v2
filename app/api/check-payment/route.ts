import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 9)
  console.log(`[check-payment:${requestId}] Iniciando verificação de pagamento`)

  try {
    // Validar Access Token
    const accessToken = process.env.MP_ACCESS_TOKEN

    if (!accessToken) {
      console.error("MP_ACCESS_TOKEN não configurada")
      return NextResponse.json(
        { 
          success: false,
          error: "Configuração do servidor ausente",
          message: "Token de acesso do Mercado Pago não encontrado"
        },
        { status: 500 }
      )
    }

    // 2. Validar body da requisição
    let body: { pageId?: string; slug?: string; paymentId?: string }
    try {
      body = await request.json()
      console.log(`[check-payment:${requestId}] Body recebido:`, {
        hasPageId: !!body.pageId,
        hasSlug: !!body.slug,
        hasPaymentId: !!body.paymentId,
      })
    } catch (error) {
      console.error(`[check-payment:${requestId}] Erro ao parsear body:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: "Body da requisição inválido",
          message: "Não foi possível processar os dados da requisição"
        },
        { status: 400 }
      )
    }

    const { pageId, slug } = body

    // Validar que temos pelo menos pageId ou slug
    if ((!pageId || typeof pageId !== "string" || pageId.trim() === "") &&
        (!slug || typeof slug !== "string" || slug.trim() === "")) {
      console.error(`[check-payment:${requestId}] pageId ou slug inválido:`, { pageId, slug })
      return NextResponse.json(
        { 
          success: false,
          error: "pageId ou slug é obrigatório",
          message: "Identificador da página não fornecido"
        },
        { status: 400 }
      )
    }

    console.log(`[check-payment:${requestId}] Buscando página no Supabase:`, { pageId, slug })

    // 3. Buscar página no Supabase (por pageId ou slug)
    let query = supabase
      .from("pages")
      .select("id, slug, is_paid, payment_id, payment_status")
    
    if (pageId) {
      query = query.eq("id", pageId)
    } else if (slug) {
      query = query.eq("slug", slug)
    }
    
    const { data: pageData, error: pageError } = await query.single()

    if (pageError || !pageData) {
      console.error(`[check-payment:${requestId}] Erro ao buscar página no Supabase:`, {
        error: pageError,
        pageId,
        slug,
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: "Página não encontrada",
          message: "A página solicitada não existe no banco de dados"
        },
        { status: 404 }
      )
    }

    console.log(`[check-payment:${requestId}] Página encontrada:`, {
      id: pageData.id,
      slug: pageData.slug,
      is_paid: pageData.is_paid,
      payment_status: pageData.payment_status,
      payment_id: pageData.payment_id,
    })

    // Se já está paga ou tem status approved, retornar sucesso imediatamente
    if (pageData.is_paid || pageData.payment_status === "approved") {
      console.log(`[check-payment:${requestId}] Página já está paga, retornando sucesso imediato`)
      return NextResponse.json({
        success: true,
        paid: true,
        slug: pageData.slug,
      })
    }

    // 4. Se não estiver paga, consultar Mercado Pago usando payment_id
    if (!pageData.payment_id) {
      console.log(`[check-payment:${requestId}] Página não tem payment_id, pagamento ainda não foi criado`)
      return NextResponse.json({
        success: true,
        paid: false,
      })
    }

    // Consultar pagamento no Mercado Pago usando payment_id
    try {
      console.log(`[check-payment:${requestId}] Consultando pagamento no Mercado Pago:`, pageData.payment_id)
      
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${pageData.payment_id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!mpRes.ok) {
        const errorText = await mpRes.text()
        console.error(`[check-payment:${requestId}] Erro ao consultar pagamento:`, errorText)
        // Não tratar como erro fatal, apenas retornar que não está pago
        return NextResponse.json({
          success: true,
          paid: false,
        })
      }

      const paymentData = await mpRes.json()

      console.log(`[check-payment:${requestId}] Status do pagamento:`, {
        paymentId: paymentData.id,
        status: paymentData.status,
      })

      // Se o pagamento foi aprovado, atualizar no Supabase
      if (paymentData.status === "approved") {
        const paidAt = new Date().toISOString()
        
        console.log(`[check-payment:${requestId}] Pagamento aprovado! Atualizando página no Supabase`)
        
        const { error: updateError } = await supabase
          .from("pages")
          .update({
            is_paid: true,
            payment_status: "approved",
            paid_at: paidAt,
          })
          .eq("id", pageData.id)

        if (updateError) {
          console.error(`[check-payment:${requestId}] Erro ao atualizar página no Supabase:`, updateError)
          // Mesmo com erro de atualização, retornar que está pago pois o Mercado Pago confirmou
          return NextResponse.json({
            success: true,
            paid: true,
            slug: pageData.slug,
          })
        }

        return NextResponse.json({
          success: true,
          paid: true,
          slug: pageData.slug,
        })
      }

      // Se não for approved, retornar que ainda não está pago
      console.log(`[check-payment:${requestId}] Pagamento ainda não aprovado, status:`, paymentData.status)
      return NextResponse.json({
        success: true,
        paid: false,
      })

    } catch (mpError: unknown) {
      const errorMessage = mpError instanceof Error ? mpError.message : "Erro desconhecido"
      
      console.error(`[check-payment:${requestId}] Erro ao consultar Mercado Pago:`, {
        error: mpError,
        message: errorMessage,
      })
      
      // Não tratar como erro fatal, apenas retornar que não está pago
      return NextResponse.json({
        success: true,
        paid: false,
      })
    }

  } catch (error) {
    // Erro genérico não capturado - só retornar 500 em caso de erro real de configuração
    console.error(`[check-payment:${requestId}] Erro inesperado:`, {
      error,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao verificar pagamento",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
