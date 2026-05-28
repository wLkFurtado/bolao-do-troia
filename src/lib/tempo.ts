import { toZonedTime, format } from "date-fns-tz";
import { addMinutes } from "date-fns";

const TIMEZONE = "America/Sao_Paulo";

// Obtém a data convertida para o Timezone de Brasília (GMT-3)
export function getZonedDate(date: Date | string): Date {
  return toZonedTime(new Date(date), TIMEZONE);
}

// Formata uma data no fuso de Brasília
export function formatZoned(date: Date | string, formatStr: string = "dd/MM/yyyy HH:mm"): string {
  try {
    const zonedDate = toZonedTime(new Date(date), TIMEZONE);
    return format(zonedDate, formatStr, { timeZone: TIMEZONE });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "";
  }
}

// Enforça se o palpite já está bloqueado (agora >= início + 5 minutos)
export function isJogoBloqueado(dataHoraJogo: string | Date): boolean {
  const now = new Date();
  const limite = addMinutes(new Date(dataHoraJogo), 5);
  return now >= limite;
}

// Enforça se o jogo está acontecendo agora (início - 2h até início + 5min)
// Conforme especificação: "Acontecendo agora": jogos cujo horário esteja entre agora - 2h e agora + 5min
export function isAcontecendoAgora(dataHoraJogo: string | Date): boolean {
  const now = new Date();
  const jogoTime = new Date(dataHoraJogo).getTime();
  const duasHorasAtras = now.getTime() - 2 * 60 * 60 * 1000;
  const cincoMinutosFrente = now.getTime() + 5 * 60 * 1000;
  
  return jogoTime >= duasHorasAtras && jogoTime <= cincoMinutosFrente;
}

// Enforça se o jogo iniciou nos próximos 24h
export function isProximas24h(dataHoraJogo: string | Date): boolean {
  const now = new Date();
  const jogoTime = new Date(dataHoraJogo).getTime();
  const vinteQuatroHorasFrente = now.getTime() + 24 * 60 * 60 * 1000;
  
  return jogoTime > now.getTime() && jogoTime <= vinteQuatroHorasFrente;
}
