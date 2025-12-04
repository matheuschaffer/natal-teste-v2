import { supabase } from "@/lib/supabase"

export interface PageData {
  title: string
  message: string
  selectedFont: string | null
  selectedTheme: string | null
  galleryLayout: string
  selectedFrame: string
  photoUrls: string[]
  audioUrl?: string | null
  hasAudio?: boolean
  audioSkipped?: boolean
  influencerRef?: string | null
}

export interface PageResult {
  id: string
  slug: string
  created_at: string
}

/**
 * Gera um slug único a partir do título
 */
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
    .replace(/(^-|-$)/g, "") // Remove hífens no início e fim
    .substring(0, 50) // Limita tamanho

  const shortId = Math.random().toString(36).substring(2, 8)
  return `${baseSlug || "homenagem"}-${shortId}`
}

/**
 * Cria uma nova página no banco de dados
 * @param data - Dados da página
 * @returns Objeto com id e slug da página criada
 */
export async function createPage(data: PageData): Promise<PageResult> {
  try {
    const slug = generateSlug(data.title)

    // Verificar se o slug já existe (opcional - pode remover se não for necessário)
    const { data: existingPage } = await supabase
      .from("pages")
      .select("slug")
      .eq("slug", slug)
      .single()

    // Se existir, adicionar um sufixo único
    const finalSlug = existingPage ? `${slug}-${Date.now()}` : slug

    // Preparar dados para inserção
    const pageData = {
      title: data.title,
      message: data.message,
      selected_font: data.selectedFont,
      selected_theme: data.selectedTheme,
      gallery_layout: data.galleryLayout,
      selected_frame: data.selectedFrame,
      photo_urls: data.photoUrls,
      audio_url: data.audioUrl || null,
      has_audio: data.hasAudio === true,
      audio_skipped: data.audioSkipped === true,
      slug: finalSlug,
      influencer_ref: data.influencerRef || null,
    }

    // Inserir no banco de dados
    const { data: insertedData, error } = await supabase
      .from("pages")
      .insert([pageData])
      .select("id, slug, created_at")
      .single()

    if (error) {
      throw new Error(`Erro ao salvar página: ${error.message}`)
    }

    if (!insertedData) {
      throw new Error("Não foi possível criar a página")
    }

    return {
      id: insertedData.id,
      slug: insertedData.slug,
      created_at: insertedData.created_at,
    }
  } catch (error) {
    console.error("Erro ao criar página:", error)
    throw error
  }
}

/**
 * Busca uma página pelo slug
 */
export async function getPageBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .single()

    if (error) {
      // Se não encontrar, retorna null ao invés de lançar erro
      if (error.code === "PGRST116") {
        return null
      }
      throw new Error(`Erro ao buscar página: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar página:", error)
    // Retornar null em caso de erro para permitir tratamento no componente
    return null
  }
}

/**
 * Atualiza os dados do cliente (nome e email) em uma página existente
 * @param pageId - ID da página no Supabase
 * @param name - Nome completo do cliente
 * @param email - Email do cliente
 */
export async function updatePageCustomerData(
  pageId: string,
  name: string,
  email: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("pages")
      .update({
        customer_name: name,
        customer_email: email,
      })
      .eq("id", pageId)

    if (error) {
      throw new Error(`Erro ao atualizar dados do cliente: ${error.message}`)
    }
  } catch (error) {
    console.error("Erro ao atualizar dados do cliente:", error)
    throw error
  }
}

