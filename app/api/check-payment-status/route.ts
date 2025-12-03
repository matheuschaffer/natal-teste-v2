import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Validar Access Token
    const accessToken = process.env.MP_ACCESS_TOKEN

    if (!accessToken) {
      console.error("MP_ACCESS_TOKEN não configurada")
      return NextResponse.json(
        { error: "Configuração do servidor ausente" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { pageId } = body

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId é obrigatório" },
        { status: 400 }
      )
    }

    // 1. Buscar a página no banco para verificar se já está paga
    const { data: pageData, error: pageError } = await supabase
      .from("pages")
      .select("id, is_paid, payment_id")
      .eq("id", pageId)
      .single()

    if (pageError) {
      console.error("Erro ao buscar página:", pageError)
      return NextResponse.json(
        { error: "Página não encontrada" },
        { status: 404 }
      )
    }

    if (!pageData) {
      return NextResponse.json(
        { error: "Página não encontrada" },
        { status: 404 }
      )
    }

    // Se já está paga, retornar sucesso imediatamente
    if (pageData.is_paid) {
      return NextResponse.json({
        success: true,
        message: "Pagamento já confirmado",
        isPaid: true,
      })
    }

    // 2. Buscar pagamentos no Mercado Pago usando external_reference (pageId)
    // O Mercado Pago permite buscar por external_reference
    try {
      // Buscar pagamentos usando a API de busca
      // Nota: A API do Mercado Pago não tem um método direto de busca por external_reference
      // Vamos usar uma abordagem alternativa: buscar pagamentos recentes e filtrar
      // Ou, se tivermos o payment_id salvo, buscar diretamente por ele
      
      if (pageData.payment_id) {
        // Se temos o payment_id, buscar diretamente
        const paymentId = pageData.payment_id.toString()
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!mpRes.ok) {
          const errorText = await mpRes.text()
          console.error("Erro ao buscar pagamento:", errorText)
          throw new Error(`Erro ao buscar pagamento: ${mpRes.status}`)
        }

        const paymentData = await mpRes.json()
        
        if (paymentData.status === "approved" || paymentData.status === "authorized") {
          // Atualizar no banco
          const paidAt = new Date().toISOString()
          const { error: updateError } = await supabase
            .from("pages")
            .update({
              is_paid: true,
              payment_status: paymentData.status,
              paid_at: paidAt,
            })
            .eq("id", pageId)

          if (updateError) {
            console.error("Erro ao atualizar página:", updateError)
            return NextResponse.json(
              { error: "Erro ao atualizar status de pagamento" },
              { status: 500 }
            )
          }

          return NextResponse.json({
            success: true,
            message: "Pagamento confirmado com sucesso!",
            isPaid: true,
            paymentStatus: paymentData.status,
          })
        } else {
          return NextResponse.json({
            success: false,
            message: `Pagamento encontrado, mas status é: ${paymentData.status}`,
            isPaid: false,
            paymentStatus: paymentData.status,
          })
        }
      } else {
        // Se não temos payment_id, tentar buscar por external_reference
        // A API do Mercado Pago permite buscar pagamentos usando filtros
        // Vamos usar a API de busca com filtro de external_reference
        
        // Usar uma chamada HTTP direta à API REST do Mercado Pago
        const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${pageId}&sort=date_created&criteria=desc&limit=1`

        const searchResponse = await fetch(searchUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!searchResponse.ok) {
          console.error("Erro ao buscar pagamento:", await searchResponse.text())
          return NextResponse.json(
            { error: "Erro ao consultar pagamento no Mercado Pago" },
            { status: 500 }
          )
        }

        const searchData = await searchResponse.json()
        
        if (searchData.results && searchData.results.length > 0) {
          const paymentResult = searchData.results[0]
          
          if (paymentResult.status === "approved" || paymentResult.status === "authorized") {
            // Atualizar no banco
            const paidAt = new Date().toISOString()
            const { error: updateError } = await supabase
              .from("pages")
              .update({
                is_paid: true,
                payment_id: paymentResult.id,
                payment_status: paymentResult.status,
                paid_at: paidAt,
              })
              .eq("id", pageId)

            if (updateError) {
              console.error("Erro ao atualizar página:", updateError)
              return NextResponse.json(
                { error: "Erro ao atualizar status de pagamento" },
                { status: 500 }
              )
            }

            return NextResponse.json({
              success: true,
              message: "Pagamento confirmado com sucesso!",
              isPaid: true,
              paymentStatus: paymentResult.status,
            })
          } else {
            return NextResponse.json({
              success: false,
              message: `Pagamento encontrado, mas status é: ${paymentResult.status}`,
              isPaid: false,
              paymentStatus: paymentResult.status,
            })
          }
        } else {
          return NextResponse.json({
            success: false,
            message: "Nenhum pagamento encontrado para esta página",
            isPaid: false,
          })
        }
      }
    } catch (mpError: any) {
      console.error("Erro ao consultar Mercado Pago:", mpError)
      return NextResponse.json(
        {
          error: "Erro ao consultar pagamento no Mercado Pago",
          details: mpError.message || "Erro desconhecido",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Erro ao verificar status de pagamento:", error)
    
    return NextResponse.json(
      {
        error: "Erro interno ao verificar pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}

