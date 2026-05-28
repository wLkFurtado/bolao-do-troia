"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, useToast, Loading, Dialog } from "@/components/ui-custom";
import { formatZoned } from "@/lib/tempo";
import { Trophy, Calendar, Search, SlidersHorizontal, AlertCircle, Edit, MapPin, Eye } from "lucide-react";
import Image from "next/image";

const ROUNDS = [
  "Fase de Grupos - 1ª rodada",
  "Fase de Grupos - 2ª rodada",
  "Fase de Grupos - 3ª rodada",
  "16 avos de final",
  "Oitavas de final",
  "Quartas de final",
  "Semifinais",
  "Disputa de 3º lugar",
  "Final"
];

const GROUPS = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export default function AdminJogos() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jogos, setJogos] = useState<any[]>([]);
  
  // Filtros
  const [selectedRound, setSelectedRound] = useState(ROUNDS[0]);
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Lançamento
  const [selectedJogo, setSelectedJogo] = useState<any | null>(null);
  const [golsCasa, setGolsCasa] = useState("");
  const [golsVisitante, setGolsVisitante] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchJogos = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("jogos")
        .select("*")
        .eq("rodada", selectedRound)
        .order("data_hora", { ascending: true });

      if (selectedGroup !== "Todos" && selectedRound.startsWith("Fase de Grupos")) {
        query = query.eq("grupo", selectedGroup);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Aplicar filtro de busca no cliente
      if (searchTerm) {
        const filtered = (data || []).filter(
          (j: any) =>
            j.time_casa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.time_visitante.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setJogos(filtered);
      } else {
        setJogos(data || []);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao buscar a lista de jogos.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedRound, selectedGroup, searchTerm, showToast]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  const openScoreModal = (jogo: any) => {
    setSelectedJogo(jogo);
    setGolsCasa(jogo.gols_casa !== null ? String(jogo.gols_casa) : "");
    setGolsVisitante(jogo.gols_visitante !== null ? String(jogo.gols_visitante) : "");
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJogo) return;

    if (golsCasa === "" || golsVisitante === "") {
      showToast("Por favor, informe os gols de ambos os times!", "warning");
      return;
    }

    const gc = parseInt(golsCasa);
    const gv = parseInt(golsVisitante);

    if (isNaN(gc) || isNaN(gv) || gc < 0 || gv < 0 || gc > 99 || gv > 99) {
      showToast("Insira gols válidos entre 0 e 99!", "warning");
      return;
    }

    setSaving(true);

    try {
      // 1. Atualizar placar do jogo
      const { error: updateError } = await supabase
        .from("jogos")
        .update({
          gols_casa: gc,
          gols_visitante: gv,
          finalizado: true
        })
        .eq("id", selectedJogo.id);

      if (updateError) throw updateError;

      // 2. Disparar cálculo de pontos (RPC)
      const { error: rpcError } = await supabase.rpc("calcular_pontos_jogo", {
        p_jogo_id: selectedJogo.id
      });

      if (rpcError) throw rpcError;

      showToast(`Placar de ${selectedJogo.time_casa} x ${selectedJogo.time_visitante} atualizado com sucesso!`, "success");
      setSelectedJogo(null);
      fetchJogos();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao atualizar placar.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Controles de Filtros */}
      <Card variant="dark" hoverable={false} className="p-5 flex flex-col gap-4 border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-2 text-primary border-b border-zinc-900 pb-2 mb-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-xs uppercase font-display tracking-wider font-bold">Filtros de Auditoria</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selecionar Rodada */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase font-display text-muted">Rodada da Copa</label>
            <select
              value={selectedRound}
              onChange={(e) => {
                setSelectedRound(e.target.value);
                setSelectedGroup("Todos");
              }}
              className="px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-semibold focus:border-primary focus:outline-none cursor-pointer"
            >
              {ROUNDS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Selecionar Grupo (Fase de Grupos apenas) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase font-display text-muted">Grupo</label>
            <select
              value={selectedGroup}
              disabled={!selectedRound.startsWith("Fase de Grupos")}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-semibold focus:border-primary focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g === "Todos" ? "Todos os Grupos" : `Grupo ${g}`}
                </option>
              ))}
            </select>
          </div>

          {/* Busca por País */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold uppercase font-display text-muted">Buscar País</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Brasil"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm placeholder:text-zinc-600 focus:border-primary focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabela / Lista de Jogos */}
      {loading ? (
        <Loading size="lg" className="py-16" />
      ) : jogos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800 text-center">
          <AlertCircle className="w-8 h-8 text-zinc-600 mb-3" />
          <span className="text-sm font-bold text-foreground">Nenhum jogo encontrado</span>
          <span className="text-xs text-muted mt-1">Refine os filtros de busca acima.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jogos.map((jogo) => {
            const finalizado = jogo.finalizado;
            const dataJogo = formatZoned(jogo.data_hora, "dd/MM/yyyy - HH:mm'h'");
            const isBrasil = jogo.time_casa === "Brasil" || jogo.time_visitante === "Brasil";

            return (
              <Card
                key={jogo.id}
                variant={isBrasil ? "gold" : "dark"}
                hoverable={false}
                className={`flex flex-col justify-between border ${
                  isBrasil 
                    ? "border-primary/45 shadow-[0_0_15px_rgba(212,175,55,0.08)] bg-zinc-950/90" 
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-center text-[10px] text-muted border-b border-zinc-800/80 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{dataJogo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {jogo.grupo && (
                      <span className="bg-zinc-800 text-foreground px-2 py-0.5 rounded font-display uppercase tracking-wider font-bold">
                        Grupo {jogo.grupo}
                      </span>
                    )}
                    {finalizado ? (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-display uppercase tracking-wider font-black">
                        Finalizado
                      </span>
                    ) : (
                      <span className="bg-amber-950/80 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-display uppercase tracking-wider font-black">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Times e Placar */}
                <div className="flex items-center justify-between py-2 px-1 gap-3">
                  {/* Time Casa */}
                  <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                    {jogo.bandeira_casa ? (
                      <img
                        src={jogo.bandeira_casa}
                        alt={jogo.time_casa}
                        className="w-11 h-7 object-cover rounded shadow-md border border-zinc-800"
                      />
                    ) : (
                      <div className="w-11 h-7 rounded bg-zinc-800 flex items-center justify-center text-xs">⚽</div>
                    )}
                    <span className="text-xs font-semibold text-foreground line-clamp-1 w-full uppercase tracking-wider font-display">
                      {jogo.time_casa}
                    </span>
                  </div>

                  {/* Placar Real */}
                  <div className="flex flex-col items-center gap-1 min-w-[70px]">
                    {finalizado ? (
                      <span className="text-2xl font-display font-black tracking-widest text-primary bg-zinc-950 border border-zinc-800 px-3.5 py-1.5 rounded-xl shadow-inner">
                        {jogo.gols_casa} x {jogo.gols_visitante}
                      </span>
                    ) : (
                      <span className="text-xs font-display uppercase tracking-wider font-bold text-muted bg-zinc-950/60 border border-zinc-900 px-3 py-1.5 rounded-lg">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Time Visitante */}
                  <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                    {jogo.bandeira_visitante ? (
                      <img
                        src={jogo.bandeira_visitante}
                        alt={jogo.time_visitante}
                        className="w-11 h-7 object-cover rounded shadow-md border border-zinc-800"
                      />
                    ) : (
                      <div className="w-11 h-7 rounded bg-zinc-800 flex items-center justify-center text-xs">⚽</div>
                    )}
                    <span className="text-xs font-semibold text-foreground line-clamp-1 w-full uppercase tracking-wider font-display">
                      {jogo.time_visitante}
                    </span>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="border-t border-zinc-800/80 pt-3 mt-3 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-[9px] text-muted font-medium justify-center sm:justify-start">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="line-clamp-1">
                      {jogo.estadio} - {jogo.cidade}
                    </span>
                  </div>

                  <Button
                    variant={finalizado ? "secondary" : "accent"}
                    size="sm"
                    className="w-full flex items-center gap-1.5 py-2"
                    onClick={() => openScoreModal(jogo)}
                  >
                    {finalizado ? (
                      <>
                        <Edit className="w-3.5 h-3.5 text-primary" />
                        Corrigir Placar
                      </>
                    ) : (
                      <>
                        <Trophy className="w-3.5 h-3.5" />
                        Lançar Resultado
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Lançamento */}
      <Dialog
        isOpen={selectedJogo !== null}
        onClose={() => setSelectedJogo(null)}
        title={selectedJogo?.finalizado ? "Corrigir Placar" : "Lançar Resultado"}
      >
        {selectedJogo && (
          <form onSubmit={handleSaveScore} className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Confronto */}
            <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-900">
              <div className="flex items-center gap-2.5">
                {selectedJogo.bandeira_casa && (
                  <img
                    src={selectedJogo.bandeira_casa}
                    alt={selectedJogo.time_casa}
                    className="w-7 h-4.5 object-cover rounded border border-zinc-800"
                  />
                )}
                <span className="text-xs font-bold font-display uppercase text-foreground">{selectedJogo.time_casa}</span>
              </div>
              <span className="text-xs font-display text-muted tracking-widest font-black">X</span>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold font-display uppercase text-foreground">{selectedJogo.time_visitante}</span>
                {selectedJogo.bandeira_visitante && (
                  <img
                    src={selectedJogo.bandeira_visitante}
                    alt={selectedJogo.time_visitante}
                    className="w-7 h-4.5 object-cover rounded border border-zinc-800"
                  />
                )}
              </div>
            </div>

            {/* Inputs de Gols */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase font-display text-muted text-center">
                  Gols {selectedJogo.time_casa}
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  placeholder="0"
                  value={golsCasa}
                  onChange={(e) => setGolsCasa(e.target.value)}
                  className="w-full text-center px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-xl font-display font-bold focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase font-display text-muted text-center">
                  Gols {selectedJogo.time_visitante}
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  placeholder="0"
                  value={golsVisitante}
                  onChange={(e) => setGolsVisitante(e.target.value)}
                  className="w-full text-center px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-xl font-display font-bold focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Aviso informativo de recalculação */}
            <div className="flex gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg text-[10px] text-red-300 leading-relaxed">
              <Trophy className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Ao salvar o placar, o Supabase recalculou os pontos de todos os palpites desse jogo e atualizou o ranking acumulativo instantaneamente.
              </span>
            </div>

            {/* Ações */}
            <div className="flex gap-3 justify-end border-t border-zinc-800/80 pt-4">
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedJogo(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="accent" size="sm" disabled={saving}>
                {saving ? "Salvando..." : "Confirmar Placar"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
