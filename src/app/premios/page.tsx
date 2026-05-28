"use client";

import React from "react";
import Navbar from "@/components/navbar";
import { Card, Button } from "@/components/ui-custom";
import { Gift, Trophy, Star, ShieldCheck, Flame, Wine, Compass, Award } from "lucide-react";
import Link from "next/link";

export default function PremiosPage() {
  const tiers = [
    {
      title: "Ganhador da Rodada",
      subtitle: "Premiação Diária",
      reward: "Caipirinha Grátis ou Chopp Tulipa",
      description: "O participante que somar a maior quantidade de pontos em uma única rodada/dia leva o brinde imediato para brindar com a mesa!",
      icon: "🍹",
      badge: "Todos os dias de jogo",
      color: "gold" as const,
    },
    {
      title: "Melhor da Fase de Grupos",
      subtitle: "Fase 1 do Bolão",
      reward: "Rodada de Chopp para até 4 Pessoas",
      description: "A maior pontuação acumulada durante toda a fase classificatória de grupos ganha uma rodada exclusiva de chopp trincando para comemorar no lounge!",
      icon: "🍻",
      badge: "Fim da 3ª rodada",
      color: "red" as const,
    },
    {
      title: "Grande Campeão Geral",
      subtitle: "O Mito da Copa 2026",
      reward: "Jantar Gourmet Completo para 2 Pessoas",
      description: "O campeão geral absoluto do ranking acumulado leva um jantar com entrada, prato principal, sobremesa e uma garrafa de vinho no prestigiado Rooftop do Troia Lounge Bar!",
      icon: "🍷",
      badge: "Grande Final (19/Jul)",
      color: "gold" as const,
    },
  ];

  const regrasPontuacao = [
    {
      pontos: 10,
      titulo: "Placar Exato",
      exemplo: "Você previu 2x1. O jogo terminou 2x1.",
      badge: "Perfeito!",
      cor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    },
    {
      pontos: 7,
      titulo: "Vencedor & Saldo",
      exemplo: "Você previu 2x0. O jogo terminou 3x1. (Acertou o vencedor e a diferença de +2 gols)",
      badge: "Excelente!",
      cor: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    },
    {
      pontos: 5,
      titulo: "Apenas Vencedor",
      exemplo: "Você previu 1x0. O jogo terminou 3x0. Ou previu empate 1x1 e foi 2x2.",
      badge: "Na Trave!",
      cor: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    },
    {
      pontos: 0,
      titulo: "Errou Tudo",
      exemplo: "Você previu 1x2. O jogo terminou 1x0.",
      badge: "Acontece...",
      cor: "text-zinc-500 border-zinc-800 bg-zinc-900/5",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Cabeçalho */}
        <div className="text-center mb-12 select-none">
          <span className="text-[10px] text-primary tracking-widest font-display font-black uppercase block mb-1">
            Recompensas do Bar
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold uppercase text-foreground flex items-center justify-center gap-2">
            <Gift className="w-7 h-7 text-primary animate-pulse" />
            Tabela de Premiações
          </h2>
          <p className="text-xs text-muted font-sans mt-1.5 max-w-md mx-auto">
            No Troia Lounge Bar, o seu conhecimento de futebol vale cerveja trincando e alta gastronomia em Cabo Frio - RJ!
          </p>
        </div>

        {/* Tiers de Premiação */}
        <div className="flex flex-col gap-6 mb-12">
          {tiers.map((tier, index) => (
            <Card
              key={index}
              variant={tier.color}
              hoverable={true}
              className={`relative p-6 flex flex-col md:flex-row gap-6 items-start md:items-center ${
                index === 2 
                  ? "border-2 border-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] bg-gradient-to-r from-zinc-950 via-zinc-950 to-amber-950/20" 
                  : "bg-zinc-950/40 border-zinc-850"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-3xl flex-shrink-0 shadow-inner select-none">
                {tier.icon}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest font-display">
                    {tier.subtitle}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-muted">
                    {tier.badge}
                  </span>
                </div>
                <h3 className="text-lg font-display font-black uppercase text-foreground leading-tight">
                  {tier.title}
                </h3>
                <p className="text-sm font-sans text-primary font-bold mt-1.5 leading-snug">
                  🎁 Prêmio: <span className="underline decoration-accent/60 underline-offset-3">{tier.reward}</span>
                </p>
                <p className="text-xs text-muted font-sans mt-1.5 leading-relaxed">
                  {tier.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Regras de Pontuação */}
        <div className="mt-12 select-none">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-900 pb-3">
            <Award className="w-5.5 h-5.5 text-primary" />
            <h3 className="text-sm font-display uppercase tracking-widest font-extrabold text-foreground">
              Como funciona a pontuação?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regrasPontuacao.map((regra, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border flex justify-between gap-4 items-start ${regra.cor}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold font-sans text-foreground">
                      {regra.titulo}
                    </h4>
                    <span className="text-[8px] uppercase font-bold tracking-wider font-display opacity-80">
                      {regra.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {regra.exemplo}
                  </p>
                </div>
                <div className="text-3xl font-display font-black tracking-tighter pr-1">
                  +{regra.pontos}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Link href="/bolao">
            <Button variant="primary" size="lg" className="gap-2 shadow-lg">
              <Star className="w-4.5 h-4.5 text-background fill-background" />
              Ir para meus Palpites
            </Button>
          </Link>
          <div className="text-[10px] text-zinc-500 font-sans mt-3 flex items-center justify-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            Troia Lounge Bar - Cabo Frio - RJ. Beba com moderação. Proibido para menores de 18 anos.
          </div>
        </div>
        
      </div>
    </div>
  );
}
