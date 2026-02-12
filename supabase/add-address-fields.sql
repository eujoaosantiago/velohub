-- ============================================================
-- VELOHUB: Adicionar Campos de Endereco na Tabela Users
-- ============================================================
-- Execute este script no Supabase SQL Editor para habilitar
-- os campos de endereco nos perfis das lojas
-- ============================================================

-- CEP
ALTER TABLE users
ADD COLUMN IF NOT EXISTS cep TEXT;

-- Logradouro
ALTER TABLE users
ADD COLUMN IF NOT EXISTS street TEXT;

-- Numero
ALTER TABLE users
ADD COLUMN IF NOT EXISTS number TEXT;

-- Cidade
ALTER TABLE users
ADD COLUMN IF NOT EXISTS city TEXT;

-- UF
ALTER TABLE users
ADD COLUMN IF NOT EXISTS state TEXT;

-- Comentarios para documentacao
COMMENT ON COLUMN users.cep IS 'CEP da loja';
COMMENT ON COLUMN users.street IS 'Logradouro da loja';
COMMENT ON COLUMN users.number IS 'Numero do endereco da loja';
COMMENT ON COLUMN users.city IS 'Cidade da loja';
COMMENT ON COLUMN users.state IS 'UF da loja';

-- ============================================================
-- ✅ COMPLETO! Campos de endereco adicionados com sucesso
-- ============================================================
-- Agora o cadastro pode salvar cep, logradouro e numero
-- diretamente no perfil da loja.
-- ============================================================
