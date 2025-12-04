import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Validar API Key no início
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY não configurada nas variáveis de ambiente")
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Validar API Key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API Key da OpenAI não configurada" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { promptType, userContext } = body

    if (!promptType || !["emotional", "funny", "poetic"].includes(promptType)) {
      return NextResponse.json(
        { error: "Tipo de prompt inválido. Use 'emotional', 'funny' ou 'poetic'" },
        { status: 400 }
      )
    }

    // System Prompt - Escritor de Natal especializado
    const systemPrompt = `Você é um escritor especializado em criar mensagens natalinas emocionais, calorosas e autênticas. 
Sua missão é escrever mensagens que toquem o coração das famílias, celebrando o amor, a união e a magia do Natal.
As mensagens devem ser:
- Autênticas e pessoais
- Emotivas mas não exageradas
- Apropriadas para o contexto familiar
- Escritas em português brasileiro
- Com um tom caloroso e acolhedor
- IMPORTANTE: Escreva em português brasileiro, com no máximo 500 caracteres (contando espaços), em um único parágrafo, e NÃO coloque nenhuma assinatura no final. Não escreva nada como 'Seu Nome', 'Com carinho', 'Atenciosamente' ou variações. Não ultrapasse o limite de 500 caracteres.

${userContext ? `Contexto adicional fornecido pelo usuário: ${userContext}` : ""}`

    // User Prompts baseados no tipo
    const userPrompts = {
      emotional: `Escreva uma mensagem emocionante e tocante para uma família no Natal. 
Fale sobre o amor, a gratidão, os momentos especiais compartilhados e a importância de estar juntos. 
Seja genuíno e sincero, como se estivesse escrevendo uma carta do coração.
IMPORTANTE: Escreva em português brasileiro, com no máximo 500 caracteres (contando espaços), em um único parágrafo, e NÃO coloque nenhuma assinatura no final. Não escreva nada como 'Seu Nome', 'Com carinho', 'Atenciosamente' ou variações.`,
      
      funny: `Escreva uma mensagem engraçada e descontraída para uma família no Natal. 
Use humor leve e carinhoso, faça referências a momentos divertidos, tradições familiares engraçadas e a alegria de estar juntos. 
Mantenha o tom positivo e festivo, sem ser ofensivo.
IMPORTANTE: Escreva em português brasileiro, com no máximo 500 caracteres (contando espaços), em um único parágrafo, e NÃO coloque nenhuma assinatura no final. Não escreva nada como 'Seu Nome', 'Com carinho', 'Atenciosamente' ou variações.`,
      
      poetic: `Escreva uma mensagem poética e lírica para uma família no Natal. 
Use uma linguagem mais elaborada, com metáforas sobre o Natal, a luz, o amor e a união. 
Crie uma atmosfera mágica e encantadora, como um poema em prosa.
IMPORTANTE: Escreva em português brasileiro, com no máximo 500 caracteres (contando espaços), em um único parágrafo, e NÃO coloque nenhuma assinatura no final. Não escreva nada como 'Seu Nome', 'Com carinho', 'Atenciosamente' ou variações.`
    }

    const userPrompt = userPrompts[promptType as keyof typeof userPrompts]

    // Chamada para OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.8, // Criatividade moderada
      max_tokens: 300, // Limite de tokens para manter a mensagem concisa
    })

    let rawMessage = completion.choices[0]?.message?.content ?? ""

    if (!rawMessage) {
      return NextResponse.json(
        { error: "Não foi possível gerar a mensagem" },
        { status: 500 }
      )
    }

    // Limite máximo de 500 chars
    rawMessage = rawMessage.slice(0, 500)

    // Remover assinaturas automáticas
    const assinaturaRegex =
      /(com carinho,?|com amor,?|atenciosamente,?|[\[\(]?\s*seu nome\s*[\]\)]?)\s*$/i
    rawMessage = rawMessage.replace(assinaturaRegex, "").trim()

    // Remover quebras de linha e manter em um único parágrafo
    rawMessage = rawMessage.replace(/\n+/g, " ").replace(/\s+/g, " ").trim()

    // Garantir que não ultrapasse 500 caracteres após processamento
    const finalMessage = rawMessage.slice(0, 500)

    return NextResponse.json({ message: finalMessage })
  } catch (error) {
    console.error("Erro ao gerar mensagem:", error)
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Erro da API OpenAI: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno ao gerar mensagem" },
      { status: 500 }
    )
  }
}

