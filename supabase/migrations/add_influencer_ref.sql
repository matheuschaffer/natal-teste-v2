-- Migration: Adicionar coluna influencer_ref na tabela pages
-- Data: 2024-12-XX
-- Descrição: Adiciona coluna para rastrear referência de influenciador via parâmetro ref da URL

-- Verificar se a coluna já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'pages' 
    AND column_name = 'influencer_ref'
  ) THEN
    ALTER TABLE pages 
    ADD COLUMN influencer_ref TEXT NULL DEFAULT NULL;
    
    -- Adicionar comentário na coluna para documentação
    COMMENT ON COLUMN pages.influencer_ref IS 'Referência do influenciador capturada do parâmetro ref da URL';
  END IF;
END $$;

