"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, useToast, Loading, Input } from "@/components/ui-custom";
import { Gift, Trash2, Calendar, Award, User, Clock, PlusCircle, AlertCircle } from "lucide-react";

export default function AdminGanhadores() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dados para os dropdowns
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [jogos, setJogos] = useState<any[]>([]);
  const [ganhadoresList, setGanhadoresList] = useState<any[]>([]);

  // Formulário
  const [selectedParticipante, setSelectedParticipante] = useState("");
  const [selectedJogo, setSelectedJogo] = useState("");
  const [rodadaManual, setRodadaManual] = useState("");
  const [premio, setPremio] = useState("");
  const [observacao, setObservacao] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Carregar participantes em ordem alfabética
      const { data: partsData, error: partsError } = await supabase
        .from("participantes")
        .select("id, nome, telefone")
        .order("nome", { ascending: true });

      // 2. Carregar jogos em ordem de data
      const { data: jogosData, error: jogosError } = await supabase
        .from("jogos")
        .select("id, time_casa, time_visitante, rodada")
        .order("data_hora", { ascending: false });

      // 3. Carregar histórico de ganhadores
      const { data: ganData, error: ganError } = await supabase
        .from("ganhadores")
        .select(`
          id,
          premio,
          anunciado_em,
          observacao,
          rodada,
          participante:participantes(nome, telefone),
          jogo:jogos(time_casa, time_visitante, rodada)
        `)
        .order("anunciado_em", { ascending: false });

      if (partsError || jogosError || ganError) throw new Error("Erro ao carregar dados administrativos.");

      setParticipantes(partsData || []);
      setJogos(jogosData || []);
      setGanhadoresList(ganData || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao carregar dados.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParticipante) {
      showToast("Selecione um participante!", "warning");
      return;
    }

    if (!premio.trim()) {
      showToast("Descreva o prêmio entregue!", "warning");
      return;
    }

    setSubmitting(true);

    try {
      // Descobrir rodada com base no jogo selecionado ou manual
      let rodadaFinal = rodadaManual || "";
      if (selectedJogo) {
        const jogoMatch = jogos.find((j) => j.id === selectedJogo);
        if (jogoMatch) {
          rodadaFinal = jogoMatch.rodada;
        }
      }

      const payload = {
        participante_id: selectedParticipante,
        jogo_id: selectedJogo || null,
        rodada: rodadaFinal || null,
        premio: premio,
        observacao: observacao || null
      };

      const { error } = await supabase.from("ganhadores").insert([payload]);
      if (error) throw error;

      showToast("Ganhador anunciado com sucesso no mural!", "success");

      // Resetar form
      setSelectedParticipante("");
      setSelectedJogo("");
      setRodadaManual("");
      setPremio("");
      setObservacao("");

      // Recarregar histórico
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao salvar ganhador.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGanhador = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este anúncio de prêmio do mural público?")) return;

    try {
      const { error } = await supabase.from("ganhadores").delete().eq("id", id);
      if (error) throw error;

      showToast("Anúncio de prêmio removido com sucesso.", "success");
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao remover prêmio.", "error");
    }
  };

  if (loading) {
    return <Loading size="lg" className="py-20" />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">
      {/* Formulário de Registro (Esquerda) */}
      <div className="w-full lg:w-2/5 shrink-0">
        <Card variant="gold" hoverable={false} className="p-6 flex flex-col gap-5 bg-zinc-950/80">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <PlusCircle className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-display uppercase tracking-widest font-bold text-foreground">
              Anunciar Novo Prêmio
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Selecionar Participante */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase font-display text-muted">
                Participante / Cliente
              </label>
              <select
                value={selectedParticipante}
                onChange={(e) => setSelectedParticipante(e.target.value)}
                className="w-full px-3.5 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-sans focus:border-primary focus:outline-none cursor-pointer"
                required
              >
                <option value="">Selecione um participante...</option>
                {participantes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {p.telefone}
                  </option>
                ))}
              </select>
            </div>

            {/* Selecionar Jogo Relacionado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase font-display text-muted">
                Jogo da Copa (Opcional)
              </label>
              <select
                value={selectedJogo}
                onChange={(e) => {
                  setSelectedJogo(e.target.value);
                  if (e.target.value) {
                    setRodadaManual(""); // Desativa manual se jogo for escolhido
                  }
                }}
                className="w-full px-3.5 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-sans focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="">Nenhum jogo em específico</option>
                {jogos.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.time_casa} x {j.time_visitante} ({j.rodada})
                  </option>
                ))}
              </select>
            </div>

            {/* Rodada Manual se não houver Jogo */}
            {!selectedJogo && (
              <Input
                label="Rodada do Prêmio (Manual - Ex: 1ª rodada)"
                placeholder="Ex: Rodada de Abertura"
                value={rodadaManual}
                onChange={(e) => setRodadaManual(e.target.value)}
              />
            )}

            {/* Descrição do Prêmio */}
            <Input
              label="Prêmio / Brinde Entregue"
              placeholder="Ex: Chopp Double / Rodada de Caipirinha"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              required
            />

            {/* Observação / Mesa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase font-display text-muted">
                Observação (Ex: Mesa 12)
              </label>
              <textarea
                placeholder="Ex: Entregue pelo garçom Carlos para a mesa 12"
                rows={3}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-sans placeholder:text-zinc-600 focus:border-primary focus:outline-none"
              />
            </div>

            <Button variant="primary" type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting ? "Anunciando..." : "Publicar no Mural"}
            </Button>
          </form>
        </Card>
      </div>

      {/* Mural do Histórico de Ganhadores (Direita) */}
      <div className="flex-1">
        <Card variant="red" hoverable={false} className="border-accent/15 bg-zinc-950/40 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Gift className="w-5 h-5 text-accent animate-bounce" />
            <h3 className="text-sm font-display uppercase tracking-widest font-bold text-foreground">
              Mural de Prêmios Ativos (Público)
            </h3>
          </div>

          {ganhadoresList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center select-none">
              <AlertCircle className="w-8 h-8 text-zinc-700 mb-3" />
              <span className="text-xs text-muted">Nenhum ganhador anunciado até o momento.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
              {ganhadoresList.map((g) => {
                const anunciado = new Date(g.anunciado_em).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div
                    key={g.id}
                    className="flex justify-between items-start p-4 bg-zinc-950/80 rounded-xl border border-zinc-900 hover:border-zinc-800 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-2 min-w-0">
                      {/* Badge do Prêmio */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-display text-[10px] tracking-wider uppercase font-bold w-fit">
                        <Award className="w-3.5 h-3.5" />
                        {g.premio}
                      </span>

                      {/* Nome do Cliente */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{g.participante?.nome || "Cliente Removido"}</span>
                        <span className="text-[10px] text-muted font-normal font-mono">
                          ({g.participante?.telefone})
                        </span>
                      </div>

                      {/* Jogo ou rodada */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>
                          {g.jogo
                            ? `${g.jogo.time_casa} x ${g.jogo.time_visitante} (${g.jogo.rodada})`
                            : g.rodada || "Mural Geral"}
                        </span>
                      </div>

                      {/* Obs */}
                      {g.observacao && (
                        <p className="text-[10px] text-zinc-500 italic bg-zinc-900/30 border border-zinc-900/80 p-2 rounded mt-1.5 leading-relaxed font-sans">
                          Obs: {g.observacao}
                        </p>
                      )}

                      {/* Data */}
                      <div className="flex items-center gap-1 text-[9px] text-zinc-600 mt-1 select-none">
                        <Clock className="w-3 h-3" />
                        Anunciado em {anunciado}h
                      </div>
                    </div>

                    {/* Excluir anúncio */}
                    <button
                      onClick={() => handleDeleteGanhador(g.id)}
                      title="Remover do Mural"
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-muted hover:text-accent hover:border-accent/30 transition-all duration-300 active:scale-95 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
