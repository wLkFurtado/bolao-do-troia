import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializa o cliente do Supabase com a Service Role Key para bypassar RLS e triggers temporariamente nos testes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Evita crash de build se as chaves não estiverem configuradas
const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Lista de nomes realistas brasileiros para os participantes simulados
const NOMES_MOCK = [
  "Lucas Silva", "Thiago Souza", "Renata Costa", "Juliana Lima", "Rodrigo Mello",
  "Patrícia Gomes", "Gustavo Santos", "Bruna Oliveira", "Diego Ribeiro", "Aline Teixeira",
  "Gabriel Martins", "Camila Rodrigues", "Bruno Castro", "Amanda Araújo", "Ronaldo Alves",
  "Mateus Barbosa", "Fernanda Lima", "Larissa Melo", "Felipe Azevedo", "Letícia Rocha"
];

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin não inicializado. Verifique .env.local" }, { status: 500 });
  }

  try {
    // Busca contagem de participantes, jogos e palpites para retornar o status atual da simulação
    const { count: partCount } = await supabaseAdmin.from("participantes").select("*", { count: "exact", head: true });
    const { count: jogoCount } = await supabaseAdmin.from("jogos").select("*", { count: "exact", head: true });
    const { count: palpiteCount } = await supabaseAdmin.from("palpites").select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      status: {
        participantes: partCount || 0,
        jogos: jogoCount || 0,
        palpites: palpiteCount || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin não inicializado. Verifique .env.local" }, { status: 500 });
  }

  try {
    const { action, ...payload } = await request.json();

    // ACTION: RESET & SEED MOCK MATCHES
    if (action === "seed-mock") {
      // 1. Limpar todas as tabelas
      await supabaseAdmin.from("ganhadores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("palpites").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("participantes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("jogos").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const agora = new Date();

      // Jogo 1: Começa em 15 minutos (Palpites Ativos)
      const jogoAtivoTime = new Date(agora.getTime() + 15 * 60 * 1000);
      // Jogo 2: Acontecendo Agora (Iniciou há 30 minutos - palpites bloqueados pela trigger)
      const jogoLiveTime = new Date(agora.getTime() - 30 * 60 * 1000);
      // Jogo 3: Já Finalizado no Passado (Iniciou há 3 horas)
      const jogoFinalizadoTime = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
      // Jogo 4: Começa em 24 Horas
      const jogoFuturoTime = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

      const mockJogos = [
        {
          rodada: "Simulação - Rodada 1",
          grupo: "Grupo A",
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
          rodada: "Simulação - Rodada 1",
          grupo: "Grupo A",
          data_hora: jogoLiveTime.toISOString(),
          time_casa: "Brasil",
          time_visitante: "Alemanha",
          bandeira_casa: "https://flagcdn.com/w160/br.png",
          bandeira_visitante: "https://flagcdn.com/w160/de.png",
          cidade: "Cabo Frio - RJ",
          estadio: "Lounge Deck Troia",
          gols_casa: 1,
          gols_visitante: 1, // começa 1x1 ao vivo
          finalizado: false
        },
        {
          rodada: "Simulação - Rodada 2",
          grupo: "Grupo B",
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
          rodada: "Simulação - Rodada 2",
          grupo: "Grupo C",
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

      const { data: insertedMatches, error: insertError } = await supabaseAdmin
        .from("jogos")
        .insert(mockJogos)
        .select();

      if (insertError) throw insertError;

      // Executa o cálculo para a partida já finalizada inicialmente
      const argUru = insertedMatches.find(j => j.time_casa === "Argentina");
      if (argUru) {
        await supabaseAdmin.rpc("calcular_pontos_jogo", { p_jogo_id: argUru.id });
      }

      return NextResponse.json({ success: true, message: "Banco redefinido e jogos de simulação inseridos!" });
    }

    // ACTION: GENERATE FAKE PARTICIPANTS & GUESSES
    if (action === "seed-fake-participants") {
      const count = Number(payload.count) || 10;

      // 1. Buscar todos os jogos existentes para gerar palpites
      const { data: jogos, error: jogosError } = await supabaseAdmin.from("jogos").select("*");
      if (jogosError || !jogos || jogos.length === 0) {
        return NextResponse.json({ success: false, error: "Nenhum jogo no banco. Por favor, crie os jogos primeiro." }, { status: 400 });
      }

      // Salva os horários originais dos jogos para restaurá-los depois
      const horariosOriginais = jogos.map(j => ({ id: j.id, data_hora: j.data_hora }));

      // 2. Temporariamente atualiza todos os jogos para começarem daqui a 1 hora (bypassa a trigger de bloqueio dos palpites)
      const dataBypass = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { error: bypassError } = await supabaseAdmin
        .from("jogos")
        .update({ data_hora: dataBypass })
        .neq("time_casa", ""); // Atualiza todos os jogos

      if (bypassError) throw bypassError;

      try {
        // 3. Criar os participantes fictícios
        const participantesFalsos = [];
        const ddd = "22"; // DDD de Cabo Frio
        
        for (let i = 0; i < count; i++) {
          const nomeIndex = Math.floor(Math.random() * NOMES_MOCK.length);
          const nomeBase = NOMES_MOCK[nomeIndex];
          const sufixoAleatorio = Math.floor(Math.random() * 1000);
          const nomeCompleto = `${nomeBase} (${sufixoAleatorio})`;
          const email = `simulado_${Date.now()}_${i}@boladotroia.com`;
          const telefone = `(${ddd}) 99${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
          
          // Anos entre 1980 e 2005 para serem clientes adultos do bar
          const anoNasc = 1980 + Math.floor(Math.random() * 26);
          const mesNasc = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
          const diaNasc = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
          const dataNasc = `${anoNasc}-${mesNasc}-${diaNasc}`;

          participantesFalsos.push({
            nome: nomeCompleto,
            email,
            telefone,
            data_nascimento: dataNasc,
            pontos_total: 0
          });
        }

        const { data: insertedParticipants, error: partError } = await supabaseAdmin
          .from("participantes")
          .insert(participantesFalsos)
          .select();

        if (partError || !insertedParticipants) throw partError || new Error("Falha ao salvar participantes");

        // 4. Inserir palpites aleatórios para todos os jogos simulados
        const palpitesMockados = [];
        for (const participante of insertedParticipants) {
          for (const jogo of jogos) {
            // Gera placares plausíveis (pesando para gols baixos 0 a 3, raramente 4+)
            const palpiteCasa = Math.min(3, Math.floor(Math.random() * 4)) + (Math.random() > 0.9 ? 1 : 0);
            const palpiteVisitante = Math.min(3, Math.floor(Math.random() * 4)) + (Math.random() > 0.9 ? 1 : 0);

            palpitesMockados.push({
              participante_id: participante.id,
              jogo_id: jogo.id,
              palpite_casa: palpiteCasa,
              palpite_visitante: palpiteVisitante,
              pontos_ganhos: 0
            });
          }
        }

        const { error: palpitesError } = await supabaseAdmin.from("palpites").insert(palpitesMockados);
        if (palpitesError) throw palpitesError;

      } finally {
        // 5. RESTAURAR os horários originais dos jogos aconteça o que acontecer
        for (const orig of horariosOriginais) {
          await supabaseAdmin
            .from("jogos")
            .update({ data_hora: orig.data_hora })
            .eq("id", orig.id);
        }
      }

      // 6. Recalcular pontos para as partidas que já estão FINALIZADAS para ver rankings
      const { data: finalizados } = await supabaseAdmin.from("jogos").select("id").eq("finalizado", true);
      if (finalizados) {
        for (const fg of finalizados) {
          await supabaseAdmin.rpc("calcular_pontos_jogo", { p_jogo_id: fg.id });
        }
      }

      return NextResponse.json({
        success: true,
        message: `${count} participantes e palpites simulados gerados com sucesso!`
      });
    }

    // ACTION: SIMULATE MATCH GOAL OR CHANGE SCORE
    if (action === "simular-gol") {
      const { jogo_id, time, gols } = payload;
      if (!jogo_id) return NextResponse.json({ success: false, error: "jogo_id é obrigatório." }, { status: 400 });

      // Atualiza o placar atual do jogo (ao vivo)
      const updateData: any = {};
      if (time === "casa") {
        updateData.gols_casa = Math.max(0, gols);
      } else {
        updateData.gols_visitante = Math.max(0, gols);
      }

      const { data: updatedMatch, error: matchError } = await supabaseAdmin
        .from("jogos")
        .update(updateData)
        .eq("id", jogo_id)
        .select()
        .single();

      if (matchError) throw matchError;

      // Se por acaso o jogo estiver finalizado, recalcula a pontuação
      if (updatedMatch.finalizado) {
        await supabaseAdmin.rpc("calcular_pontos_jogo", { p_jogo_id: jogo_id });
      }

      return NextResponse.json({
        success: true,
        jogo: updatedMatch,
        message: "Placar atualizado na simulação!"
      });
    }

    // ACTION: FINALIZE MATCH & RUN RPC
    if (action === "finalizar-jogo") {
      const { jogo_id } = payload;
      if (!jogo_id) return NextResponse.json({ success: false, error: "jogo_id é obrigatório." }, { status: 400 });

      // 1. Marca jogo como finalizado
      const { data: match, error: matchError } = await supabaseAdmin
        .from("jogos")
        .update({ finalizado: true })
        .eq("id", jogo_id)
        .select()
        .single();

      if (matchError) throw matchError;

      // Garante que o placar não é nulo antes de calcular (se for nulo, seta para 0x0)
      if (match.gols_casa === null || match.gols_visitante === null) {
        const { data: updatedMatch } = await supabaseAdmin
          .from("jogos")
          .update({
            gols_casa: match.gols_casa ?? 0,
            gols_visitante: match.gols_visitante ?? 0
          })
          .eq("id", jogo_id)
          .select()
          .single();
      }

      // 2. Chama a RPC do postgres para calcular pontos dos participantes
      const { error: rpcError } = await supabaseAdmin.rpc("calcular_pontos_jogo", { p_jogo_id: jogo_id });
      if (rpcError) throw rpcError;

      return NextResponse.json({
        success: true,
        message: "Jogo finalizado e pontuações recalculadas instantaneamente!"
      });
    }

    // ACTION: CLEAN ALL DATA
    if (action === "limpar-tudo") {
      await supabaseAdmin.from("ganhadores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("palpites").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("participantes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("jogos").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      return NextResponse.json({
        success: true,
        message: "Banco de dados limpo com sucesso!"
      });
    }

    return NextResponse.json({ error: "Ação de simulação desconhecida." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro interno no API de simulação:", error);
    return NextResponse.json({ success: false, error: error.message || "Erro desconhecido" }, { status: 500 });
  }
}
