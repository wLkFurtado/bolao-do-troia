"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, useToast, Loading } from "@/components/ui-custom";
import { Users, Search, Download, Trash2, ShieldAlert } from "lucide-react";

export default function AdminParticipantes() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchParticipantes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar dados ordenados por pontos
      let query = supabase
        .from("participantes")
        .select("*", { count: "exact" })
        .order("pontos_total", { ascending: false });

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setParticipantes(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao carregar participantes.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showToast]);

  useEffect(() => {
    fetchParticipantes();
  }, [fetchParticipantes]);

  // Função para deletar participante em caso de necessidade administrativa
  const handleDeleteParticipant = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o participante ${nome}?\nTodos os palpites dele também serão excluídos!`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("participantes").delete().eq("id", id);
      if (error) throw error;
      
      showToast(`Participante ${nome} removido com sucesso.`, "success");
      fetchParticipantes();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao excluir participante.", "error");
      setLoading(false);
    }
  };

  // Exportar dados como CSV formatado para Excel em pt-BR
  const handleExportCSV = () => {
    if (participantes.length === 0) {
      showToast("Nenhum participante encontrado para exportar!", "warning");
      return;
    }

    const headers = [
      "Posição/Rank",
      "Nome Completo",
      "WhatsApp/Telefone",
      "E-mail",
      "Data de Nascimento",
      "Pontos Totais",
      "Data de Cadastro"
    ];

    const rows = participantes.map((p, index) => [
      index + 1,
      p.nome,
      p.telefone,
      p.email,
      p.data_nascimento,
      p.pontos_total,
      new Date(p.criado_em).toLocaleDateString("pt-BR")
    ]);

    // Usar delimitador de ponto e vírgula e BOM (Byte Order Mark) para compatibilidade perfeita com Excel BR
    const csvContent =
      "\uFEFF" +
      [
        headers.join(";"),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bolao-troia-participantes-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Planilha CSV exportada e baixada com sucesso!", "success");
  };

  // Calcular idade simples
  const calcularIdade = (dataNasc: string) => {
    try {
      const nascCli = new Date(dataNasc);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascCli.getFullYear();
      const m = hoje.getMonth() - nascCli.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascCli.getDate())) {
        idade--;
      }
      return `${idade} anos`;
    } catch {
      return "-";
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Barra de Filtros e Exportação */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-950 p-5 rounded-xl border border-zinc-800/80">
        {/* Input de Busca */}
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Buscar por nome, email ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-xs placeholder:text-zinc-600 focus:border-primary focus:outline-none"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
        </div>

        {/* Botão Exportar */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          Exportar Planilha (CSV)
        </Button>
      </div>

      {/* Tabela de Participantes */}
      {loading ? (
        <Loading size="lg" className="py-20" />
      ) : participantes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800 text-center">
          <Users className="w-10 h-10 text-zinc-700 mb-3" />
          <span className="text-sm font-bold text-foreground">Nenhum participante encontrado</span>
          <span className="text-xs text-muted mt-1">Nenhum cliente cadastrado atende ao filtro informado.</span>
        </div>
      ) : (
        <Card variant="dark" hoverable={false} className="border-zinc-800 bg-zinc-950/40 p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/60 flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider font-display font-black text-primary">
              Lista Geral de Cadastrados
            </span>
            <span className="text-[10px] text-muted uppercase font-display font-semibold">
              Total: <strong className="text-foreground">{totalCount}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase font-display tracking-wider text-muted select-none">
                  <th className="py-3.5 px-5 text-center font-bold">Pos</th>
                  <th className="py-3.5 px-4 font-bold">Nome</th>
                  <th className="py-3.5 px-4 font-bold">WhatsApp</th>
                  <th className="py-3.5 px-4 font-bold">E-mail</th>
                  <th className="py-3.5 px-4 font-bold text-center">Idade</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pontos</th>
                  <th className="py-3.5 px-4 font-bold text-center">Cadastro</th>
                  <th className="py-3.5 px-5 text-center font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p, idx) => {
                  const dataCadastro = new Date(p.criado_em).toLocaleDateString("pt-BR");
                  const rank = idx + 1;

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-900/60 hover:bg-white/2 transition-colors text-xs font-medium"
                    >
                      {/* Posição */}
                      <td className="py-4 px-5 text-center font-display font-bold">
                        {rank === 1 && <span className="text-lg">🥇</span>}
                        {rank === 2 && <span className="text-lg">🥈</span>}
                        {rank === 3 && <span className="text-lg">🥉</span>}
                        {rank > 3 && <span className="text-muted">#{rank}</span>}
                      </td>

                      {/* Nome */}
                      <td className="py-4 px-4 font-bold text-foreground uppercase tracking-wide font-display">
                        {p.nome}
                      </td>

                      {/* Telefone */}
                      <td className="py-4 px-4 text-zinc-300 font-mono">
                        {p.telefone}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-muted break-all">
                        {p.email}
                      </td>

                      {/* Idade */}
                      <td className="py-4 px-4 text-center text-zinc-300">
                        {calcularIdade(p.data_nascimento)}
                      </td>

                      {/* Pontos */}
                      <td className="py-4 px-4 text-center font-display text-base font-black text-primary">
                        {p.pontos_total}
                      </td>

                      {/* Cadastro */}
                      <td className="py-4 px-4 text-center text-muted">
                        {dataCadastro}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleDeleteParticipant(p.id, p.nome)}
                          title="Remover Participante"
                          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-muted hover:text-accent hover:border-accent/30 transition-all duration-300 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Aviso de GDPR/Segurança */}
      <div className="flex gap-2.5 p-3 rounded-lg bg-zinc-950/60 border border-zinc-900 text-[10px] text-muted items-start max-w-2xl select-none">
        <ShieldAlert className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <span>
          <strong>Nota de Privacidade:</strong> Os dados dos participantes são restritos ao uso administrativo do Troia Lounge Bar. Não compartilhe este arquivo CSV exportado com terceiros não autorizados.
        </span>
      </div>
    </div>
  );
}
