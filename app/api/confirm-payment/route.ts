import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, paymentId, status } = body

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId é obrigatório" },
        { status: 400 }
      )
    }

    // Validar status do pagamento
    const validStatuses = ["approved", "authorized"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status de pagamento inválido: ${status}` },
        { status: 400 }
      )
    }

    // Atualizar página no Supabase
    const updateData: any = {
      is_paid: true,
      payment_id: paymentId || null,
      payment_status: status || "approved",
      paid_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("pages")
      .update(updateData)
      .eq("id", pageId)
      .select("id, slug")
      .single()

    if (error) {
      console.error("Erro ao atualizar página:", error)
      return NextResponse.json(
        { error: `Erro ao atualizar página: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Página não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      pageId: data.id,
      slug: data.slug,
    })
  } catch (error) {
    console.error("Erro ao confirmar pagamento:", error)
    return NextResponse.json(
      { 
        error: "Erro interno ao confirmar pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}

