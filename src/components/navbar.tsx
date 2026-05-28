"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "./logo";
import { Trophy, Award, Gift, Calendar, BarChart2, Tv, LogOut, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [participant, setParticipant] = useState<{ nome: string; pontos_total: number } | null>(null);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Impedir renderização do perfil na tela de cadastro ou tv
  const showProfile = pathname !== "/" && pathname !== "/tv" && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!showProfile) return;

    const fetchParticipantData = async () => {
      const id = localStorage.getItem("participante_id");
      if (!id) return;

      try {
        // Buscar dados do participante
        const { data: part, error } = await supabase
          .from("participantes")
          .select("nome, pontos_total")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (part) {
          setParticipant(part);
          
          // Buscar posição no ranking
          const { data: allParts, error: rankError } = await supabase
            .from("participantes")
            .select("id")
            .order("pontos_total", { ascending: false });

          if (!rankError && allParts) {
            const index = allParts.findIndex((p: { id: string }) => p.id === id);
            if (index !== -1) {
              setRankPosition(index + 1);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do cabeçalho:", err);
      }
    };

    fetchParticipantData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchParticipantData, 30000);
    return () => clearInterval(interval);
  }, [showProfile, pathname]);

  const navLinks = [
    { name: "Palpites", path: "/bolao", icon: Calendar },
    { name: "Ranking", path: "/ranking", icon: Trophy },
    { name: "Ganhadores", path: "/ganhadores", icon: Award },
    { name: "Prêmios", path: "/premios", icon: Gift },
  ];

  const handleLogout = () => {
    localStorage.removeItem("participante_id");
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href={(typeof window !== "undefined" && localStorage.getItem("participante_id")) ? "/bolao" : "/"}>
          <Logo size="sm" />
        </Link>

        {/* Links Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-display font-semibold transition-colors py-1 border-b-2 ${
                  active
                    ? "text-primary border-primary"
                    : "text-muted hover:text-foreground border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Perfil & Logout */}
        <div className="hidden md:flex items-center gap-4">
          {showProfile && participant && (
            <div className="flex items-center gap-3 bg-secondary/80 border border-primary/20 px-3.5 py-1.5 rounded-xl gold-glow select-none">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground font-sans line-clamp-1 max-w-[120px]">
                  {participant.nome.split(" ")[0]}
                </span>
                <span className="text-[10px] text-muted font-display uppercase tracking-wider">
                  Pontos: <strong className="text-primary">{participant.pontos_total}</strong>
                  {rankPosition && ` | #${rankPosition}`}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-display text-primary font-bold text-sm">
                🏆
              </div>
            </div>
          )}
          {showProfile && (
            <button
              onClick={handleLogout}
              title="Sair do Bolão"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-muted hover:text-accent hover:border-accent/30 transition-all duration-300 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          
          {/* Link para TV do Bar */}
          <Link
            href="/tv"
            target="_blank"
            title="Abrir Modo TV (Kiosk)"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-muted hover:text-primary hover:border-primary/30 transition-all duration-300"
          >
            <Tv className="w-4 h-4" />
          </Link>
        </div>

        {/* Botão Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {showProfile && participant && (
            <div className="bg-secondary/60 border border-primary/20 px-2 py-1 rounded-lg text-right select-none">
              <span className="text-[10px] font-bold text-primary block leading-tight">
                {participant.pontos_total} Pts
              </span>
              {rankPosition && (
                <span className="text-[8px] text-muted block leading-none font-display uppercase">
                  #{rankPosition}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-secondary border border-border text-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-zinc-800/80 flex flex-col gap-3 pb-2 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-semibold font-display uppercase tracking-wider transition-colors ${
                  active ? "text-primary bg-primary/10" : "text-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          
          {showProfile && (
            <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between px-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider font-display py-1.5"
              >
                <LogOut className="w-4.5 h-4.5" />
                Sair do Bolão
              </button>
              
              <Link
                href="/tv"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider font-display py-1.5"
              >
                <Tv className="w-4.5 h-4.5" />
                Modo TV
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
