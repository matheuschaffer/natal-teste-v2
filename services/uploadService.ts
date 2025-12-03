import { supabase } from "@/lib/supabase"

/**
 * Gera um nome de arquivo único
 */
function generateUniqueFileName(file: File): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split(".").pop()
  const fileName = file.name.replace(/\.[^/.]+$/, "") // Remove extensão
  const sanitizedFileName = fileName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
  
  return `${timestamp}-${randomId}-${sanitizedFileName}.${fileExtension}`
}

/**
 * Faz upload de um arquivo para o bucket especificado
 * @param file - Arquivo a ser enviado
 * @param bucket - Nome do bucket ('photos' ou 'audio')
 * @returns URL pública do arquivo após upload bem-sucedido
 */
export async function uploadFile(
  file: File,
  bucket: "photos" | "audio"
): Promise<string> {
  try {
    const fileName = generateUniqueFileName(file)
    
    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`)
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    if (!urlData?.publicUrl) {
      throw new Error("Não foi possível obter a URL pública do arquivo")
    }

    return urlData.publicUrl
  } catch (error) {
    console.error("Erro no upload:", error)
    throw error
  }
}

/**
 * Faz upload de múltiplos arquivos
 * @param files - Array de arquivos
 * @param bucket - Nome do bucket ('photos' ou 'audio')
 * @returns Array de URLs públicas
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: "photos" | "audio"
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file, bucket))
  return Promise.all(uploadPromises)
}

