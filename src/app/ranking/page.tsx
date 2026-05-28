"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast, Card, Loading } from "@/components/ui-custom";
import Navbar from "@/components/navbar";
import { Trophy, Search, RefreshCw, Star, Medal, Award, Flame } from "lucide-react";

interface ParticipanteRanking {
  id: string;
  nome: string;
  pontos_total: number;
  telefone: string;
  criado_em: string;
  posicao?: number;
  pontos_rodada?: number; // Para cálculo dinâmico por rodada
}

interface Jogo {
  id: string;
  rodada: string;
  finalizado: boolean;
}

interface Palpite {
  id: string;
  participante_id: string;
  jogo_id: string;
  pontos_ganhos: number;
}

export default function RankingPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [participantes, setParticipantes] = useState<ParticipanteRanking[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  
  // Filtros e buscas
  const [busca, setBusca] = useState("");
  const [filtroRodada, setFiltroRodada] = useState("GERAL"); // GERAL ou nome da rodada
  const [rodadasDisponiveis, setRodadasDisponiveis] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const formatarNomePrivado = (nomeCompleto: string): string => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return partes[0];
    const primeiroNome = partes[0];
    const ultimoSobrenome = partes[partes.length - 1];
    return `${primeiroNome} ${ultimoSobrenome.charAt(0)}.`;
  };

  const loadRankingData = async () => {
    try {
      // 1. Carregar todos os participantes
      const { data: partsData, error: partsError } = await supabase
        .from("participantes")
        .select("id, nome, pontos_total, criado_em, telefone")
        .order("pontos_total", { ascending: false });

      if (partsError) throw partsError;

      // 2. Carregar jogos finalizados para rodadas
      const { data: jogosData, error: jogosError } = await supabase
        .from("jogos")
        .select("id, rodada, finalizado");

      if (jogosError) throw jogosError;

      // 3. Carregar palpites
      const { data: palpitesData, error: palpitesError } = await supabase
        .from("palpites")
        .select("id, participante_id, jogo_id, pontos_ganhos");

      if (palpitesError) throw palpitesError;

      if (partsData) setParticipantes(partsData);
      if (jogosData) {
        setJogos(jogosData);
        // Extrair rodadas únicas disponíveis
        const rodadas = Array.from(new Set(jogosData.map((j) => j.rodada)));
        setRodadasDisponiveis(rodadas);
      }
      if (palpitesData) setPalpites(palpitesData);

    } catch (err) {
      console.error("Erro ao carregar dados do ranking:", err);
      showToast("Não foi possível atualizar o ranking.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRankingData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRankingData();
  };

  // --- CÁLCULO DINÂMICO DE CLASSIFICAÇÃO COM FILTROS ---
  const obterRankingFiltrado = (): ParticipanteRanking[] => {
    if (filtroRodada === "GERAL") {
      // Ordenação simples por pontos_total
      return participantes
        .map((p, i) => ({ ...p, posicao: i + 1 }))
        .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
        .slice(0, 50); // Apenas Top 50 conforme especificação
    } else {
      // Filtrar jogos correspondentes à rodada escolhida
      const jogosDaRodada = jogos.filter((j) => j.rodada === filtroRodada).map((j) => j.id);
      
      // Calcular pontos acumulados de cada participante nesta rodada
      const rankingRodada = participantes.map((p) => {
        const palpitesDaRodada = palpites.filter(
          (palpite) => palpite.participante_id === p.id && jogosDaRodada.includes(palpite.jogo_id)
        );
        const somaPontos = palpitesDaRodada.reduce((acc, curr) => acc + curr.pontos_ganhos, 0);
        return {
          ...p,
          pontos_rodada: somaPontos,
        };
      });

      // Ordenar por pontos da rodada, decrescente
      return rankingRodada
        .sort((a, b) => (b.pontos_rodada || 0) - (a.pontos_rodada || 0))
        .map((p, i) => ({ ...p, posicao: i + 1 }))
        .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
        .slice(0, 50);
    }
  };

  const rankingExibido = obterRankingFiltrado();
  const topTres = rankingExibido.slice(0, 3);
  const outrosParticipantes = rankingExibido.slice(3);

  const obterIconePosicao = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <span className="text-2xl animate-bounce">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="font-display font-bold text-zinc-500">{posicao}º</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex flex-col justify-center items-center">
        <Loading size="lg" />
        <span className="text-xs uppercase tracking-wider text-muted font-display font-semibold mt-4">
          Calculando tabelas de liderança...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">
      <Navbar />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Cabeçalho da página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 select-none">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-extrabold uppercase text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Tabela de Classificação
            </h2>
            <p className="text-xs text-muted font-sans mt-0.5">
              Top 50 competidores do Troia. Acompanhe a liderança geral e diária do bar!
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold uppercase font-display text-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando" : "Atualizar"}
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Busca por nome */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar participante pelo nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-sans placeholder:text-zinc-600 transition-all focus:border-primary focus:outline-none"
            />
          </div>

          {/* Seletor de Rodadas */}
          <div className="w-full md:w-64">
            <select
              value={filtroRodada}
              onChange={(e) => setFiltroRodada(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-display font-bold uppercase tracking-wider focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="GERAL">🏆 Acumulado Geral</option>
              {rodadasDisponiveis.map((r) => (
                <option key={r} value={r}>
                  📅 {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- PODIUM TOP 3 (Destaque Premium) --- */}
        {busca === "" && rankingExibido.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2º Lugar */}
            {topTres[1] && (
              <Card
                variant="dark"
                hoverable={false}
                className="order-2 md:order-1 border-zinc-800/80 bg-zinc-950/40 relative pt-7 text-center shadow-md bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"
              >
                <div className="absolute top-3 left-3 bg-zinc-800 text-[10px] uppercase font-bold tracking-widest font-display text-muted px-2 py-0.5 rounded">
                  2º Lugar
                </div>
                <div className="text-3xl mb-1">🥈</div>
                <h4 className="text-base font-bold font-sans line-clamp-1">{formatarNomePrivado(topTres[1].nome)}</h4>
                <p className="text-xl font-display font-black text-primary mt-1">
                  {filtroRodada === "GERAL" ? topTres[1].pontos_total : topTres[1].pontos_rodada} <span className="text-[10px] uppercase text-muted font-bold font-display">Pts</span>
                </p>
              </Card>
            )}

            {/* 1º Lugar (Campeão - Card de Ouro central) */}
            {topTres[0] && (
              <Card
                variant="gold"
                hoverable={false}
                className="order-1 md:order-2 border-primary/30 bg-gradient-to-b from-primary/10 via-zinc-950/90 to-amber-950/10 relative pt-8 text-center gold-glow shadow-lg md:-translate-y-2 scale-102"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-background text-[9px] uppercase font-bold tracking-widest font-display px-3 py-1 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.4)] flex items-center gap-1">
                  <Flame className="w-3 h-3 text-background fill-background animate-pulse" />
                  Líder Geral
                </div>
                <div className="text-4xl mb-1.5 animate-bounce">🥇</div>
                <h4 className="text-lg font-black font-sans text-primary tracking-wide line-clamp-1">
                  {formatarNomePrivado(topTres[0].nome)}
                </h4>
                <p className="text-2xl font-display font-black text-foreground mt-1 shadow-sm">
                  {filtroRodada === "GERAL" ? topTres[0].pontos_total : topTres[0].pontos_rodada} <span className="text-[10px] uppercase text-primary font-bold font-display">Pts</span>
                </p>
              </Card>
            )}

            {/* 3º Lugar */}
            {topTres[2] && (
              <Card
                variant="dark"
                hoverable={false}
                className="order-3 border-zinc-800/80 bg-zinc-950/40 relative pt-7 text-center shadow-md bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"
              >
                <div className="absolute top-3 left-3 bg-zinc-800 text-[10px] uppercase font-bold tracking-widest font-display text-muted px-2 py-0.5 rounded">
                  3º Lugar
                </div>
                <div className="text-3xl mb-1">🥉</div>
                <h4 className="text-base font-bold font-sans line-clamp-1">{formatarNomePrivado(topTres[2].nome)}</h4>
                <p className="text-xl font-display font-black text-amber-600 mt-1">
                  {filtroRodada === "GERAL" ? topTres[2].pontos_total : topTres[2].pontos_rodada} <span className="text-[10px] uppercase text-muted font-bold font-display">Pts</span>
                </p>
              </Card>
            )}
          </div>
        )}

        {/* --- TABELA DO RANKING GERAL --- */}
        <Card variant="dark" hoverable={false} className="border-zinc-800 bg-zinc-950/50 p-0 overflow-x-auto">
          {rankingExibido.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-muted">Nenhum participante encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 font-display text-[10px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-5 py-4 w-16 text-center">Pos</th>
                  <th className="px-6 py-4">Palpitador</th>
                  <th className="px-6 py-4 text-center">Cadastro</th>
                  <th className="px-6 py-4 text-right">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {/* Caso mostre busca ou outros, listamos tudo na tabela */}
                {rankingExibido.map((part) => {
                  const pontos = filtroRodada === "GERAL" ? part.pontos_total : part.pontos_rodada;
                  const eTopTres = part.posicao && part.posicao <= 3;
                  
                  return (
                    <tr
                      key={part.id}
                      className={`transition-colors font-sans text-xs ${
                        eTopTres && busca === ""
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-zinc-900/20"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-center font-bold">
                        {obterIconePosicao(part.posicao || 0)}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-foreground">
                        {formatarNomePrivado(part.nome)}
                      </td>
                      <td className="px-6 py-3.5 text-center text-[10px] text-muted">
                        {new Date(part.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-3.5 text-right font-display font-black text-sm text-primary tracking-wide">
                        {pontos} <span className="text-[9px] uppercase font-bold text-muted ml-0.5">Pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
