-- ============================================================
-- VELOHUB: Habilitar Compartilhamento Público de Veículos
-- ============================================================
-- Execute este script no Supabase SQL Editor para permitir
-- que links compartilhados funcionem sem necessidade de login
-- ============================================================

-- 1. Remover política restritiva antiga (se existir)
DROP POLICY IF EXISTS "Veículos são visíveis apenas para membros da loja" ON vehicles;

-- 2. Criar política para LEITURA PÚBLICA de veículos
-- Permite que qualquer pessoa (autenticada ou não) leia veículos
CREATE POLICY "Veículos são públicos para leitura"
ON vehicles
FOR SELECT
USING (true);

-- 3. Políticas de INSERT/UPDATE/DELETE permanecem restritas
-- Apenas usuários autenticados da mesma loja podem modificar

-- INSERT: Só quem está autenticado e pertence à loja
CREATE POLICY "Usuários podem inserir veículos na própria loja"
ON vehicles
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = vehicles.store_id
  )
);

-- UPDATE: Só quem está autenticado e pertence à loja
CREATE POLICY "Usuários podem atualizar veículos da própria loja"
ON vehicles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = vehicles.store_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = vehicles.store_id
  )
);

-- DELETE: Só quem está autenticado e pertence à loja
CREATE POLICY "Usuários podem excluir veículos da própria loja"
ON vehicles
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = vehicles.store_id
  )
);

-- ============================================================
-- 4. Habilitar também leitura pública da tabela STORES
--    (necessário para exibir o nome da loja no compartilhamento)
-- ============================================================

DROP POLICY IF EXISTS "Lojas são visíveis apenas para membros" ON stores;

CREATE POLICY "Lojas são públicas para leitura"
ON stores
FOR SELECT
USING (true);

-- ============================================================
-- ✅ PRONTO! Agora os links de compartilhamento funcionam!
-- ============================================================
-- Teste compartilhando um veículo e abrindo o link em uma
-- janela anônima (sem login)
-- ============================================================
