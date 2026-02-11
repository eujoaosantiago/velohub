-- ============================================================
-- VELOHUB: Adicionar Campo WhatsApp à Tabela Users
-- ============================================================
-- Execute este script no Supabase SQL Editor para habilitar
-- o campo de WhatsApp nos perfis das lojas
-- ============================================================

-- 1. Verificar se a coluna já existe (segurança)
-- Se já existir, isso não vai fazer nada

-- 2. Adicionar coluna whatsapp à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 3. Adicionar comentário para documentação
COMMENT ON COLUMN users.whatsapp IS 'Número de WhatsApp da loja (apenas dígitos, ex: 11999999999)';

-- ============================================================
-- ✅ COMPLETO! Campo WhatsApp adicionado com sucesso
-- ============================================================
-- Agora você pode:
-- 1. Ir para o perfil da loja
-- 2. Adicionar o número de WhatsApp (ex: 11999999999)
-- 3. Salvar o perfil
-- 4. Ao compartilhar um veículo, o botão "Tenho Interesse"
--    redirecionará para o WhatsApp da loja
-- ============================================================
