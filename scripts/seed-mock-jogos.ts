import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE (.env.local)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const index = trimmed.indexOf("=");
      const key = trimmed.substring(0, index).trim();
      const val = trimmed.substring(index + 1).trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas em .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function seedMock() {
  console.log("Iniciando semeadura de JOGOS DE SIMULAÇÃO (TESTES)...");

  // Limpar todos os jogos anteriores
  const { error: deleteError } = await supabase.from("jogos").delete().neq("rodada", "");
  if (deleteError) {
    console.error("Erro ao limpar tabela de jogos:", deleteError);
  } else {
    console.log("Tabela de jogos limpa com sucesso!");
  }

  // Definir fusos horários relativos a AGORA
  const agora = new Date();

  // Jogo 1: Começa em 15 minutos (Para testar palpites ativos!)
  const jogoAtivoTime = new Date(agora.getTime() + 15 * 60 * 1000);

  // Jogo 2: Acontecendo Agora (Iniciou há 30 minutos - palpites bloqueados pela trigger)
  const jogoLiveTime = new Date(agora.getTime() - 30 * 60 * 1000);

  // Jogo 3: Já Finalizado no Passado (Iniciou há 3 horas - serve para testar pontuações)
  const jogoFinalizadoTime = new Date(agora.getTime() - 3 * 60 * 60 * 1000);

  // Jogo 4: Próximas 24 Horas
  const jogoFuturoTime = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  const mockJogos = [
    {
      rodada: "Simulação - Fase de Grupos",
      grupo: "A",
      data_hora: jogoAtivoTime.toISOString(),
      time_casa: "Brasil",
      time_visitante: "Itália",
      bandeira_casa: "https://flagcdn.com/w160/br.png",
      bandeira_visitante: "https://flagcdn.com/w160/it.png",
      cidade: "Cabo Frio - RJ",
      estadio: "Troia Arena Central",
      gols_casa: null,
      gols_visitante: null,
      finalizado: false
    },
    {
      rodada: "Simulação - Fase de Grupos",
      grupo: "A",
      data_hora: jogoLiveTime.toISOString(),
      time_casa: "Brasil",
      time_visitante: "Alemanha",
      bandeira_casa: "https://flagcdn.com/w160/br.png",
      bandeira_visitante: "https://flagcdn.com/w160/de.png",
      cidade: "Cabo Frio - RJ",
      estadio: "Lounge Deck Troia",
      gols_casa: null,
      gols_visitante: null,
      finalizado: false
    },
    {
      rodada: "Simulação - Amistoso Premium",
      grupo: "B",
      data_hora: jogoFinalizadoTime.toISOString(),
      time_casa: "Argentina",
      time_visitante: "Uruguai",
      bandeira_casa: "https://flagcdn.com/w160/ar.png",
      bandeira_visitante: "https://flagcdn.com/w160/uy.png",
      cidade: "Montevidéu",
      estadio: "Estádio Centenário",
      gols_casa: 3,
      gols_visitante: 2,
      finalizado: true
    },
    {
      rodada: "Simulação - Fase de Grupos",
      grupo: "C",
      data_hora: jogoFuturoTime.toISOString(),
      time_casa: "Espanha",
      time_visitante: "França",
      bandeira_casa: "https://flagcdn.com/w160/es.png",
      bandeira_visitante: "https://flagcdn.com/w160/fr.png",
      cidade: "Nova York",
      estadio: "MetLife Stadium",
      gols_casa: null,
      gols_visitante: null,
      finalizado: false
    }
  ];

  const { error: insertError } = await supabase.from("jogos").insert(mockJogos);

  if (insertError) {
    console.error("Erro ao inserir jogos de simulação:", insertError);
    process.exit(1);
  }

  console.log("Jogos de simulação cadastrados com sucesso no Supabase!");
  console.log("\nLista de Jogos Inseridos:");
  console.log("1. Brasil x Itália (Começa em 15 minutos - Palpites Liberados!)");
  console.log("2. Brasil x Alemanha (Iniciou há 30 minutos - Acontecendo Agora / Bloqueado para palpites!)");
  console.log("3. Argentina 3 x 2 Uruguai (Já Finalizado - Testes de pontuação automática)");
  console.log("4. Espanha x França (Começa em 24 horas - Próximos Jogos)");
  
  process.exit(0);
}

seedMock().catch((err) => {
  console.error("Erro crítico na simulação:", err);
  process.exit(1);
});
