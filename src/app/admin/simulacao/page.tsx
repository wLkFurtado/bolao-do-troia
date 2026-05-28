"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, useToast, Loading } from "@/components/ui-custom";
import {
  Zap,
  Users,
  Trash2,
  Trophy,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Eye,
  Info,
  CalendarDays,
  Play
} from "lucide-react";

interface Jogo {
  id: string;
  rodada: string;
  grupo: string;
  data_hora: string;
  time_casa: string;
  time_visitante: string;
  bandeira_casa: string;
  bandeira_visitante: string;
  gols_casa: number | null;
  gols_visitante: number | null;
  finalizado: boolean;
}

interface Participante {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  pontos_total: number;
}

interface Palpite {
  id: string;
  participante_id: string;
  jogo_id: string;
  palpite_casa: number;
  palpite_visitante: number;
  pontos_ganhos: number;
}

export default function SimulationDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState({ participantes: 0, jogos: 0, palpites: 0 });
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  
  // Participante selecionado para auditoria
  const [selectedParticipant, setSelectedParticipant] = useState<Participante | null>(null);
  const [selectedParticipantPalpites, setSelectedParticipantPalpites] = useState<(Palpite & { jogo?: Jogo })[]>([]);
  const [isAuditingModalOpen, setIsAuditingModalOpen] = useState(false);

  // Estados locais para controlar ações de rede
  const [fakeCount, setFakeCount] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);

  // Carrega contagens básicas da API de simulação
  const loadDbStats = useCallback(async () => {
    try {
      const response = await fetch("/api/simulacao");
      const data = await response.json();
      if (data.success) {
        setDbStats(data.status);
      }
    } catch (err) {
      console.error("Erro ao buscar estatísticas da simulação:", err);
    }
  }, []);

  // Carrega dados detalhados (Jogos, Participantes, Palpites) usando Supabase Client
  const loadDetailedData = useCallback(async () => {
    try {
      // 1. Jogos ordenados pela data
      const { data: jogosData } = await supabase
        .from("jogos")
        .select("*")
        .order("data_hora", { ascending: true });
      setJogos(jogosData || []);

      // 2. Participantes ordenados pelos pontos desc
      const { data: partData } = await supabase
        .from("participantes")
        .select("*")
        .order("pontos_total", { ascending: false });
      setParticipantes(partData || []);

      // 3. Palpites para cruzar
      const { data: palpiteData } = await supabase.from("palpites").select("*");
      setPalpites(palpiteData || []);
    } catch (err) {
      console.error("Erro ao carregar dados detalhados:", err);
    }
  }, []);

  const initData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDbStats(), loadDetailedData()]);
    setLoading(false);
  }, [loadDbStats, loadDetailedData]);

  useEffect(() => {
    initData();
  }, [initData]);

  // RESETAR BANCO E GERAR JOGOS MOCK
  const handleSeedMock = async () => {
    if (!confirm("Isso excluirá TODOS os dados atuais (incluindo usuários e palpites reais) para reiniciar a simulação. Deseja continuar?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch("/api/simulacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed-mock" })
      });
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message, "success");
        await initData();
      } else {
        showToast(data.error || "Erro ao resetar banco.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Falha na conexão com a API.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // LIMPAR BANCO COMPLETAMENTE
  const handleClearAll = async () => {
    if (!confirm("Deseja apagar completamente todos os registros do bolão? O banco ficará totalmente limpo.")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch("/api/simulacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "limpar-tudo" })
      });
      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        await initData();
      } else {
        showToast(data.error || "Erro ao limpar dados.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Falha na conexão.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // GERAR PARTICIPANTES E PALPITES FAKE
  const handleSeedFakeParticipants = async () => {
    if (jogos.length === 0) {
      showToast("Gere os Jogos de Simulação primeiro!", "warning");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch("/api/simulacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed-fake-participants", count: fakeCount })
      });
      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        await initData();
      } else {
        showToast(data.error || "Erro ao gerar participantes simulados.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Falha na conexão.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // SIMULAR PLACAR DE JOGO (GOLS)
  const handleSimulateGoal = async (jogoId: string, time: "casa" | "visitante", golsAtuais: number | null, delta: number) => {
    try {
      const novosGols = Math.max(0, (golsAtuais ?? 0) + delta);
      
      const response = await fetch("/api/simulacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simular-gol",
          jogo_id: jogoId,
          time,
          gols: novosGols
        })
      });
      const data = await response.json();

      if (data.success) {
        // Atualiza estado local de forma otimista
        setJogos(prev =>
          prev.map(j =>
            j.id === jogoId
              ? {
                  ...j,
                  gols_casa: time === "casa" ? novosGols : j.gols_casa,
                  gols_visitante: time === "visitante" ? novosGols : j.gols_visitante
                }
              : j
          )
        );
        // Atualiza base inteira por segurança se recalculou
        if (data.jogo?.finalizado) {
          await loadDetailedData();
        }
      } else {
        showToast(data.error || "Erro ao atualizar placar.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Erro de rede.", "error");
    }
  };

  // FINALIZAR JOGO E CALCULAR PONTOS DEFINITIVOS
  const handleFinalizeMatch = async (jogoId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/simulacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalizar-jogo",
          jogo_id: jogoId
        })
      });
      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        await initData();
      } else {
        showToast(data.error || "Erro ao finalizar jogo.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Erro de conexão.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // EXIBIR DETALHES DE AUDITORIA DE UM PARTICIPANTE
  const openAuditing = (participante: Participante) => {
    const userPalpites = palpites
      .filter(p => p.participante_id === participante.id)
      .map(palpite => {
        const jogo = jogos.find(j => j.id === palpite.jogo_id);
        return { ...palpite, jogo };
      });

    setSelectedParticipant(participante);
    setSelectedParticipantPalpites(userPalpites);
    setIsAuditingModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Zap className="w-5 h-5 text-primary" />
            </span>
            <h2 className="text-xl font-display uppercase tracking-widest font-black text-foreground">
              Simulador & Depuração de Regras
            </h2>
          </div>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Painel interativo para testar o sistema em tempo real. Simule palpites de dezenas de clientes, mude placares ao vivo e audite o cálculo de pontos do Supabase de forma imediata.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={initData}
          className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-800"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || actionLoading) ? "animate-spin" : ""}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Grid de Estatísticas Atuais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable={false} variant="dark" className="border border-zinc-800 flex items-center gap-4 p-4">
          <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-display tracking-wider text-muted font-bold">Jogos no Banco</span>
            <span className="text-2xl font-display font-black text-foreground">{dbStats.jogos}</span>
          </div>
        </Card>
        <Card hoverable={false} variant="dark" className="border border-zinc-800 flex items-center gap-4 p-4">
          <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-display tracking-wider text-muted font-bold">Clientes Simulados</span>
            <span className="text-2xl font-display font-black text-foreground">{dbStats.participantes}</span>
          </div>
        </Card>
        <Card hoverable={false} variant="dark" className="border border-zinc-800 flex items-center gap-4 p-4">
          <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-display tracking-wider text-muted font-bold">Palpites Totais</span>
            <span className="text-2xl font-display font-black text-foreground">{dbStats.palpites}</span>
          </div>
        </Card>
      </div>

      {/* Painel de Controle Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel de ações do banco */}
        <Card variant="gold" hoverable={false} className="lg:col-span-2 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-md font-display uppercase tracking-widest font-bold text-foreground">
              Ações Rápidas de Simulação
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Box 1: Semear Jogos Mock */}
            <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider font-bold text-primary font-display">Passo 1: Resetar & Mockar Jogos</span>
              <p className="text-[11px] text-muted leading-relaxed">
                Limpa todas as tabelas e adiciona os 4 jogos relativos ao tempo atual para validar os fluxos ativos, bloqueados por tempo e finalizados.
              </p>
              <Button
                variant="primary"
                onClick={handleSeedMock}
                disabled={actionLoading}
                className="w-full mt-auto flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Resetar & Mockar Jogos
              </Button>
            </div>

            {/* Box 2: Gerar Participantes Falsos */}
            <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 font-display">Passo 2: Criar Clientes com Palpites</span>
              <p className="text-[11px] text-muted leading-relaxed">
                Adiciona clientes virtuais com palpites aleatórios salvos em todos os jogos, simulando o banco de dados cheio.
              </p>
              <div className="flex items-center gap-2 w-full mt-auto">
                <select
                  value={fakeCount}
                  onChange={(e) => setFakeCount(Number(e.target.value))}
                  className="px-2.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-xs focus:outline-none w-20"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <Button
                  variant="outline"
                  onClick={handleSeedFakeParticipants}
                  disabled={actionLoading || jogos.length === 0}
                  className="flex-1 text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30 flex items-center justify-center gap-2 text-xs"
                >
                  <Users className="w-4 h-4" />
                  Gerar Participantes
                </Button>
              </div>
            </div>

          </div>

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-xs text-muted">
            <span className="flex items-center gap-1.5 text-[10px] bg-zinc-900 border border-zinc-800/80 px-2 py-1 rounded-md text-zinc-400 font-medium">
              <Info className="w-3.5 h-3.5" />
              Service Role ativa bypassando RLS nos bastidores.
            </span>
            <button
              onClick={handleClearAll}
              disabled={actionLoading}
              className="text-accent hover:underline flex items-center gap-1 uppercase font-display font-bold tracking-wider text-[10px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Banco Totalmente
            </button>
          </div>
        </Card>

        {/* Card informativo de regras */}
        <Card variant="red" hoverable={false} className="p-6 flex flex-col gap-4 border-accent/20 bg-zinc-950/80">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="text-md font-display uppercase tracking-widest font-bold text-foreground">
              Pontuação Copa 2026
            </h3>
          </div>
          <div className="flex flex-col gap-3 text-xs leading-relaxed text-muted">
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span className="text-foreground font-semibold">Placar Exato:</span>
              <span className="text-primary font-bold">10 pontos</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span className="text-foreground font-semibold">Vitória & Saldo de Gols Exato:</span>
              <span className="text-emerald-400 font-bold">7 pontos</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span className="text-foreground font-semibold">Apenas Vencedor ou Empate Diferente:</span>
              <span className="text-yellow-500 font-bold">5 pontos</span>
            </div>
            <div className="flex justify-between pb-1.5">
              <span className="text-foreground font-semibold">Errou tudo:</span>
              <span className="text-zinc-500 font-bold">0 pontos</span>
            </div>
            <div className="mt-3 p-2 bg-accent/5 border border-accent/20 rounded-lg text-[10px] text-zinc-400">
              <span className="font-bold text-accent uppercase block mb-0.5">Regra Temporal</span>
              A trigger PostgreSQL bloqueia palpites criados ou modificados <strong>5 minutos após o início</strong> do jogo.
            </div>
          </div>
        </Card>

      </div>

      {/* Simulador de Placar em Tempo Real */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display uppercase tracking-widest font-black text-foreground">
            1. Jogos de Simulação & Controle de Gols
          </h3>
        </div>

        {jogos.length === 0 ? (
          <div className="bg-zinc-950/40 border border-zinc-900 p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-4">
            <AlertTriangle className="w-8 h-8 text-zinc-600" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-foreground">Nenhum jogo de simulação encontrado</h4>
              <p className="text-xs text-muted">Use as Ações Rápidas acima para criar os jogos no banco.</p>
            </div>
            <Button variant="primary" size="sm" onClick={handleSeedMock} disabled={actionLoading}>
              Gerar Jogos de Simulação
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jogos.map((jogo) => {
              // Determina badge de status do jogo
              const agora = new Date();
              const jogoTime = new Date(jogo.data_hora);
              const startsInMin = Math.round((jogoTime.getTime() - agora.getTime()) / (60 * 1000));
              
              let statusLabel = "";
              let statusClass = "";
              
              if (jogo.finalizado) {
                statusLabel = "Finalizado";
                statusClass = "bg-primary/10 border-primary/20 text-primary";
              } else if (startsInMin < -5) {
                statusLabel = "Acontecendo Agora (Palpites Bloqueados)";
                statusClass = "bg-accent/10 border-accent/20 text-accent";
              } else if (startsInMin <= 5 && startsInMin >= -5) {
                statusLabel = "Pronto / Começando Agora";
                statusClass = "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
              } else {
                statusLabel = `Futuro (Palpites Liberados - Começa em ${startsInMin}m)`;
                statusClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
              }

              return (
                <Card
                  key={jogo.id}
                  hoverable={false}
                  variant={jogo.finalizado ? "dark" : "gold"}
                  className={`p-5 border flex flex-col gap-4 bg-zinc-950 ${jogo.finalizado ? "border-zinc-800/80" : "border-zinc-800"}`}
                >
                  <div className="flex justify-between items-start border-b border-zinc-900 pb-2.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted font-bold font-display">
                        {jogo.rodada} • {jogo.grupo}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(jogo.data_hora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Fuso BSB)
                      </span>
                    </div>
                    <span className={`text-[9px] font-display uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full border ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Arena de Placar */}
                  <div className="flex items-center justify-between py-2 px-4 bg-zinc-900/40 rounded-xl border border-zinc-900">
                    
                    {/* Time Casa */}
                    <div className="flex flex-col items-center gap-1.5 w-1/3 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={jogo.bandeira_casa} alt={jogo.time_casa} className="w-8 h-5.5 object-cover rounded shadow-md border border-zinc-800" />
                      <span className="text-xs font-display uppercase tracking-wider font-extrabold text-foreground leading-none mt-1">
                        {jogo.time_casa}
                      </span>
                      {!jogo.finalizado && (
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleSimulateGoal(jogo.id, "casa", jogo.gols_casa, -1)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-foreground active:scale-90 transition-all border border-zinc-700"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSimulateGoal(jogo.id, "casa", jogo.gols_casa, 1)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-foreground active:scale-90 transition-all border border-zinc-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Placar central */}
                    <div className="flex items-center gap-3 justify-center w-1/3">
                      <span className="text-3xl font-display font-black text-foreground">
                        {jogo.gols_casa ?? "-"}
                      </span>
                      <span className="text-xs text-muted font-bold font-display uppercase tracking-widest">
                        x
                      </span>
                      <span className="text-3xl font-display font-black text-foreground">
                        {jogo.gols_visitante ?? "-"}
                      </span>
                    </div>

                    {/* Time Visitante */}
                    <div className="flex flex-col items-center gap-1.5 w-1/3 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={jogo.bandeira_visitante} alt={jogo.time_visitante} className="w-8 h-5.5 object-cover rounded shadow-md border border-zinc-800" />
                      <span className="text-xs font-display uppercase tracking-wider font-extrabold text-foreground leading-none mt-1">
                        {jogo.time_visitante}
                      </span>
                      {!jogo.finalizado && (
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleSimulateGoal(jogo.id, "visitante", jogo.gols_visitante, -1)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-foreground active:scale-90 transition-all border border-zinc-700"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSimulateGoal(jogo.id, "visitante", jogo.gols_visitante, 1)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-foreground active:scale-90 transition-all border border-zinc-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Ação de encerramento */}
                  {!jogo.finalizado && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFinalizeMatch(jogo.id)}
                      disabled={actionLoading}
                      className="w-full bg-zinc-900 border-zinc-800 text-foreground hover:bg-primary hover:text-background hover:shadow-[0_0_10px_rgba(212,175,55,0.3)] transition-all font-display uppercase tracking-wider text-[10px]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-primary group-hover:text-background mr-2" />
                      Encerrar e Calcular Pontos
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Auditor de Pontuações de Participantes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-display uppercase tracking-widest font-black text-foreground">
            2. Auditoria & Lista de Clientes (Simulados ou Reais)
          </h3>
        </div>

        {participantes.length === 0 ? (
          <div className="bg-zinc-950/40 border border-zinc-900 p-8 rounded-2xl text-center text-xs text-muted">
            Nenhum participante cadastrado no banco. Gere participantes acima para simular palpites coletivos.
          </div>
        ) : (
          <Card hoverable={false} variant="dark" className="border border-zinc-800/80 p-0 overflow-hidden bg-zinc-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-900 text-[10px] uppercase font-display tracking-wider text-muted font-bold">
                    <th className="px-5 py-3">Posição</th>
                    <th className="px-5 py-3">Nome do Cliente</th>
                    <th className="px-5 py-3">Telefone</th>
                    <th className="px-5 py-3">E-mail</th>
                    <th className="px-5 py-3 text-center">Pontos Acumulados</th>
                    <th className="px-5 py-3 text-right">Depuração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 text-xs font-sans text-foreground">
                  {participantes.slice(0, 15).map((part, index) => (
                    <tr key={part.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 font-display font-bold text-zinc-500">
                        {index + 1}º
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        {part.nome}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {part.telefone}
                      </td>
                      <td className="px-5 py-3.5 text-muted font-mono text-[10px]">
                        {part.email}
                      </td>
                      <td className="px-5 py-3.5 text-center font-display font-black text-primary text-sm">
                        {part.pontos_total} pts
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAuditing(part)}
                          className="text-zinc-400 hover:text-primary p-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Auditar Palpites
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {participantes.length > 15 && (
              <div className="p-3 bg-zinc-950/80 border-t border-zinc-900 text-center text-[10px] text-muted">
                Exibindo os top 15 participantes. Use a tela principal de Participantes para conferir a lista completa de cadastros.
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modal de Auditoria de Palpites do Participante */}
      {isAuditingModalOpen && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsAuditingModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl p-6 glass gold-glow rounded-xl z-10 border border-primary/20 animate-in fade-in zoom-in duration-300 max-h-[85vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-display tracking-widest font-black text-primary">Auditoria de Precisão</span>
                <h3 className="text-md font-display uppercase tracking-wider font-extrabold text-foreground mt-0.5">
                  {selectedParticipant.nome}
                </h3>
              </div>
              <button
                onClick={() => setIsAuditingModalOpen(false)}
                className="text-muted hover:text-foreground transition-colors p-1 rounded-full hover:bg-white/5"
              >
                fechar
              </button>
            </div>

            {/* Corpo Modal */}
            <div className="overflow-y-auto pr-1 flex-1 flex flex-col gap-4">
              
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-3 rounded-lg border border-zinc-900 text-xs">
                <div>
                  <span className="text-zinc-500 uppercase text-[9px] block">E-mail</span>
                  <span className="font-mono text-zinc-300">{selectedParticipant.email}</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase text-[9px] block">Pontuação Total Calculada</span>
                  <span className="text-primary font-display font-black text-sm">{selectedParticipant.pontos_total} pts</span>
                </div>
              </div>

              {/* Tabela dos palpites */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted font-display">Tabela Analítica de Pontuação</span>
                
                {selectedParticipantPalpites.length === 0 ? (
                  <div className="text-center p-6 bg-zinc-900/30 rounded border border-dashed border-zinc-800 text-xs text-muted">
                    Nenhum palpite enviado por este cliente.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {selectedParticipantPalpites.map((palpite) => {
                      const j = palpite.jogo;
                      if (!j) return null;

                      // Determina tipo de acerto para exibir badge explicativo
                      let pontuacaoBadge = "0 pts";
                      let pontuacaoDesc = "Errou o placar e vencedor";
                      let badgeClass = "bg-zinc-900 text-zinc-500 border-zinc-800";

                      if (j.finalizado) {
                        if (palpite.pontos_ganhos === 10) {
                          pontuacaoBadge = "+10 pts";
                          pontuacaoDesc = "Placar Exato Certeiro";
                          badgeClass = "bg-primary/20 text-primary border-primary/30";
                        } else if (palpite.pontos_ganhos === 7) {
                          pontuacaoBadge = "+7 pts";
                          pontuacaoDesc = "Acertou Vencedor + Saldo Exato";
                          badgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                        } else if (palpite.pontos_ganhos === 5) {
                          pontuacaoBadge = "+5 pts";
                          pontuacaoDesc = "Acertou Vencedor/Empate (Saldo Dif.)";
                          badgeClass = "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
                        }
                      } else {
                        pontuacaoBadge = "Pendente";
                        pontuacaoDesc = "Aguardando encerramento do jogo";
                        badgeClass = "bg-zinc-900 text-zinc-400 border-zinc-800";
                      }

                      return (
                        <div
                          key={palpite.id}
                          className={`p-3 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/60 ${j.finalizado ? "border-zinc-900" : "border-zinc-900/40"}`}
                        >
                          {/* Jogo */}
                          <div className="flex flex-col gap-1 w-full sm:w-1/3">
                            <span className="text-[9px] uppercase tracking-wider text-muted font-display font-medium">
                              {j.rodada}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <span>{j.time_casa}</span>
                              <span className="text-[10px] text-zinc-500 font-normal">x</span>
                              <span>{j.time_visitante}</span>
                            </div>
                          </div>

                          {/* Placar real vs palpite */}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-zinc-500 uppercase font-medium">Palpite</span>
                              <span className="font-display font-black text-foreground text-sm">
                                {palpite.palpite_casa} x {palpite.palpite_visitante}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] text-zinc-500 uppercase font-medium">Real</span>
                              <span className="font-display font-black text-primary text-sm">
                                {j.gols_casa ?? "-"} x {j.gols_visitante ?? "-"}
                              </span>
                            </div>
                          </div>

                          {/* Pontos calculados */}
                          <div className="flex sm:flex-col items-end gap-1.5 sm:gap-0.5 ml-auto sm:ml-0">
                            <span className={`text-[9px] font-display uppercase font-black px-2 py-0.5 rounded border ${badgeClass}`}>
                              {pontuacaoBadge}
                            </span>
                            <span className="text-[9px] text-zinc-500 hidden sm:inline">
                              {pontuacaoDesc}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-end flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsAuditingModalOpen(false)}>
                Fechar Auditoria
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
