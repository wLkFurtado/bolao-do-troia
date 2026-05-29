"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast, Button, Card, Loading } from "@/components/ui-custom";
import Navbar from "@/components/navbar";
import { formatZoned, isJogoBloqueado, isAcontecendoAgora, isProximas24h } from "@/lib/tempo";
import { calcularPontosPalpite, obterLabelPontuacao } from "@/lib/pontuacao";
import { Calendar, Save, Share2, Sparkles, Trophy, BarChart3, TrendingUp, HelpCircle, Lock } from "lucide-react";
import confetti from "canvas-confetti";

interface Jogo {
  id: string;
  rodada: string;
  grupo: string | null;
  data_hora: string;
  time_casa: string;
  time_visitante: string;
  bandeira_casa: string | null;
  bandeira_visitante: string | null;
  cidade: string | null;
  estadio: string | null;
  gols_casa: number | null;
  gols_visitante: number | null;
  finalizado: boolean;
}

interface Palpite {
  id: string;
  jogo_id: string;
  palpite_casa: number;
  palpite_visitante: number;
  pontos_ganhos: number;
}

export default function BolaoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  
  // Dados do banco
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [palpites, setPalpites] = useState<Record<string, Palpite>>({});
  
  // Estados de formulário local para palpites em digitação
  const [palpitesInputs, setPalpitesInputs] = useState<Record<string, { casa: string; visitante: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [codigoPresenca, setCodigoPresenca] = useState("");

  // Forçar reavaliação de horários a cada 30 segundos
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = localStorage.getItem("participante_id");
    if (!id) {
      showToast("Por favor, faça seu cadastro primeiro!", "warning");
      router.push("/");
      return;
    }
    setParticipantId(id);
    
    // Carrega PIN de presença local se houver
    const savedPin = localStorage.getItem("pin_presenca") || "";
    setCodigoPresenca(savedPin);
    
    // Obter nome do participante
    supabase
      .from("participantes")
      .select("nome")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setParticipantName(data.nome);
      });

    // Carregar jogos e palpites do banco
    const fetchData = async () => {
      try {
        const { data: jogosData, error: jogosError } = await supabase
          .from("jogos")
          .select("*")
          .order("data_hora", { ascending: true });

        if (jogosError) throw jogosError;

        const { data: palpitesData, error: palpitesError } = await supabase
          .from("palpites")
          .select("*")
          .eq("participante_id", id);

        if (palpitesError) throw palpitesError;

        if (jogosData) setJogos(jogosData);
        
        const palpitesMap: Record<string, Palpite> = {};
        const inputsMap: Record<string, { casa: string; visitante: string }> = {};
        
        if (palpitesData) {
          palpitesData.forEach((p: Palpite) => {
            palpitesMap[p.jogo_id] = p;
            inputsMap[p.jogo_id] = {
              casa: p.palpite_casa.toString(),
              visitante: p.palpite_visitante.toString(),
            };
          });
        }
        
        setPalpites(palpitesMap);
        setPalpitesInputs(inputsMap);
      } catch (err) {
        console.error("Erro ao carregar dados do bolão:", err);
        showToast("Erro ao conectar com o banco de dados.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Timer de atualização de UI (30s)
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [router, tick]);

  // Função para salvar palpite
  const handleSavePalpite = async (jogoId: string) => {
    if (!participantId) return;

    const input = palpitesInputs[jogoId];
    if (!input || input.casa === "" || input.visitante === "") {
      showToast("Preencha ambos os placares para enviar seu palpite!", "warning");
      return;
    }

    const golsCasa = parseInt(input.casa);
    const golsVisitante = parseInt(input.visitante);

    if (isNaN(golsCasa) || isNaN(golsVisitante) || golsCasa < 0 || golsVisitante < 0) {
      showToast("Os placares devem ser números válidos maiores que 0!", "warning");
      return;
    }

    if (!codigoPresenca || codigoPresenca.trim() === "") {
      showToast("Digite o Código PIN de Presença do bar para salvar seu palpite!", "warning");
      return;
    }

    setSavingId(jogoId);

    try {
      // Tenta chamar a RPC segura com código de presença
      const { data, error } = await supabase.rpc("salvar_palpite_com_codigo", {
        p_participante_id: participantId,
        p_jogo_id: jogoId,
        p_palpite_casa: golsCasa,
        p_palpite_visitante: golsVisitante,
        p_codigo_presenca: codigoPresenca.trim()
      });

      if (error) {
        // Fallback: se a RPC não existe ainda no banco do cliente, faz o upsert clássico original
        if (error.message.includes("does not exist")) {
          const { data: upsertData, error: upsertError } = await supabase
            .from("palpites")
            .upsert(
              {
                participante_id: participantId,
                jogo_id: jogoId,
                palpite_casa: golsCasa,
                palpite_visitante: golsVisitante,
                atualizado_em: new Date().toISOString(),
              },
              { onConflict: "participante_id,jogo_id" }
            )
            .select()
            .single();

          if (upsertError) throw upsertError;

          if (upsertData) {
            setPalpites((prev) => ({ ...prev, [jogoId]: upsertData }));
            showToast("Palpite registrado com sucesso! Boa sorte! 🍀", "success");
            confetti({
              particleCount: 80,
              spread: 50,
              origin: { y: 0.8 },
              colors: ["#D4AF37", "#B91C1C", "#FFFFFF"],
            });
          }
          return;
        }
        throw error;
      }

      // Processa retorno JSON da RPC
      const result = typeof data === "string" ? JSON.parse(data) : data;

      if (result && !result.success) {
        showToast(result.error || "Código de presença inválido!", "error");
        return;
      }

      if (result && result.success) {
        const mockPalpite = {
          id: result.palpite_id || Math.random().toString(),
          jogo_id: jogoId,
          palpite_casa: golsCasa,
          palpite_visitante: golsVisitante,
          pontos_ganhos: 0
        };

        setPalpites((prev) => ({ ...prev, [jogoId]: mockPalpite }));
        showToast("Palpite registrado com sucesso! Boa sorte! 🍀", "success");
        
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 },
          colors: ["#D4AF37", "#B91C1C", "#FFFFFF"],
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Não foi possível salvar o palpite. Jogo encerrado?", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleInputChange = (jogoId: string, lado: "casa" | "visitante", valor: string) => {
    // Filtrar para aceitar apenas dígitos numéricos até 2 dígitos
    const filtrado = valor.replace(/\D/g, "").substring(0, 2);
    setPalpitesInputs((prev) => ({
      ...prev,
      [jogoId]: {
        ...prev[jogoId],
        [lado]: filtrado,
      },
    }));
  };

  // Compartilhamento no WhatsApp
  const handleShareWhatsApp = (jogo: Jogo, inputCasa: string, inputVisitante: string) => {
    const placar = `${inputCasa} x ${inputVisitante}`;
    const texto = `Apostei ${jogo.time_casa} ${placar} ${jogo.time_visitante} no Bolão do Troia Lounge! 🏆⚽ Venha palpitar e torcer com a gente também! Faça o seu cadastro pelo link: ${window.location.origin}/?ref=${participantId}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  // Identificar se a data corresponde a jogo do Brasil para o tema Verde-Amarelo
  const isBrasilMatch = (jogo: Jogo) => {
    return jogo.time_casa === "Brasil" || jogo.time_visitante === "Brasil";
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex flex-col justify-center items-center">
        <Loading size="lg" />
        <span className="text-xs uppercase tracking-wider text-muted font-display font-semibold mt-4">
          Carregando arena do Troia...
        </span>
      </div>
    );
  }

  // Filtrar jogos pelas categorias da especificação
  const jogosAcontecendoAgora = jogos.filter((j) => isAcontecendoAgora(j.data_hora) && !j.finalizado);
  const jogosProximos = jogos.filter((j) => isProximas24h(j.data_hora) && !j.finalizado);
  
  // Palpites já computados e salvos (Meus palpites)
  const meusPalpitesCompletos = jogos.filter((j) => palpites[j.id]);

  // --- CÁLCULO DE ESTATÍSTICAS PESSOAIS DO PALPITADOR ---
  const totalPalpites = meusPalpitesCompletos.length;
  const palpitesFinalizados = meusPalpitesCompletos.filter((j) => j.finalizado);
  const totalPontos = meusPalpitesCompletos.reduce((acc, j) => acc + (palpites[j.id]?.pontos_ganhos || 0), 0);
  
  // Percentual de acerto (palpites finalizados com pontuação > 0)
  const acertos = palpitesFinalizados.filter((j) => (palpites[j.id]?.pontos_ganhos || 0) > 0).length;
  const percentualAcerto = palpitesFinalizados.length > 0 ? Math.round((acertos / palpitesFinalizados.length) * 100) : 0;
  
  // Contagem de placares exatos (10 pontos)
  const placaresExatosCount = palpitesFinalizados.filter((j) => (palpites[j.id]?.pontos_ganhos || 0) === 10).length;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">
      <Navbar />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 mt-6">
        {/* Painel de boas-vindas */}
        <div className="relative rounded-2xl glass p-6 overflow-hidden border-primary/20 bg-zinc-950/40 mb-8 gold-glow">
          <div className="absolute top-0 right-0 w-[40%] h-[150%] bg-primary/5 rotate-12 blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
            <div>
              <span className="text-[10px] text-primary tracking-widest font-display font-black uppercase">
                Área de Palpites
              </span>
              <h2 className="text-xl md:text-2xl font-display font-extrabold uppercase text-foreground leading-tight mt-1">
                Fala, <span className="text-primary">{participantName.split(" ")[0]}</span>! ⚽
              </h2>
              <p className="text-xs text-muted font-sans mt-1">
                Digite seus placares. O bloqueio ocorre automaticamente <strong className="text-primary">5 minutos após</strong> o início de cada jogo!
              </p>
            </div>
            
            {/* Widget de Estatísticas */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl select-none">
              <div className="text-center px-1">
                <span className="text-[10px] text-muted block uppercase tracking-wider font-display font-bold">
                  Palpites
                </span>
                <span className="text-lg font-display font-extrabold text-foreground">
                  {totalPalpites}
                </span>
              </div>
              <div className="text-center px-1 border-x border-zinc-800/80">
                <span className="text-[10px] text-muted block uppercase tracking-wider font-display font-bold">
                  Acertos %
                </span>
                <span className="text-lg font-display font-extrabold text-primary flex items-center justify-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {percentualAcerto}%
                </span>
              </div>
              <div className="text-center px-1">
                <span className="text-[10px] text-muted block uppercase tracking-wider font-display font-bold">
                  Placar Exato
                </span>
                <span className="text-lg font-display font-extrabold text-accent">
                  🎯 {placaresExatosCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- 1. SEÇÃO: ACONTECENDO AGORA (LIVE) --- */}
        {jogosAcontecendoAgora.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-accent rounded-full animate-live-pulse flex-shrink-0" />
              <h3 className="text-sm font-display uppercase tracking-widest font-extrabold text-accent">
                Acontecendo Agora (Janela Quente)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jogosAcontecendoAgora.map((jogo) => {
                const bloqueado = isJogoBloqueado(jogo.data_hora);
                const inputVal = palpitesInputs[jogo.id] || { casa: "", visitante: "" };
                const salvo = palpites[jogo.id];
                
                return (
                  <Card
                    key={jogo.id}
                    variant={isBrasilMatch(jogo) ? "gold" : "dark"}
                    hoverable={false}
                    className={`relative ${
                      isBrasilMatch(jogo)
                        ? "border-2 border-amber-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] bg-gradient-to-br from-amber-950/20 via-zinc-950/80 to-emerald-950/15"
                        : "bg-zinc-950/60 border-zinc-800"
                    } ${bloqueado ? "opacity-75" : ""}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-muted uppercase tracking-wider font-medium font-sans">
                        {jogo.rodada} {jogo.grupo ? `| Grupo ${jogo.grupo}` : ""}
                      </span>
                      {bloqueado ? (
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-display">
                          🔒 Palpites encerrados
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-display animate-pulse flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          ÚLTIMOS MINUTOS
                        </span>
                      )}
                    </div>

                    {/* Arena do Palpite */}
                    <div className="flex items-center justify-between gap-2 py-2">
                      {/* Casa */}
                      <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                        {jogo.bandeira_casa && (
                          <img
                            src={jogo.bandeira_casa}
                            alt={jogo.time_casa}
                            className="w-10 h-7 object-cover rounded shadow-sm border border-zinc-800/80"
                          />
                        )}
                        <span className="text-xs font-bold leading-tight font-sans line-clamp-1">{jogo.time_casa}</span>
                      </div>

                      {/* Inputs numéricos */}
                      <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 p-2 rounded-xl">
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={inputVal.casa}
                          onChange={(e) => handleInputChange(jogo.id, "casa", e.target.value)}
                          disabled={bloqueado || savingId === jogo.id}
                          className="w-8 h-8 text-center text-lg font-bold font-display bg-background border border-zinc-700/80 rounded-lg text-primary focus:border-primary focus:outline-none disabled:opacity-40"
                        />
                        <span className="text-xs font-bold text-muted px-1 font-display">X</span>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={inputVal.visitante}
                          onChange={(e) => handleInputChange(jogo.id, "visitante", e.target.value)}
                          disabled={bloqueado || savingId === jogo.id}
                          className="w-8 h-8 text-center text-lg font-bold font-display bg-background border border-zinc-700/80 rounded-lg text-primary focus:border-primary focus:outline-none disabled:opacity-40"
                        />
                      </div>

                      {/* Visitante */}
                      <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                        {jogo.bandeira_visitante && (
                          <img
                            src={jogo.bandeira_visitante}
                            alt={jogo.time_visitante}
                            className="w-10 h-7 object-cover rounded shadow-sm border border-zinc-800/80"
                          />
                        )}
                        <span className="text-xs font-bold leading-tight font-sans line-clamp-1">{jogo.time_visitante}</span>
                      </div>
                    </div>

                    {/* Botões Ação */}
                    {!bloqueado && (
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-900">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs py-2"
                          disabled={savingId === jogo.id}
                          onClick={() => handleSavePalpite(jogo.id)}
                        >
                          <Save className="w-4 h-4" />
                          {salvo ? "Atualizar" : "Salvar Palpite"}
                        </Button>
                        
                        {salvo && (
                          <button
                            onClick={() => handleShareWhatsApp(jogo, inputVal.casa, inputVal.visitante)}
                            className="p-2 bg-zinc-900 border border-zinc-800 text-muted hover:text-emerald-400 hover:border-emerald-400/20 rounded-lg transition-colors"
                            title="Compartilhar no WhatsApp"
                          >
                            <Share2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* --- 2. SEÇÃO: PRÓXIMOS JOGOS (24H) --- */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display uppercase tracking-widest font-extrabold text-primary flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-primary" />
              Próximos Jogos (Próximas 24 horas)
            </h3>
            <span className="text-[10px] text-muted">Brasília: GMT-3</span>
          </div>

          {jogosProximos.length === 0 ? (
            <div className="p-6 rounded-xl border border-zinc-800/60 bg-zinc-950/20 text-center select-none">
              <p className="text-xs text-muted">Nenhum jogo agendado para as próximas 24 horas.</p>
              <p className="text-[10px] text-zinc-600 mt-1">Os próximos palpites serão ativados de acordo com o calendário da FIFA.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jogosProximos.map((jogo) => {
                const inputVal = palpitesInputs[jogo.id] || { casa: "", visitante: "" };
                const salvo = palpites[jogo.id];
                const brasilMatch = isBrasilMatch(jogo);

                return (
                  <Card
                    key={jogo.id}
                    variant={brasilMatch ? "gold" : "dark"}
                    hoverable={false}
                    className={`relative ${
                      brasilMatch
                        ? "border-2 border-amber-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] bg-gradient-to-br from-amber-950/20 via-zinc-950/80 to-emerald-950/15"
                        : "bg-zinc-950/60 border-zinc-800"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-muted uppercase tracking-wider font-semibold">
                        {jogo.rodada} {jogo.grupo ? `| Grupo ${jogo.grupo}` : ""}
                      </span>
                      <span className="text-[10px] text-primary font-bold font-display uppercase">
                        🕒 {formatZoned(jogo.data_hora, "dd/MM HH:mm")}h
                      </span>
                    </div>

                    {/* Arena do Palpite */}
                    <div className="flex items-center justify-between gap-2 py-2">
                      {/* Casa */}
                      <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                        {jogo.bandeira_casa ? (
                          <img
                            src={jogo.bandeira_casa}
                            alt={jogo.time_casa}
                            className="w-10 h-7 object-cover rounded shadow-sm border border-zinc-800/80"
                          />
                        ) : (
                          <div className="w-10 h-7 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs">⚽</div>
                        )}
                        <span className="text-xs font-bold leading-tight font-sans line-clamp-1">{jogo.time_casa}</span>
                      </div>

                      {/* Inputs numéricos */}
                      <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 p-2 rounded-xl">
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={inputVal.casa}
                          onChange={(e) => handleInputChange(jogo.id, "casa", e.target.value)}
                          disabled={savingId === jogo.id}
                          className="w-8 h-8 text-center text-lg font-bold font-display bg-background border border-zinc-700/80 rounded-lg text-primary focus:border-primary focus:outline-none disabled:opacity-40"
                        />
                        <span className="text-xs font-bold text-muted px-1 font-display">X</span>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={inputVal.visitante}
                          onChange={(e) => handleInputChange(jogo.id, "visitante", e.target.value)}
                          disabled={savingId === jogo.id}
                          className="w-8 h-8 text-center text-lg font-bold font-display bg-background border border-zinc-700/80 rounded-lg text-primary focus:border-primary focus:outline-none disabled:opacity-40"
                        />
                      </div>

                      {/* Visitante */}
                      <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                        {jogo.bandeira_visitante ? (
                          <img
                            src={jogo.bandeira_visitante}
                            alt={jogo.time_visitante}
                            className="w-10 h-7 object-cover rounded shadow-sm border border-zinc-800/80"
                          />
                        ) : (
                          <div className="w-10 h-7 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs">⚽</div>
                        )}
                        <span className="text-xs font-bold leading-tight font-sans line-clamp-1">{jogo.time_visitante}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-muted px-2 py-1 mt-2 bg-zinc-900/30 rounded border border-zinc-900">
                      <span>🏟️ {jogo.estadio}</span>
                      <span>📍 {jogo.cidade}</span>
                    </div>

                    {/* Botões Ação */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-900">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 gap-1.5 text-xs py-2"
                        disabled={savingId === jogo.id}
                        onClick={() => handleSavePalpite(jogo.id)}
                      >
                        <Save className="w-4 h-4" />
                        {salvo ? "Atualizar Palpite" : "Salvar Palpite"}
                      </Button>
                      
                      {salvo && (
                        <button
                          onClick={() => handleShareWhatsApp(jogo, inputVal.casa, inputVal.visitante)}
                          className="p-2 bg-zinc-900 border border-zinc-800 text-muted hover:text-emerald-400 hover:border-emerald-400/20 rounded-lg transition-colors"
                          title="Compartilhar no WhatsApp"
                        >
                          <Share2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* --- 3. SEÇÃO: MEUS PALPITES (HISTÓRICO) --- */}
        <div>
          <h3 className="text-sm font-display uppercase tracking-widest font-extrabold text-foreground mb-4 flex items-center gap-1.5">
            <Trophy className="w-4.5 h-4.5 text-primary" />
            Meus Palpites Registrados
          </h3>

          {meusPalpitesCompletos.length === 0 ? (
            <div className="p-8 rounded-xl border border-zinc-800/60 bg-zinc-950/20 text-center select-none">
              <p className="text-xs text-muted">Você ainda não registrou nenhum palpite!</p>
              <p className="text-[10px] text-primary mt-1 uppercase font-display font-semibold">Escolha um dos próximos jogos acima e participe! 🚀</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {meusPalpitesCompletos.map((jogo) => {
                const palpite = palpites[jogo.id];
                const finalizado = jogo.finalizado;
                const ptsGanhos = palpite?.pontos_ganhos || 0;
                const labelPts = obterLabelPontuacao(ptsGanhos);

                return (
                  <div
                    key={jogo.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                      finalizado
                        ? ptsGanhos > 0
                          ? "bg-emerald-950/15 border-emerald-900/40"
                          : "bg-zinc-900/20 border-zinc-900"
                        : "bg-secondary/60 border-zinc-800/80"
                    }`}
                  >
                    {/* Infos do Jogo */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-muted uppercase font-bold tracking-wider font-display">
                        {jogo.rodada} {jogo.grupo ? `| Grupo ${jogo.grupo}` : ""}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {jogo.time_casa} x {jogo.time_visitante}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {formatZoned(jogo.data_hora, "dd/MM 'às' HH:mm")}h - {jogo.estadio}
                      </span>
                    </div>

                    {/* Comparador de Placar */}
                    <div className="flex items-center justify-center gap-6 bg-zinc-950/60 border border-zinc-900 p-2.5 rounded-xl select-none">
                      {/* Palpite */}
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-primary uppercase font-bold tracking-widest font-display">Seu Voto</span>
                        <span className="text-sm font-display font-bold text-foreground">
                          {palpite.palpite_casa} x {palpite.palpite_visitante}
                        </span>
                      </div>
                      
                      {/* Divisor */}
                      <div className="w-[1px] h-6 bg-zinc-800" />
                      
                      {/* Jogo Real */}
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-muted uppercase font-bold tracking-widest font-display">Placar Real</span>
                        <span className={`text-sm font-display font-bold ${finalizado ? "text-foreground" : "text-zinc-500 italic"}`}>
                          {finalizado ? `${jogo.gols_casa} x ${jogo.gols_visitante}` : "Aguardando"}
                        </span>
                      </div>
                    </div>

                    {/* Status & Pontos */}
                    <div className="flex items-center justify-end gap-3 min-w-[130px]">
                      {finalizado ? (
                        <span className={`text-[10px] uppercase font-bold font-display px-2.5 py-1 rounded border shadow-sm ${labelPts.classe}`}>
                          {labelPts.label}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider font-display">
                            Confirmado
                          </span>
                        </div>
                      )}

                      {/* Botão de compartilhar no WhatsApp mesmo após salvo */}
                      <button
                        onClick={() => handleShareWhatsApp(jogo, palpite.palpite_casa.toString(), palpite.palpite_visitante.toString())}
                        className="p-1.5 bg-zinc-900 border border-zinc-800 text-muted hover:text-emerald-400 rounded transition-colors"
                        title="Compartilhar no WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
