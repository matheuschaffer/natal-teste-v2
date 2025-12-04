import { NextRequest, NextResponse } from "next/server"
import { updatePageCustomerData } from "@/services/pageService"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, name, email, phone } = body

    if (!pageId || !name || !email) {
      return NextResponse.json(
        { error: "Dados incompletos. Forneça pageId, name e email" },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    // Atualizar dados do cliente (incluindo telefone se fornecido)
    await updatePageCustomerData(pageId, name.trim(), email.trim(), phone || null)

    return NextResponse.json({
      success: true,
      message: "Dados do cliente atualizados com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar dados do cliente:", error)
    
    return NextResponse.json(
      {
        error: "Erro ao atualizar dados do cliente",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}

