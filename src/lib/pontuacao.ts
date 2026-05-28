export interface Placar {
  casa: number;
  visitante: number;
}

// Calcula localmente a pontuação do palpite de acordo com a regra oficial
export function calcularPontosPalpite(
  palpiteCasa: number,
  palpiteVisitante: number,
  golsCasa: number,
  golsVisitante: number
): number {
  // 1. Placar Exato (10 Pontos)
  if (palpiteCasa === golsCasa && palpiteVisitante === golsVisitante) {
    return 10;
  }

  const previuVitoriaCasa = palpiteCasa > palpiteVisitante;
  const previuVitoriaVisitante = palpiteCasa < palpiteVisitante;
  const previuEmpate = palpiteCasa === palpiteVisitante;

  const realVitoriaCasa = golsCasa > golsVisitante;
  const realVitoriaVisitante = golsCasa < golsVisitante;
  const realEmpate = golsCasa === golsVisitante;

  // 2. Verificação de Vencedor ou Empate Correto
  const acertouVendedorOuEmpate =
    (previuVitoriaCasa && realVitoriaCasa) ||
    (previuVitoriaVisitante && realVitoriaVisitante) ||
    (previuEmpate && realEmpate);

  if (acertouVendedorOuEmpate) {
    // Se for empate e não exato, é sempre 5 pontos
    if (realEmpate) {
      return 5;
    }
    
    // Se acertou vencedor e o saldo de gols é idêntico: 7 pontos
    const saldoPalpite = palpiteCasa - palpiteVisitante;
    const saldoReal = golsCasa - golsVisitante;
    if (saldoPalpite === saldoReal) {
      return 7;
    }

    // Apenas acertou o vencedor: 5 pontos
    return 5;
  }

  // Errou completamente: 0 pontos
  return 0;
}

// Tradução amigável dos pontos
export function obterLabelPontuacao(pontos: number): { label: string; classe: string } {
  switch (pontos) {
    case 10:
      return { label: "Placar Exato (+10)", classe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    case 7:
      return { label: "Vencedor & Saldo (+7)", classe: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    case 5:
      return { label: "Apenas Vencedor (+5)", classe: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    default:
      return { label: "Sem Pontos (+0)", classe: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" };
  }
}
