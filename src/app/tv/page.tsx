"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/logo";
import { Loading } from "@/components/ui-custom";
import { Trophy, Calendar, Sparkles, Clock, Compass, Star } from "lucide-react";
import { formatZoned } from "@/lib/tempo";

interface ParticipantRanking {
  id: string;
  nome: string;
  pontos_total: number;
}

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
}

export default function TvPage() {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantRanking[]>([]);
  const [nextJogo, setNextJogo] = useState<Jogo | null>(null);
  
  // Controle de Slide (0: Ranking, 1: Próximo Jogo)
  const [activeSlide, setActiveSlide] = useState(0);

  // Contador de tempo para o próximo jogo
  const [countdown, setCountdown] = useState({
    dias: "00",
    horas: "00",
    minutos: "00",
    segundos: "00",
  });

  const formatarNomePrivado = (nomeCompleto: string): string => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return partes[0];
    const primeiroNome = partes[0];
    const ultimoSobrenome = partes[partes.length - 1];
    return `${primeiroNome} ${ultimoSobrenome.charAt(0)}.`;
  };

  const fetchTvData = async () => {
    try {
      // 1. Obter Top 15 participantes
      const { data: parts, error: partsError } = await supabase
        .from("participantes")
        .select("id, nome, pontos_total")
        .order("pontos_total", { ascending: false })
        .range(0, 14);

      if (!partsError && parts) {
        setParticipants(parts);
      }

      // 2. Obter próximo jogo ainda não finalizado
      const nowIso = new Date().toISOString();
      const { data: jogos, error: jogosError } = await supabase
        .from("jogos")
        .select("*")
        .eq("finalizado", false)
        .gte("data_hora", nowIso)
        .order("data_hora", { ascending: true })
        .limit(1);

      if (!jogosError && jogos && jogos.length > 0) {
        setNextJogo(jogos[0]);
      } else {
        // Fallback: buscar o primeiro jogo futuro do calendário
        const { data: fallbackJogos } = await supabase
          .from("jogos")
          .select("*")
          .order("data_hora", { ascending: true })
          .limit(1);
        if (fallbackJogos && fallbackJogos.length > 0) {
          setNextJogo(fallbackJogos[0]);
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar dados da TV:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTvData();
    
    // Sincronizar dados do banco a cada 15 segundos
    const dbInterval = setInterval(fetchTvData, 15000);

    // Alternar slides a cada 15 segundos
    const slideInterval = setInterval(() => {
      setActiveSlide((s) => (s === 0 ? 1 : 0));
    }, 15000);

    return () => {
      clearInterval(dbInterval);
      clearInterval(slideInterval);
    };
  }, []);

  // Rodar contagem regressiva a cada segundo
  useEffect(() => {
    if (!nextJogo) return;

    const timer = setInterval(() => {
      const targetTime = new Date(nextJogo.data_hora).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setCountdown({ dias: "00", horas: "00", minutos: "00", segundos: "00" });
        clearInterval(timer);
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({
        dias: d < 10 ? `0${d}` : d.toString(),
        horas: h < 10 ? `0${h}` : h.toString(),
        minutos: m < 10 ? `0${m}` : m.toString(),
        segundos: s < 10 ? `0${s}` : s.toString(),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [nextJogo]);

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col justify-center items-center select-none no-scrollbar">
        <Loading size="lg" />
        <span className="text-sm uppercase tracking-[0.2em] text-primary font-display font-bold mt-4 animate-pulse">
          Iniciando Kiosk Bolão do Troia...
        </span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050505] text-foreground flex flex-col justify-between p-6 overflow-hidden relative select-none no-scrollbar">
      {/* Luzes de Fundo Estilo Lounge Bar */}
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-accent/800 opacity-10 rounded-full blur-[160px] pointer-events-none animate-live-pulse" />

      {/* CABEÇALHO DA TV (Fixo) */}
      <header className="flex items-center justify-between border-b border-zinc-900 pb-4 z-10">
        <Logo size="md" />
        <div className="flex items-center gap-6 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted font-display uppercase tracking-widest leading-none">
              Modo Kiosk
            </span>
            <span className="text-sm font-display font-black text-primary tracking-widest mt-1">
              TV DO LOUNGE
            </span>
          </div>
          <div className="w-1.5 h-6 bg-primary rounded" />
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO (Mudar por Slide) */}
      <main className="flex-1 flex items-center justify-center py-6 z-10 overflow-hidden">
        {/* --- SLIDE 0: RANKING AO VIVO --- */}
        {activeSlide === 0 ? (
          <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="flex items-center gap-2 mb-6 select-none">
              <Trophy className="w-6 h-6 text-primary animate-bounce" />
              <h2 className="text-xl md:text-2xl font-display font-extrabold uppercase tracking-widest text-foreground">
                Liderança Geral ao Vivo
              </h2>
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              {/* Coluna 1 (Top 1-8) */}
              <div className="flex flex-col gap-2.5">
                {participants.slice(0, 8).map((part, index) => {
                  const pos = index + 1;
                  const eTop3 = pos <= 3;
                  return (
                    <div
                      key={part.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-500 ${
                        pos === 1
                          ? "bg-gradient-to-r from-primary/10 via-zinc-900/40 to-transparent border-primary/45 shadow-[0_0_15px_rgba(212,175,55,0.08)]"
                          : pos === 2
                          ? "bg-zinc-900/60 border-zinc-800"
                          : pos === 3
                          ? "bg-zinc-900/40 border-amber-900/20"
                          : "bg-zinc-950/20 border-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-sm select-none ${
                          pos === 1 ? "bg-primary text-background shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "bg-zinc-900 border border-zinc-800 text-muted"
                        }`}>
                          {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}º`}
                        </div>
                        <span className={`text-sm font-sans font-bold tracking-wide ${pos === 1 ? "text-primary font-black" : "text-foreground"}`}>
                          {formatarNomePrivado(part.nome)}
                        </span>
                      </div>
                      <span className="text-base font-display font-black text-primary tracking-wider">
                        {part.pontos_total} <span className="text-[10px] uppercase text-muted font-bold">Pts</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Coluna 2 (Top 9-15) */}
              <div className="flex flex-col gap-2.5">
                {participants.slice(8, 15).map((part, index) => {
                  const pos = index + 9;
                  return (
                    <div
                      key={part.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-900 bg-zinc-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-display font-bold text-xs text-muted">
                          {pos}º
                        </div>
                        <span className="text-sm font-sans font-semibold text-zinc-300">
                          {formatarNomePrivado(part.nome)}
                        </span>
                      </div>
                      <span className="text-sm font-display font-bold text-zinc-400">
                        {part.pontos_total} <span className="text-[9px] uppercase text-zinc-500 font-bold">Pts</span>
                      </span>
                    </div>
                  );
                })}
                
                {/* Card do QR Code na TV */}
                <div className="flex-1 flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/5 select-none text-center">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-primary uppercase font-bold tracking-widest font-display">Escaneie & Participe</span>
                    <h4 className="text-xs font-black uppercase text-foreground leading-tight mt-1">Quer ganhar caipirinhas?</h4>
                    <p className="text-[9px] text-muted font-sans leading-relaxed mt-1">Aponte o celular para o QR Code da mesa e dê seus palpites!</p>
                  </div>
                  <div className="text-2xl animate-pulse">📲⚽</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // --- SLIDE 1: PRÓXIMO JOGO COM COUNTDOWN ---
          <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in zoom-in duration-700 select-none">
            {nextJogo ? (
              <div className="w-full flex flex-col items-center">
                {/* Badge da rodada */}
                <span className="text-[10px] px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-muted uppercase font-bold tracking-widest mb-4">
                  {nextJogo.rodada} {nextJogo.grupo ? `| Grupo ${nextJogo.grupo}` : ""}
                </span>
                
                {/* Título de chamada */}
                <h2 className="text-2xl font-display font-extrabold uppercase tracking-widest text-primary mb-6 flex items-center gap-1.5">
                  <Clock className="w-5.5 h-5.5" />
                  Próxima Partida Oficial
                </h2>

                {/* Card Principal */}
                <div className="w-full glass gold-glow rounded-3xl p-8 border border-primary/20 bg-zinc-950/60 flex flex-col items-center relative overflow-hidden mb-8">
                  {/* Luz de destaque interna */}
                  <div className="absolute top-0 w-[40%] h-[100%] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

                  {/* Confronto GIGANTE */}
                  <div className="w-full flex items-center justify-between gap-6 py-6 z-10 relative">
                    {/* Casa */}
                    <div className="flex-1 flex flex-col items-center text-center gap-3">
                      {nextJogo.bandeira_casa ? (
                        <img
                          src={nextJogo.bandeira_casa}
                          alt={nextJogo.time_casa}
                          className="w-24 h-16 object-cover rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-2 border-zinc-800"
                        />
                      ) : (
                        <div className="w-24 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl rounded-xl">⚽</div>
                      )}
                      <span className="text-lg md:text-xl font-display font-extrabold uppercase tracking-wide text-foreground leading-tight">
                        {nextJogo.time_casa}
                      </span>
                    </div>

                    {/* Divisor X */}
                    <div className="text-xl md:text-2xl font-display font-black text-primary px-3 uppercase tracking-tighter select-none">
                      VS
                    </div>

                    {/* Visitante */}
                    <div className="flex-1 flex flex-col items-center text-center gap-3">
                      {nextJogo.bandeira_visitante ? (
                        <img
                          src={nextJogo.bandeira_visitante}
                          alt={nextJogo.time_visitante}
                          className="w-24 h-16 object-cover rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-2 border-zinc-800"
                        />
                      ) : (
                        <div className="w-24 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl rounded-xl">⚽</div>
                      )}
                      <span className="text-lg md:text-xl font-display font-extrabold uppercase tracking-wide text-foreground leading-tight">
                        {nextJogo.time_visitante}
                      </span>
                    </div>
                  </div>

                  {/* Infos do Estádio */}
                  <div className="w-full text-center mt-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-900/60 z-10 relative">
                    <p className="text-xs font-semibold text-zinc-300">
                      🏟️ {nextJogo.estadio} | 📍 {nextJogo.cidade}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      Horário de Brasília: {formatZoned(nextJogo.data_hora, "dd 'de' MMMM 'às' HH:mm")}h
                    </p>
                  </div>
                </div>

                {/* --- CONTADOR REGRESSIVO --- */}
                <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-900 px-6 py-3 rounded-2xl shadow-xl select-none">
                  <div className="text-center">
                    <span className="text-2xl md:text-3xl font-display font-black text-foreground">{countdown.dias}</span>
                    <span className="text-[8px] text-muted block uppercase tracking-wider font-display font-bold">Dias</span>
                  </div>
                  <span className="text-xl font-black text-primary -translate-y-1.5">:</span>
                  <div className="text-center">
                    <span className="text-2xl md:text-3xl font-display font-black text-foreground">{countdown.horas}</span>
                    <span className="text-[8px] text-muted block uppercase tracking-wider font-display font-bold">Horas</span>
                  </div>
                  <span className="text-xl font-black text-primary -translate-y-1.5">:</span>
                  <div className="text-center">
                    <span className="text-2xl md:text-3xl font-display font-black text-foreground">{countdown.minutos}</span>
                    <span className="text-[8px] text-muted block uppercase tracking-wider font-display font-bold">Min</span>
                  </div>
                  <span className="text-xl font-black text-primary -translate-y-1.5">:</span>
                  <div className="text-center animate-pulse">
                    <span className="text-2xl md:text-3xl font-display font-black text-primary">{countdown.segundos}</span>
                    <span className="text-[8px] text-primary block uppercase tracking-wider font-display font-bold">Seg</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center select-none">
                <p className="text-sm text-muted">Todos os jogos já foram finalizados!</p>
                <p className="text-xs text-primary font-display font-bold uppercase mt-2">Confira o vencedor geral do Troia! 🥇🏆</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* RODAPÉ DA TV (Fixo) */}
      <footer className="flex items-center justify-between border-t border-zinc-900 pt-4 z-10 select-none text-[10px] text-muted tracking-wider uppercase font-semibold font-display">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-primary" />
          Premios: Caipirinhas, Chopps e Jantares Gourmet
        </div>
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-primary" />
          Troia Lounge Bar - Cabo Frio - RJ
        </div>
      </footer>
    </div>
  );
}
