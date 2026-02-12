-- Fix store_id type mismatch in customers table
-- Changed from UUID to TEXT to match users.store_id type

-- Drop existing RLS policies FIRST (before altering column)
DROP POLICY IF EXISTS "Clientes visiveis apenas para membros da loja" ON customers;
DROP POLICY IF EXISTS "Usuarios podem inserir clientes na propria loja" ON customers;
DROP POLICY IF EXISTS "Usuarios podem atualizar clientes da propria loja" ON customers;
DROP POLICY IF EXISTS "Usuarios podem excluir clientes da propria loja" ON customers;

-- Now alter the column type
ALTER TABLE customers 
  ALTER COLUMN store_id TYPE TEXT;

-- Drop and recreate unique constraint with TEXT type
ALTER TABLE customers 
  DROP CONSTRAINT IF EXISTS customers_store_id_cpf_key;

ALTER TABLE customers 
  ADD CONSTRAINT customers_store_id_cpf_key UNIQUE(store_id, cpf);

-- Recreate RLS policies with correct type (TEXT = TEXT)
CREATE POLICY "Clientes visiveis apenas para membros da loja" ON customers
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id
  )
);

CREATE POLICY "Usuarios podem inserir clientes na propria loja" ON customers
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id
  )
);

CREATE POLICY "Usuarios podem atualizar clientes da propria loja" ON customers
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id
  )
);

CREATE POLICY "Usuarios podem excluir clientes da propria loja" ON customers
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE store_id = customers.store_id
  )
);
