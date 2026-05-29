-- -----------------------------------------------------------------------------
-- BOLÃO DO TROIA - CORREÇÃO DE RECURSÃO INFINITA NA TABELA ADMINS
-- -----------------------------------------------------------------------------

-- 1. Remover a política antiga recursiva
DROP POLICY IF EXISTS "Admins visiveis apenas por admins" ON admins;

-- 2. Criar a nova política ultra-segura e sem recursão
CREATE POLICY "Admins visiveis apenas por admins" ON admins FOR SELECT 
  TO authenticated 
  USING (email = auth.jwt() ->> 'email');
