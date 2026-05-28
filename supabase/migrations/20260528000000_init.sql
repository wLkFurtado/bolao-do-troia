-- 1. CRIAÇÃO DAS TABELAS

-- Participantes (cadastro simples sem senha)
CREATE TABLE IF NOT EXISTS participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  pontos_total INT DEFAULT 0
);

-- Jogos da Copa 2026
CREATE TABLE IF NOT EXISTS jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rodada TEXT NOT NULL,
  grupo TEXT,
  data_hora TIMESTAMPTZ NOT NULL,
  time_casa TEXT NOT NULL,
  time_visitante TEXT NOT NULL,
  bandeira_casa TEXT,
  bandeira_visitante TEXT,
  cidade TEXT,
  estadio TEXT,
  gols_casa INT,
  gols_visitante INT,
  finalizado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Palpites dos Participantes
CREATE TABLE IF NOT EXISTS palpites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  jogo_id UUID REFERENCES jogos(id) ON DELETE CASCADE,
  palpite_casa INT NOT NULL CHECK (palpite_casa >= 0 AND palpite_casa <= 99),
  palpite_visitante INT NOT NULL CHECK (palpite_visitante >= 0 AND palpite_visitante <= 99),
  pontos_ganhos INT DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participante_id, jogo_id)
);

-- Ganhadores Anunciados
CREATE TABLE IF NOT EXISTS ganhadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID REFERENCES jogos(id) ON DELETE SET NULL,
  rodada TEXT,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  premio TEXT NOT NULL,
  anunciado_em TIMESTAMPTZ DEFAULT NOW(),
  observacao TEXT
);

-- Administradores Autorizados
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- 2. CRIAÇÃO DE ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_jogos_data_hora ON jogos(data_hora);
CREATE INDEX IF NOT EXISTS idx_palpites_participante ON palpites(participante_id);
CREATE INDEX IF NOT EXISTS idx_palpites_jogo ON palpites(jogo_id);
CREATE INDEX IF NOT EXISTS idx_participantes_pontos ON participantes(pontos_total DESC);


-- 3. INSERÇÃO DOS ADMINS INICIAIS
INSERT INTO admins (email) 
VALUES 
  ('wallker@exemplo.com'),
  ('wallkerfurtado@gmail.com')
ON CONFLICT (email) DO NOTHING;


-- 4. FUNÇÃO E TRIGGER DE BLOQUEIO DE PALPITES (5 minutos após início)
CREATE OR REPLACE FUNCTION verificar_limite_palpite()
RETURNS TRIGGER AS $$
DECLARE
    v_jogo_horario TIMESTAMPTZ;
BEGIN
    SELECT data_hora INTO v_jogo_horario FROM jogos WHERE id = NEW.jogo_id;
    IF NOW() >= v_jogo_horario + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'Palpites para este jogo já foram encerrados (limite de 5 minutos após o início).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verificar_limite_palpite ON palpites;
CREATE TRIGGER trg_verificar_limite_palpite
BEFORE INSERT OR UPDATE ON palpites
FOR EACH ROW
EXECUTE FUNCTION verificar_limite_palpite();


-- 5. FUNÇÃO SQL DE CÁLCULO DE PONTOS DE UM JOGO
CREATE OR REPLACE FUNCTION calcular_pontos_jogo(p_jogo_id UUID)
RETURNS VOID AS $$
DECLARE
    v_gols_casa INT;
    v_gols_visitante INT;
    v_finalizado BOOLEAN;
    r_palpite RECORD;
    v_pontos INT;
