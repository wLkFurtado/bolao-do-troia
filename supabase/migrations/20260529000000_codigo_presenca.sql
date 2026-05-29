-- -----------------------------------------------------------------------------
-- BOLÃO DO TROIA - MIGRAÇÃO PARA CONTROLE DE PRESENÇA (PIN ROTATIVO)
-- -----------------------------------------------------------------------------

-- 1. Criação da Tabela de Configurações Globais
CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserção do PIN de Presença Inicial (Default: 1234)
INSERT INTO configuracoes (chave, valor) 
VALUES ('codigo_presenca', '1234') 
ON CONFLICT (chave) DO NOTHING;

-- 3. Habilitação de RLS (Row Level Security)
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- 4. Política: Leitura pública (para permitir que a TV do lounge leia e exiba o código)
DROP POLICY IF EXISTS "Leitura publica de configuracoes" ON configuracoes;
CREATE POLICY "Leitura publica de configuracoes" ON configuracoes FOR SELECT USING (true);

-- 5. Política: Escrita/Modificação restrita aos administradores autenticados
DROP POLICY IF EXISTS "Gerenciamento de configuracoes por admins" ON configuracoes;
CREATE POLICY "Gerenciamento de configuracoes por admins" ON configuracoes FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

-- 6. Função RPC de Salvamento de Palpite com Validação de PIN de Presença
CREATE OR REPLACE FUNCTION salvar_palpite_com_codigo(
  p_participante_id UUID,
  p_jogo_id UUID,
  p_palpite_casa INT,
  p_palpite_visitante INT,
  p_codigo_presenca TEXT
)
RETURNS JSON AS $$
DECLARE
  v_codigo_atual TEXT;
  v_jogo_horario TIMESTAMPTZ;
  v_palpite_id UUID;
BEGIN
  -- 6.1 Buscar o código PIN ativo no banco de dados
  SELECT valor INTO v_codigo_atual FROM configuracoes WHERE chave = 'codigo_presenca';
  
  -- 6.2 Validar se o código bate com o PIN atual (bypassa se o PIN do banco for nulo por algum motivo)
  IF v_codigo_atual IS NOT NULL AND COALESCE(p_codigo_presenca, '') != v_codigo_atual THEN
    RETURN json_build_object('success', false, 'error', 'Código de presença inválido! Digite o PIN de 4 dígitos exibido nas TVs do bar.');
  END IF;
  
  -- 6.3 Validar regra temporal (rejeita palpite após 5 minutos do início do jogo)
  SELECT data_hora INTO v_jogo_horario FROM jogos WHERE id = p_jogo_id;
  IF NOW() >= v_jogo_horario + INTERVAL '5 minutes' THEN
    RETURN json_build_object('success', false, 'error', 'Palpites encerrados! O limite é de até 5 minutos após o início da partida.');
  END IF;
  
  -- 6.4 Realiza o UPSERT do Palpite de forma atômica e segura
  INSERT INTO palpites (participante_id, jogo_id, palpite_casa, palpite_visitante, atualizado_em)
  VALUES (p_participante_id, p_jogo_id, p_palpite_casa, p_palpite_visitante, NOW())
  ON CONFLICT (participante_id, jogo_id) 
  DO UPDATE SET 
    palpite_casa = EXCLUDED.palpite_casa,
    palpite_visitante = EXCLUDED.palpite_visitante,
    atualizado_em = NOW()
  RETURNING id INTO v_palpite_id;
  
  RETURN json_build_object('success', true, 'palpite_id', v_palpite_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
