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
          status: "error",
          error: "Configuração do servidor ausente",
          message: "Token de acesso do Mercado Pago não encontrado"
        },
        { status: 500 }
      )
    }

    // 2. Validar body da requisição
    let body: { pageId?: string }
    try {
      body = await request.json()
      console.log(`[check-payment:${requestId}] Body recebido:`, {
        hasPageId: !!body.pageId,
        pageIdLength: body.pageId?.length || 0,
      })
    } catch (error) {
      console.error(`[check-payment:${requestId}] Erro ao parsear body:`, error)
      return NextResponse.json(
        { 
          status: "error",
          error: "Body da requisição inválido",
          message: "Não foi possível processar os dados da requisição"
        },
        { status: 400 }
      )
    }

    const { pageId } = body

    if (!pageId || typeof pageId !== "string" || pageId.trim() === "") {
      console.error(`[check-payment:${requestId}] pageId inválido:`, pageId)
      return NextResponse.json(
        { 
          status: "error",
          error: "pageId é obrigatório e deve ser uma string não vazia",
          message: "ID da página não fornecido"
        },
        { status: 400 }
      )
    }

    console.log(`[check-payment:${requestId}] Buscando página no Supabase:`, pageId)

    // 3. Verificar se a página existe e já está paga
    const { data: pageData, error: pageError } = await supabase
      .from("pages")
      .select("id, is_paid, payment_id")
      .eq("id", pageId)
      .single()

    if (pageError) {
      console.error(`[check-payment:${requestId}] Erro ao buscar página no Supabase:`, {
        error: pageError,
        code: pageError.code,
        message: pageError.message,
        pageId,
      })
      
      // Se for erro de "não encontrado", retornar 404
      if (pageError.code === "PGRST116") {
        return NextResponse.json(
          { 
            status: "error",
            error: "Página não encontrada",
            message: "A página solicitada não existe no banco de dados"
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          status: "error",
          error: "Erro ao buscar página no banco de dados",
          message: pageError.message
        },
        { status: 500 }
      )
    }

    if (!pageData) {
      console.error(`[check-payment:${requestId}] Página não encontrada:`, pageId)
      return NextResponse.json(
        { 
          status: "error",
          error: "Página não encontrada",
          message: "A página solicitada não existe"
        },
        { status: 404 }
      )
    }

    console.log(`[check-payment:${requestId}] Página encontrada:`, {
      id: pageData.id,
      is_paid: pageData.is_paid,
      payment_id: pageData.payment_id,
    })

    // Se já está paga, retornar sucesso imediatamente
    if (pageData.is_paid) {
      console.log(`[check-payment:${requestId}] Página já está paga, retornando sucesso imediato`)
      return NextResponse.json({
        status: "approved",
        message: "Pagamento já confirmado",
        isPaid: true,
      })
    }

    // 4. Buscar pagamentos no Mercado Pago usando API REST
    let searchResults
    try {
      console.log(`[check-payment:${requestId}] Buscando pagamentos no Mercado Pago para pageId:`, pageId)
      
      const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${pageId}&sort=date_created&criteria=desc&limit=50`
      
      const searchResponse = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error(`[check-payment:${requestId}] Erro na busca de pagamentos:`, errorText)
        throw new Error(`Erro ao buscar pagamentos: ${searchResponse.status}`)
      }

      searchResults = await searchResponse.json()

      console.log(`[check-payment:${requestId}] Resultados da busca no Mercado Pago:`, {
        total: searchResults.results?.length || 0,
        pageId,
        hasResults: !!(searchResults.results && searchResults.results.length > 0),
      })
      
      if (searchResults.results && searchResults.results.length > 0) {
        console.log(`[check-payment:${requestId}] Primeiros 3 resultados:`, 
          searchResults.results.slice(0, 3).map(r => ({
            id: r.id,
            status: r.status,
            external_reference: r.external_reference,
          }))
        )
      }
    } catch (mpError: unknown) {
      const errorMessage = mpError instanceof Error ? mpError.message : "Erro desconhecido na API do Mercado Pago"
      const errorStatus = (mpError as any)?.status
      
      console.error(`[check-payment:${requestId}] Erro ao buscar pagamentos no Mercado Pago:`, {
        error: mpError,
        message: errorMessage,
        status: errorStatus,
        pageId,
        errorType: mpError instanceof Error ? mpError.constructor.name : typeof mpError,
      })
      
      // Não derrubar a rota, retornar erro estruturado
      return NextResponse.json(
        {
          status: "error",
          error: "Erro ao consultar pagamento no Mercado Pago",
          message: errorMessage,
        },
        { status: 500 }
      )
    }

    // 5. Validar se encontrou resultados
    if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
      console.log(`[check-payment:${requestId}] Nenhum pagamento encontrado para pageId:`, pageId)
      return NextResponse.json({
        status: "pending",
        message: "Nenhum pagamento encontrado para esta página",
        isPaid: false,
      })
    }

    // 6. Iterar sobre os resultados e procurar pelo menos um pagamento aprovado
    let approvedPayment = null
    
    console.log(`[check-payment:${requestId}] Iterando sobre ${searchResults.results.length} resultados`)
    
    for (const paymentResult of searchResults.results) {
      // Verificar se o status é aprovado ou autorizado
      if (paymentResult.status === "approved" || paymentResult.status === "authorized") {
        approvedPayment = paymentResult
        console.log(`[check-payment:${requestId}] Pagamento aprovado encontrado:`, {
          paymentId: paymentResult.id,
          status: paymentResult.status,
          pageId,
          external_reference: paymentResult.external_reference,
        })
        break // Encontrou um aprovado, pode parar
      }
    }

    // 7. Se encontrou pagamento aprovado, atualizar no Supabase
    if (approvedPayment) {
      const paidAt = new Date().toISOString()
      
      console.log(`[check-payment:${requestId}] Atualizando página no Supabase:`, {
        pageId,
        paymentId: approvedPayment.id,
        status: approvedPayment.status,
      })
      
      const { error: updateError } = await supabase
        .from("pages")
        .update({
          is_paid: true,
          payment_id: approvedPayment.id?.toString() || null,
          payment_status: approvedPayment.status || "approved",
          paid_at: paidAt,
        })
        .eq("id", pageId)

      if (updateError) {
        console.error(`[check-payment:${requestId}] Erro ao atualizar página no Supabase:`, {
          error: updateError,
          pageId,
          paymentId: approvedPayment.id,
          errorCode: updateError.code,
          errorMessage: updateError.message,
        })
        
        return NextResponse.json(
          {
            status: "error",
            error: "Erro ao atualizar status de pagamento no banco de dados",
            message: updateError.message,
          },
          { status: 500 }
        )
      }

      console.log(`[check-payment:${requestId}] Página atualizada com sucesso:`, {
        pageId,
        paymentId: approvedPayment.id,
        status: approvedPayment.status,
      })

      return NextResponse.json({
        status: "approved",
        message: "Pagamento confirmado com sucesso!",
        isPaid: true,
        paymentStatus: approvedPayment.status,
        paymentId: approvedPayment.id,
      })
    }

    // 8. Se não encontrou pagamento aprovado, retornar status pending
    const latestPayment = searchResults.results[0] // Pegar o mais recente
    console.log(`[check-payment:${requestId}] Pagamento encontrado mas não aprovado:`, {
      paymentId: latestPayment.id,
      status: latestPayment.status,
      pageId,
    })

    return NextResponse.json({
      status: "pending",
      message: `Pagamento encontrado, mas status é: ${latestPayment.status}`,
      isPaid: false,
      paymentStatus: latestPayment.status,
    })

  } catch (error) {
    // Erro genérico não capturado
    console.error(`[check-payment:${requestId}] Erro inesperado:`, {
      error,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    })

    return NextResponse.json(
      {
        status: "error",
        error: "Erro interno ao verificar pagamento",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