BEGIN
    -- Obter placar real do jogo
    SELECT gols_casa, gols_visitante, finalizado INTO v_gols_casa, v_gols_visitante, v_finalizado
    FROM jogos WHERE id = p_jogo_id;

    -- Se não finalizou ou os gols são nulos, não calcula
    IF NOT COALESCE(v_finalizado, FALSE) OR v_gols_casa IS NULL OR v_gols_visitante IS NULL THEN
        RETURN;
    END IF;

    -- Iterar por todos os palpites desse jogo
    FOR r_palpite IN SELECT * FROM palpites WHERE jogo_id = p_jogo_id LOOP
        v_pontos := 0;

        -- 1. Placar Exato (10 Pontos)
        IF r_palpite.palpite_casa = v_gols_casa AND r_palpite.palpite_visitante = v_gols_visitante THEN
            v_pontos := 10;
            
        -- 2. Acertou Vencedor ou Empate
        ELSIF (
            (r_palpite.palpite_casa > r_palpite.palpite_visitante AND v_gols_casa > v_gols_visitante) OR -- Vitória do time da casa
            (r_palpite.palpite_casa < r_palpite.palpite_visitante AND v_gols_casa < v_gols_visitante) OR -- Vitória do visitante
            (r_palpite.palpite_casa = r_palpite.palpite_visitante AND v_gols_casa = v_gols_visitante)    -- Empate
        ) THEN
            -- Caso empate não-exato: 5 pontos (conforme regra do bolão)
            IF v_gols_casa = v_gols_visitante THEN
                v_pontos := 5;
            -- Vitória/derrota com saldo exato: 7 pontos
            ELSIF (v_gols_casa - v_gols_visitante) = (r_palpite.palpite_casa - r_palpite.palpite_visitante) THEN
                v_pontos := 7;
            -- Apenas vencedor com saldo diferente: 5 pontos
            ELSE
                v_pontos := 5;
            END IF;
        END IF;

        -- Atualizar pontos deste palpite
        UPDATE palpites SET pontos_ganhos = v_pontos WHERE id = r_palpite.id;
    END LOOP;

    -- Atualizar o pontos_total de todos os participantes com base na soma de seus palpites
    UPDATE participantes p
    SET pontos_total = COALESCE((
        SELECT SUM(pontos_ganhos) FROM palpites WHERE participante_id = p.id
    ), 0);
END;
$$ LANGUAGE plpgsql;


-- 6. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY)

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganhadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 6.1 Políticas para tabela "admins" (apenas admins logados leem admins)
DROP POLICY IF EXISTS "Admins visiveis apenas por admins" ON admins;
CREATE POLICY "Admins visiveis apenas por admins" ON admins FOR SELECT 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

-- 6.2 Políticas para tabela "jogos" (leitura pública, escrita admin)
DROP POLICY IF EXISTS "Leitura publica de jogos" ON jogos;
CREATE POLICY "Leitura publica de jogos" ON jogos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gerenciamento de jogos por admins" ON jogos;
CREATE POLICY "Gerenciamento de jogos por admins" ON jogos FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

-- 6.3 Políticas para tabela "participantes" (leitura e escrita pública por causa do login passwordless)
DROP POLICY IF EXISTS "Leitura de participantes" ON participantes;
CREATE POLICY "Leitura de participantes" ON participantes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cadastro de participante" ON participantes;
CREATE POLICY "Cadastro de participante" ON participantes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Atualizacao de participante" ON participantes;
CREATE POLICY "Atualizacao de participante" ON participantes FOR UPDATE USING (true) WITH CHECK (true);

-- 6.4 Políticas para tabela "palpites" (leitura pública, escrita pública)
DROP POLICY IF EXISTS "Leitura publica de palpites" ON palpites;
CREATE POLICY "Leitura publica de palpites" ON palpites FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insercao de palpite" ON palpites;
CREATE POLICY "Insercao de palpite" ON palpites FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Edicao de palpite" ON palpites;
CREATE POLICY "Edicao de palpite" ON palpites FOR UPDATE USING (true) WITH CHECK (true);

-- 6.5 Políticas para tabela "ganhadores" (leitura pública, escrita admin)
DROP POLICY IF EXISTS "Leitura publica de ganhadores" ON ganhadores;
CREATE POLICY "Leitura publica de ganhadores" ON ganhadores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gerenciamento de ganhadores por admins" ON ganhadores;
CREATE POLICY "Gerenciamento de ganhadores por admins" ON ganhadores FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));
