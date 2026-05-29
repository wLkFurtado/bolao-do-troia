"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast, Button, Card } from "@/components/ui-custom";
import Logo from "@/components/logo";
import {
  Lock,
  QrCode,
  Award,
  Sparkles,
  LogOut,
  RefreshCw,
  HelpCircle,
  Clock,
  CheckCircle2,
  Tv
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function GarcomPanel() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  
  // Dados de exibição
  const [pinCode, setPinCode] = useState("----");
  const [tableNumber, setTableNumber] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  // Sincronização automática
  const [tick, setTick] = useState(0);

  // Verificar se o garçom já está autenticado anteriormente
  useEffect(() => {
    const isStaff = localStorage.getItem("staff_session") === "true";
    if (isStaff) {
      setIsAuthenticated(true);
    }
  }, []);

  // Buscar o PIN ativo no banco
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchActivePin = async () => {
      try {
        const { data, error } = await supabase
          .from("configuracoes")
          .select("valor")
          .eq("chave", "codigo_presenca")
          .single();

        if (!error && data) {
          setPinCode(data.valor);
        }
      } catch (err) {
        console.error("Erro ao obter PIN do dia:", err);
      }
    };

    fetchActivePin();

    // Sincronizar PIN de 10 em 10 segundos para ver atualizações imediatas
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, tick]);

  // Atualizar URL do QR Code de Mesa dinamicamente
  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    if (tableNumber) {
      setQrUrl(`${origin}?ref=mesa-${tableNumber}`);
    } else {
      setQrUrl(origin);
    }
  }, [tableNumber]);

  // Manipular autenticação do Garçom
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim().toLowerCase() === "troiastaff") {
      setIsAuthenticated(true);
      localStorage.setItem("staff_session", "true");
      showToast("Acesso concedido! Bom trabalho, equipe! 🍻", "success");
    } else {
      showToast("Senha de staff incorreta. Tente novamente!", "error");
    }
  };

  // Logout do garçom
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("staff_session");
    setPasswordInput("");
    showToast("Sessão de garçom encerrada com sucesso.", "info");
  };

  // --- TELA DE LOGIN (Não autenticado) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden select-none">
        {/* Glow VIP de fundo */}
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-25%] right-[-20%] w-[70%] h-[70%] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-sm z-10 flex flex-col items-center">
          <Logo size="md" className="mb-4" />
          <span className="text-[9px] text-primary tracking-[0.2em] font-display font-black uppercase bg-primary/10 border border-primary/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.15)] mb-8">
            ÁREA DE EQUIPE • TROIA STAFF
          </span>

          <Card variant="gold" hoverable={false} className="w-full p-6 bg-zinc-950/80 border-primary/20 shadow-2xl">
            <h2 className="text-md font-display uppercase tracking-widest font-bold text-center text-foreground mb-4">
              Identificação de Staff
            </h2>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Senha da equipe (Ex: troiastaff)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-sans placeholder:text-zinc-600 focus:border-primary focus:outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                />
                <Lock className="w-4 h-4 text-zinc-600 absolute right-3.5 top-3.5" />
              </div>

              <Button variant="primary" type="submit" className="w-full py-3 mt-1">
                Entrar como Equipe
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // --- PAINEL PRINCIPAL DO GARÇOM (Autenticado) ---
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative pb-8 select-none">
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Fixo do Staff */}
      <header className="bg-zinc-950/80 border-b border-zinc-900/80 px-4 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-[8px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-primary font-display font-black tracking-widest">
            STAFF ACTIVE
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-accent/15 border border-zinc-800 hover:border-accent/20 text-muted hover:text-accent transition-all duration-300 active:scale-95"
          title="Sair do Painel"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Conteúdo Mobile-First */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-6 max-w-md mx-auto w-full">
        
        {/* 1. SEÇÃO PIN DO DIA GIGANTE */}
        <Card variant="gold" hoverable={false} className="p-5 border-primary/30 bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-primary/5 text-center shadow-lg gold-glow flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-primary font-display font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Código PIN de Presença
          </div>
          
          <div className="w-full flex items-center justify-center bg-zinc-900/50 border border-zinc-900 px-8 py-5 rounded-2xl relative shadow-inner">
            <span className="text-4xl font-display font-black text-primary tracking-[0.25em] pl-[0.25em] select-all animate-pulse">
              {pinCode}
            </span>
          </div>

          <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
            Fale este código para os clientes da sua mesa confirmarem o palpite. Ele garante que apenas quem está no bar concorra aos prêmios!
          </p>
        </Card>

        {/* 2. GERADOR DE QR CODE DE MESA RÁPIDO */}
        <Card variant="dark" hoverable={false} className="p-5 border-zinc-800 bg-zinc-950/60 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
            <QrCode className="w-4.5 h-4.5 text-primary" />
            <h3 className="text-xs font-display uppercase tracking-widest font-black text-foreground">
              Ajudar Cliente: QR de Mesa
            </h3>
          </div>

          <p className="text-[10px] text-muted leading-relaxed">
            O cliente quer jogar? Digite o número da mesa dele abaixo e mostre a tela do seu celular para ele escanear o QR Code. O aplicativo abrirá com a mesa dele pré-salva!
          </p>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Número da Mesa (Ex: 14)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-xs font-display font-bold placeholder:font-normal focus:border-primary focus:outline-none"
            />
            {tableNumber && (
              <button
                onClick={() => setTableNumber("")}
                className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[10px] uppercase font-display font-bold text-muted rounded-lg active:scale-95 transition-all"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg mt-1 w-44 h-44 mx-auto border-2 border-primary/20">
            <QRCodeCanvas
              value={qrUrl}
              size={144}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center">
            <span className="text-[8px] font-mono text-zinc-500 break-all select-all">
              {qrUrl}
            </span>
            {tableNumber && (
              <span className="block text-[9px] text-emerald-400 font-bold uppercase mt-1 animate-pulse">
                ✓ Com referência: Mesa {tableNumber}
              </span>
            )}
          </div>
        </Card>

        {/* 3. COLINHA DE REGRAS E PRÊMIOS */}
        <Card variant="dark" hoverable={false} className="p-5 border-zinc-800 bg-zinc-950/60 flex flex-col gap-4.5">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
            <Award className="w-4.5 h-4.5 text-primary" />
            <h3 className="text-xs font-display uppercase tracking-widest font-black text-foreground">
              Guia Rápido de Suporte (Colinha)
            </h3>
          </div>

          <div className="flex flex-col gap-3 text-[11px] leading-relaxed text-muted">
            <div className="flex items-start gap-2 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900">
              <span className="text-sm">🏆</span>
              <div>
                <strong className="text-foreground block mb-0.5">Como pontuar no Bolão:</strong>
                • Placar Exato = <span className="text-primary font-bold">10 pontos</span><br />
                • Acertar Vencedor + Saldo = <span className="text-emerald-400 font-bold">7 pontos</span><br />
                • Apenas Vencedor ou Empate = <span className="text-yellow-500 font-bold">5 pontos</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900">
              <span className="text-sm">🕒</span>
              <div>
                <strong className="text-foreground block mb-0.5">Prazo de Envio:</strong>
                Os palpites fecham automaticamente <strong className="text-primary">5 minutos após</strong> o início oficial da partida. Não há exceções no sistema!
              </div>
            </div>

            <div className="flex items-start gap-2 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900">
              <span className="text-sm">🎁</span>
              <div>
                <strong className="text-foreground block mb-0.5">Brindes e Prêmios:</strong>
                O gerente anuncia os ganhadores no mural. Se um cliente na sua mesa ganhar, o nome dele aparecerá na tela de **Ganhadores**!
              </div>
            </div>
          </div>
        </Card>

      </main>
    </div>
  );
}
