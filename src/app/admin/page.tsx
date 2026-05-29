"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, useToast, Loading } from "@/components/ui-custom";
import { useRouter } from "next/navigation";
import {
  Users,
  MessageSquareCode,
  CalendarDays,
  CheckCircle,
  Tv,
  QrCode,
  ArrowRight,
  TrendingUp,
  Download,
  Info,
  Lock,
  RefreshCw
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function AdminDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalGuesses: 0,
    finishedMatches: 0,
    pendingMatches: 0,
  });

  // Estado para o gerador de QR Code
  const [tableNumber, setTableNumber] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  // Estados para o PIN de Presença
  const [pinCode, setPinCode] = useState("1234");
  const [newPin, setNewPin] = useState("");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  useEffect(() => {
    // Definir URL inicial do QR Code com base no host atual (no cliente)
    if (typeof window !== "undefined") {
      setQrUrl(window.location.origin);
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // 1. Total Participantes
        const { count: partCount, error: partError } = await supabase
          .from("participantes")
          .select("*", { count: "exact", head: true });

        // 2. Total Palpites
        const { count: palpiteCount, error: palpiteError } = await supabase
          .from("palpites")
          .select("*", { count: "exact", head: true });

        // 3. Jogos Finalizados
        const { count: finishedCount, error: finishedError } = await supabase
          .from("jogos")
          .select("*", { count: "exact", head: true })
          .eq("finalizado", true);

        // 4. Jogos Pendentes
        const { count: pendingCount, error: pendingError } = await supabase
          .from("jogos")
          .select("*", { count: "exact", head: true })
          .eq("finalizado", false);

        if (partError || palpiteError || finishedError || pendingError) {
          throw new Error("Erro ao carregar algumas estatísticas do Supabase.");
        }

        setStats({
          totalParticipants: partCount || 0,
          totalGuesses: palpiteCount || 0,
          finishedMatches: finishedCount || 0,
          pendingMatches: pendingCount || 0,
        });
      } catch (err: any) {
        console.error(err);
        showToast(err.message || "Erro ao buscar métricas do dashboard.", "error");
      } finally {
        setLoading(false);
      }
    };

    const fetchPin = async () => {
      try {
        const { data, error } = await supabase
          .from("configuracoes")
          .select("valor")
          .eq("chave", "codigo_presenca")
          .single();
        if (!error && data) {
          setPinCode(data.valor);
          setNewPin(data.valor);
        }
      } catch (err) {
        console.error("Erro ao buscar PIN de presença:", err);
      }
    };

    fetchStats();
    fetchPin();
  }, [showToast]);

  const handleGenerateQr = () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const url = tableNumber 
      ? `${origin}?ref=mesa-${tableNumber}`
      : origin;
    setQrUrl(url);
    showToast(tableNumber ? `QR Code gerado para Mesa ${tableNumber}!` : "QR Code geral gerado com sucesso!", "success");
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById("admin-qrcode-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = tableNumber ? `qrcode-troia-mesa-${tableNumber}.png` : "qrcode-troia-geral.png";
    link.href = url;
    link.click();
    showToast("QR Code baixado com sucesso!", "success");
  };

  const handleUpdatePin = async () => {
    if (!newPin || newPin.trim().length === 0) {
      showToast("O PIN de presença não pode ser vazio!", "warning");
      return;
    }
    setIsUpdatingPin(true);
    try {
      const { error } = await supabase
        .from("configuracoes")
        .update({ valor: newPin.trim(), atualizado_em: new Date().toISOString() })
        .eq("chave", "codigo_presenca");

      if (error) throw error;
      setPinCode(newPin.trim());
      showToast(`PIN de presença atualizado para: ${newPin.trim()}!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Erro ao atualizar PIN de presença no banco.", "error");
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleGenerateRandomPin = () => {
    const rand = Math.floor(1000 + Math.random() * 9000).toString();
    setNewPin(rand);
    showToast("Novo PIN aleatório gerado! Clique em 'Atualizar PIN' para salvar.", "info");
  };

  if (loading) {
    return <Loading size="lg" className="py-20" />;
  }

  const kpiData = [
    {
      title: "Participantes",
      value: stats.totalParticipants,
      desc: "Clientes cadastrados no bar",
      icon: Users,
      color: "border-primary/20 bg-zinc-900/60 shadow-[0_0_15px_rgba(212,175,55,0.05)]",
      iconColor: "text-primary bg-primary/10",
    },
    {
      title: "Palpites Enviados",
      value: stats.totalGuesses,
      desc: "Total de palpites acumulados",
      icon: MessageSquareCode,
      color: "border-emerald-500/20 bg-zinc-900/60 shadow-[0_0_15px_rgba(34,197,94,0.05)]",
      iconColor: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Jogos Finalizados",
      value: stats.finishedMatches,
      desc: "Resultados calculados",
      icon: CheckCircle,
      color: "border-blue-500/20 bg-zinc-900/60 shadow-[0_0_15px_rgba(59,130,246,0.05)]",
      iconColor: "text-blue-400 bg-blue-500/10",
    },
    {
      title: "Jogos Pendentes",
      value: stats.pendingMatches,
      desc: "Aguardando encerramento",
      icon: CalendarDays,
      color: "border-accent/20 bg-zinc-900/60 shadow-[0_0_15px_rgba(185,28,28,0.05)]",
      iconColor: "text-accent bg-accent/10",
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Bloco de Bem-vindo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <h2 className="text-xl font-display uppercase tracking-widest font-black text-foreground">
            Painel Geral do Troia Lounge
          </h2>
          <p className="text-xs text-muted mt-1">
            Controle do Bolão Copa do Mundo 2026. Lançamento de placares, auditoria de dados e mural de prêmios.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/tv", "_blank")}
            className="flex items-center gap-2"
          >
            <Tv className="w-4 h-4 text-primary" />
            Visualizar Modo TV
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => router.push("/admin/jogos")}
            className="flex items-center gap-2"
          >
            Lançar Resultados
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} hoverable={false} className={`border flex flex-col p-5 rounded-xl ${kpi.color}`}>
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted font-display">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-display font-black text-foreground mt-2 leading-none">
                {kpi.value}
              </h3>
              <p className="text-[10px] text-muted mt-2 font-medium">
                {kpi.desc}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Seção QR Code e Atalhos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gerador de QR Code */}
        <Card variant="gold" hoverable={false} className="lg:col-span-2 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="text-md font-display uppercase tracking-widest font-bold text-foreground">
              Gerador de QR Code de Mesas
            </h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Gere links específicos para fixar nas mesas do Troia Lounge Bar. Se o cliente escanear o QR Code de mesa contendo a referência da mesa, o sistema registrará a mesa dele.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-end mt-2">
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted font-display">
                Número da Mesa (Opcional)
              </label>
              <input
                type="number"
                placeholder="Ex: 12"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-sans placeholder:text-zinc-600 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="primary" className="flex-1 sm:flex-initial" onClick={handleGenerateQr}>
                Gerar QR Code
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center p-6 bg-zinc-950/60 border border-zinc-900 rounded-xl mt-4">
            <div className="p-4 bg-white rounded-xl shadow-lg flex items-center justify-center">
              <QRCodeCanvas
                id="admin-qrcode-canvas"
                value={qrUrl}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex-1 flex flex-col gap-3 text-center sm:text-left">
              <div className="flex flex-col">
                <span className="text-[10px] text-primary uppercase font-display tracking-widest font-black">
                  URL Codificada:
                </span>
                <span className="text-xs text-foreground font-mono break-all line-clamp-2 mt-1">
                  {qrUrl}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-[10px] text-muted">
                <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                  Gera o link de acesso direto
                </span>
                {tableNumber && (
                  <span className="font-semibold text-emerald-400">
                    ✓ Contém parâmetro de mesa referenciado!
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 mt-2 w-full sm:w-auto"
                onClick={handleDownloadQr}
              >
                <Download className="w-4 h-4" />
                Baixar PNG de Impressão
              </Button>
            </div>
          </div>
        </Card>

        {/* Controle de Presença (PIN do Dia) */}
        <Card variant="red" hoverable={false} className="p-6 flex flex-col gap-5 border-accent/20 bg-zinc-950/80 shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3">
            <Lock className="w-5 h-5 text-accent" />
            <h3 className="text-md font-display uppercase tracking-widest font-bold text-foreground">
              Controle de Presença (PIN)
            </h3>
          </div>

          <div className="flex flex-col gap-4 text-xs text-muted leading-relaxed">
            <p>
              Defina um código PIN rotativo (ex: <strong className="text-foreground">2026</strong> ou <strong className="text-foreground">CHOPP</strong>) para liberar palpites. Os clientes precisam digitar este PIN nos celulares para confirmar que estão no bar.
            </p>

            {/* Exibição do PIN Ativo */}
            <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 font-display">PIN Ativo Atualmente:</span>
                <span className="text-xl font-display font-black text-primary tracking-widest mt-0.5">
                  {pinCode}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none animate-pulse">
                Ativo nas TVs
              </span>
            </div>

            {/* Inputs para alterar */}
            <div className="flex flex-col gap-2.5 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 font-display">
                  Novo PIN de Presença
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 5892"
                    value={newPin}
                    maxLength={15}
                    onChange={(e) => setNewPin(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-xs font-display tracking-wider font-bold focus:border-accent focus:outline-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRandomPin}
                    className="text-zinc-400 border-zinc-800 hover:bg-zinc-900 text-xs px-2.5"
                    title="Gerar PIN Numérico Aleatório"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <Button
                variant="accent"
                size="sm"
                onClick={handleUpdatePin}
                disabled={isUpdatingPin}
                className="w-full mt-2"
              >
                {isUpdatingPin ? "Salvando..." : "Atualizar PIN"}
              </Button>
            </div>

            {/* Instruções de regulamento rápidas */}
            <div className="mt-4 p-3 bg-zinc-900/40 border border-zinc-900/60 rounded-xl text-[10px] text-zinc-400">
              <span className="font-bold text-accent uppercase block mb-0.5">Como usar</span>
              1. Mude o PIN no início de cada rodada ou rodada do dia.<br />
              2. O PIN piscará no cabeçalho das TVs do bar.<br />
              3. O cliente digita o PIN para poder registrar o voto.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
