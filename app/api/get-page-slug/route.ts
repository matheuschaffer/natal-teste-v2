import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pageId = searchParams.get("pageId")

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId é obrigatório" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("pages")
      .select("slug")
      .eq("id", pageId)
      .single()

    if (error) {
      console.error("Erro ao buscar página:", error)
      return NextResponse.json(
        { error: "Página não encontrada" },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Página não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      slug: data.slug,
    })
  } catch (error) {
    console.error("Erro ao buscar slug:", error)
    return NextResponse.json(
      {
        error: "Erro interno ao buscar slug",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}

