-- ============================================================
-- VELOHUB: Tabela customers + relacionamento com vehicles
-- ============================================================
-- Stack: Supabase Postgres
-- Objetivo: criar tabela customers, coluna customer_id em vehicles
-- e buyer_snapshot (JSONB) para snapshot historico da venda.
-- Inclui migracao dos dados atuais e RLS.
-- ============================================================

-- 1) Tabela customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Unicidade por loja
CREATE UNIQUE INDEX IF NOT EXISTS customers_store_cpf_unique
  ON customers (store_id, cpf);

-- 3) Colunas novas em vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS buyer_snapshot JSONB;

-- 3.1) Renomear campo antigo buyer para buyer_old
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'buyer'
  ) THEN
    ALTER TABLE vehicles RENAME COLUMN buyer TO buyer_old;
  END IF;
END$$;

-- 4) Backfill (migracao de dados existentes)
-- Cria customers a partir do buyer antigo
INSERT INTO customers (store_id, name, cpf, phone, email, cep, street, number, neighborhood, city, state)
SELECT DISTINCT ON (v.store_id, (v.buyer_old->>'cpf'))
  v.store_id::uuid,
  COALESCE(v.buyer_old->>'name', ''),
  COALESCE(v.buyer_old->>'cpf', ''),
  COALESCE(v.buyer_old->>'phone', ''),
  NULLIF(v.buyer_old->>'email', ''),
  NULLIF(v.buyer_old->>'cep', ''),
  NULLIF(v.buyer_old->>'street', ''),
  NULLIF(v.buyer_old->>'number', ''),
  NULLIF(v.buyer_old->>'neighborhood', ''),
  NULLIF(v.buyer_old->>'city', ''),
  NULLIF(v.buyer_old->>'state', '')
FROM vehicles v
WHERE v.buyer_old IS NOT NULL
  AND (v.buyer_old->>'cpf') IS NOT NULL
  AND (v.buyer_old->>'cpf') <> ''
ON CONFLICT (store_id, cpf) DO NOTHING;

-- Preenche customer_id com base no cpf
UPDATE vehicles v
SET customer_id = c.id
FROM customers c
WHERE v.customer_id IS NULL
  AND v.store_id::uuid = c.store_id
  AND v.buyer_old IS NOT NULL
  AND (v.buyer_old->>'cpf') = c.cpf;

-- Preenche buyer_snapshot com o buyer atual
UPDATE vehicles v
SET buyer_snapshot = v.buyer_old
WHERE v.buyer_snapshot IS NULL
  AND v.buyer_old IS NOT NULL;

-- 5) RLS (mesmo padrao de vehicles)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clientes visiveis apenas para membros da loja" ON customers;
DROP POLICY IF EXISTS "Usuarios podem inserir clientes na propria loja" ON customers;
DROP POLICY IF EXISTS "Usuarios podem atualizar clientes da propria loja" ON customers;
DROP POLICY IF EXISTS "Usuarios podem excluir clientes da propria loja" ON customers;

CREATE POLICY "Clientes visiveis apenas para membros da loja"
ON customers
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id::text
  )
);

CREATE POLICY "Usuarios podem inserir clientes na propria loja"
ON customers
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id::text
  )
);

CREATE POLICY "Usuarios podem atualizar clientes da propria loja"
ON customers
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id::text
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id::text
  )
);

CREATE POLICY "Usuarios podem excluir clientes da propria loja"
ON customers
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id::text
  )
);

-- ============================================================
-- ✅ PRONTO! Tabela customers criada, vehicles ligado por customer_id
-- e buyer_snapshot preenchido com o historico atual.
-- ============================================================
