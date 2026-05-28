"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast, Card, Loading } from "@/components/ui-custom";
import Navbar from "@/components/navbar";
import { Award, Gift, Calendar, HelpCircle, User, MessageCircle } from "lucide-react";
import { formatZoned } from "@/lib/tempo";

interface GanhadorAnuncio {
  id: string;
  premio: string;
  anunciado_em: string;
  observacao: string | null;
  rodada: string | null;
  jogos: {
    time_casa: string;
    time_visitante: string;
    gols_casa: number | null;
    gols_visitante: number | null;
  } | null;
  participantes: {
    nome: string;
  } | null;
}

export default function GanhadoresPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ganhadores, setGanhadores] = useState<GanhadorAnuncio[]>([]);

  const formatarNomePrivado = (nomeCompleto: string): string => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return partes[0];
    const primeiroNome = partes[0];
    const ultimoSobrenome = partes[partes.length - 1];
    return `${primeiroNome} ${ultimoSobrenome.charAt(0)}.`;
  };

  useEffect(() => {
    const fetchGanhadores = async () => {
      try {
        // Obter os ganhadores conectando com participantes e jogos
        const { data, error } = await supabase
          .from("ganhadores")
          .select(`
            id,
            premio,
            anunciado_em,
            observacao,
            rodada,
            jogos (
              time_casa,
              time_visitante,
              gols_casa,
              gols_visitante
            ),
            participantes (
              nome
            )
          `)
          .order("anunciado_em", { ascending: false });

        if (error) throw error;
        if (data) {
          setGanhadores(data as unknown as GanhadorAnuncio[]);
        }
      } catch (err) {
        console.error("Erro ao buscar ganhadores:", err);
        showToast("Não foi possível carregar o mural de ganhadores.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchGanhadores();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-background flex flex-col justify-center items-center">
        <Loading size="lg" />
        <span className="text-xs uppercase tracking-wider text-muted font-display font-semibold mt-4">
          Buscando mural de vencedores...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">
      <Navbar />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-1 mb-8 select-none">
          <h2 className="text-xl md:text-2xl font-display font-extrabold uppercase text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary animate-pulse" />
            Mural de Ganhadores
          </h2>
          <p className="text-xs text-muted font-sans mt-0.5">
            Confira quem garantiu as rodadas de chopp, caipirinhas e os prêmios exclusivos do Troia Lounge Bar!
          </p>
        </div>

        {ganhadores.length === 0 ? (
          <div className="p-8 rounded-xl border border-zinc-800/60 bg-zinc-950/20 text-center select-none">
            <p className="text-xs text-muted">Nenhum brinde anunciado ainda.</p>
            <p className="text-[10px] text-primary mt-2 uppercase font-display font-bold">Participe dos palpites hoje e garanta sua vaga no mural! 🍹⚽</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ganhadores.map((ganhador) => {
              const nomeUser = ganhador.participantes?.nome 
                ? formatarNomePrivado(ganhador.participantes.nome) 
                : "Participante Removido";
              
              const temJogo = ganhador.jogos;

              return (
                <Card
                  key={ganhador.id}
                  variant="gold"
                  hoverable={true}
                  className="bg-zinc-950/60 border-primary/10 relative p-6 flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-[40%] h-[120%] bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    {/* Linha Superior */}
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm">
                          🍹
                        </div>
                        <div>
                          <span className="text-[10px] text-muted block uppercase font-bold tracking-widest font-display">
                            Vencedor
                          </span>
                          <h4 className="text-sm font-bold font-sans text-foreground">
                            {nomeUser}
                          </h4>
                        </div>
                      </div>
                      <span className="text-[8px] text-primary font-display uppercase tracking-widest font-semibold px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                        {ganhador.rodada || "Bolão Geral"}
                      </span>
                    </div>

                    {/* Destaque do Prêmio */}
                    <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl mb-4 gold-glow">
                      <span className="text-[8px] text-primary block uppercase font-bold tracking-widest font-display mb-1 flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        Prêmio Conquistado
                      </span>
                      <h3 className="text-base font-display font-extrabold uppercase text-foreground leading-tight">
                        {ganhador.premio}
                      </h3>
                    </div>

                    {/* Origem da Vitória (Jogo/Fase) */}
                    {temJogo && (
                      <div className="text-[11px] text-muted font-sans border-b border-zinc-900 pb-3 mb-3">
                        <strong className="text-foreground">Jogo do Brinde:</strong>{" "}
                        {ganhador.jogos?.time_casa} {ganhador.jogos?.gols_casa} x {ganhador.jogos?.gols_visitante} {ganhador.jogos?.time_visitante}
                      </div>
                    )}

                    {/* Observação extra do bar */}
                    {ganhador.observacao && (
                      <div className="text-xs text-zinc-400 italic bg-zinc-900/30 p-2.5 rounded border border-zinc-900/50 flex gap-1.5 items-start">
                        <MessageCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>"{ganhador.observacao}"</span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Anúncio */}
                  <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-sans mt-4 pt-3 border-t border-zinc-900/80">
                    <Calendar className="w-3 h-3" />
                    Entregue em {formatZoned(ganhador.anunciado_em, "dd/MM/yyyy 'às' HH:mm")}h
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
