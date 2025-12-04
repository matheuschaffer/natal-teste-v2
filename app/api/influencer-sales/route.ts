import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ref = searchParams.get("ref")

    if (!ref) {
      return NextResponse.json(
        { error: "ref required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("influencer_ref", ref)
      .eq("payment_status", "approved")

    if (error) {
      console.error("Erro ao buscar vendas do influenciador:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ sales: data || [] })
  } catch (error) {
    console.error("Erro ao consultar vendas do influenciador:", error)
    return NextResponse.json(
      {
        error: "Erro interno ao consultar vendas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}

