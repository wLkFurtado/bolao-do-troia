import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. CARREGAMENTO MANUAL DE VARIÁVEIS DE AMBIENTE (.env.local)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const index = trimmed.indexOf("=");
      const key = trimmed.substring(0, index).trim();
      const val = trimmed.substring(index + 1).trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas em .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 2. CORRESPONDÊNCIA DE BANDEIRAS (FlagCDN ISO Codes)
const flagMap: Record<string, string> = {
  "México": "mx",
  "África do Sul": "za",
  "Coreia do Sul": "kr",
  "República Tcheca": "cz",
  "Canadá": "ca",
  "Bósnia e Herzegovina": "ba",
  "Catar": "qa",
  "Suíça": "ch",
  "Brasil": "br",
  "Marrocos": "ma",
  "Haiti": "ht",
  "Escócia": "gb-sct",
  "Estados Unidos": "us",
  "Paraguai": "py",
  "Austrália": "au",
  "Turquia": "tr",
  "Alemanha": "de",
  "Curaçao": "cw",
  "Costa do Marfim": "ci",
  "Equador": "ec",
  "Holanda": "nl",
  "Japão": "jp",
  "Suécia": "se",
  "Tunísia": "tn",
  "Espanha": "es",
  "Cabo Verde": "cv",
  "Bélgica": "be",
  "Egito": "eg",
  "Arábia Saudita": "sa",
  "Uruguai": "uy",
  "Irã": "ir",
  "Nova Zelândia": "nz",
  "Argentina": "ar",
  "Argélia": "dz",
  "França": "fr",
  "Senegal": "sn",
  "Iraque": "iq",
  "Noruega": "no",
  "Áustria": "at",
  "Jordânia": "jo",
  "Portugal": "pt",
  "RD Congo": "cd",
  "Inglaterra": "gb-eng",
  "Croácia": "hr",
  "Gana": "gh",
  "Panamá": "pa",
  "Uzbequistão": "uz",
  "Colômbia": "co"
};

function getFlagUrl(country: string): string | null {
  const code = flagMap[country];
  return code ? `https://flagcdn.com/w160/${code}.png` : null;
}

// 3. SEED DOS JOGOS DA FASE DE GRUPOS (72 partidas)
const jogosGrupo = [
  // --- 1ª Rodada ---
  // 11 de junho
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "A", data_hora: "2026-06-11T16:00:00-03:00", time_casa: "México", time_visitante: "África do Sul", cidade: "Cidade do México", estadio: "Estádio Azteca" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "A", data_hora: "2026-06-11T23:00:00-03:00", time_casa: "Coreia do Sul", time_visitante: "República Tcheca", cidade: "Guadalajara", estadio: "Estádio Akron" },
  // 12 de junho
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "B", data_hora: "2026-06-12T16:00:00-03:00", time_casa: "Canadá", time_visitante: "Bósnia e Herzegovina", cidade: "Toronto", estadio: "BMO Field" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "D", data_hora: "2026-06-12T22:00:00-03:00", time_casa: "Estados Unidos", time_visitante: "Paraguai", cidade: "Los Angeles", estadio: "SoFi Stadium" },
  // 13 de junho
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "D", data_hora: "2026-06-13T01:00:00-03:00", time_casa: "Austrália", time_visitante: "Turquia", cidade: "Vancouver", estadio: "BC Place" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "B", data_hora: "2026-06-13T16:00:00-03:00", time_casa: "Catar", time_visitante: "Suíça", cidade: "San Francisco", estadio: "Levi's Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "C", data_hora: "2026-06-13T19:00:00-03:00", time_casa: "Brasil", time_visitante: "Marrocos", cidade: "Nova York/Nova Jersey", estadio: "MetLife Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "C", data_hora: "2026-06-13T22:00:00-03:00", time_casa: "Haiti", time_visitante: "Escócia", cidade: "Boston", estadio: "Gillette Stadium" },
  // 14 de junho
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "E", data_hora: "2026-06-14T14:00:00-03:00", time_casa: "Alemanha", time_visitante: "Curaçao", cidade: "Houston", estadio: "NRG Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "F", data_hora: "2026-06-14T17:00:00-03:00", time_casa: "Holanda", time_visitante: "Japão", cidade: "Dallas", estadio: "AT&T Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "E", data_hora: "2026-06-14T20:00:00-03:00", time_casa: "Costa do Marfim", time_visitante: "Equador", cidade: "Filadélfia", estadio: "Lincoln Financial Field" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "F", data_hora: "2026-06-14T23:00:00-03:00", time_casa: "Suécia", time_visitante: "Tunísia", cidade: "Monterrey", estadio: "Estádio BBVA" },
  // 15 de junho
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "H", data_hora: "2026-06-15T13:00:00-03:00", time_casa: "Espanha", time_visitante: "Cabo Verde", cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "G", data_hora: "2026-06-15T16:00:00-03:00", time_casa: "Bélgica", time_visitante: "Egito", cidade: "Seattle", estadio: "Lumen Field" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "H", data_hora: "2026-06-15T19:00:00-03:00", time_casa: "Arábia Saudita", time_visitante: "Uruguai", cidade: "Miami", estadio: "Hard Rock Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "G", data_hora: "2026-06-15T22:00:00-03:00", time_casa: "Irã", time_visitante: "Nova Zelândia", cidade: "Los Angeles", estadio: "SoFi Stadium" },
  // 16 de junho
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "J", data_hora: "2026-06-16T14:00:00-03:00", time_casa: "Argentina", time_visitante: "Argélia", cidade: "Kansas City", estadio: "Arrowhead Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "I", data_hora: "2026-06-16T16:00:00-03:00", time_casa: "França", time_visitante: "Senegal", cidade: "Nova York/Nova Jersey", estadio: "MetLife Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "I", data_hora: "2026-06-16T19:00:00-03:00", time_casa: "Iraque", time_visitante: "Noruega", cidade: "Boston", estadio: "Gillette Stadium" },
  // 17 de junho
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "J", data_hora: "2026-06-17T01:00:00-03:00", time_casa: "Áustria", time_visitante: "Jordânia", cidade: "San Francisco", estadio: "Levi's Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "K", data_hora: "2026-06-17T14:00:00-03:00", time_casa: "Portugal", time_visitante: "RD Congo", cidade: "Houston", estadio: "NRG Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "L", data_hora: "2026-06-17T17:00:00-03:00", time_casa: "Inglaterra", time_visitante: "Croácia", cidade: "Dallas", estadio: "AT&T Stadium" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "L", data_hora: "2026-06-17T20:00:00-03:00", time_casa: "Gana", time_visitante: "Panamá", cidade: "Toronto", estadio: "BMO Field" },
  { rodada: "Fase de Grupos - 1ª rodada", grupo: "K", data_hora: "2026-06-17T23:00:00-03:00", time_casa: "Uzbequistão", time_visitante: "Colômbia", cidade: "Cidade do México", estadio: "Estádio Azteca" },

  // --- 2ª Rodada ---
  // 18 de junho
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "A", data_hora: "2026-06-18T13:00:00-03:00", time_casa: "República Tcheca", time_visitante: "África do Sul", cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "B", data_hora: "2026-06-18T16:00:00-03:00", time_casa: "Suíça", time_visitante: "Bósnia e Herzegovina", cidade: "Los Angeles", estadio: "SoFi Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "B", data_hora: "2026-06-18T19:00:00-03:00", time_casa: "Canadá", time_visitante: "Catar", cidade: "Vancouver", estadio: "BC Place" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "A", data_hora: "2026-06-18T22:00:00-03:00", time_casa: "México", time_visitante: "Coreia do Sul", cidade: "Guadalajara", estadio: "Estádio Akron" },
  // 19 de junho
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "D", data_hora: "2026-06-19T01:00:00-03:00", time_casa: "Turquia", time_visitante: "Paraguai", cidade: "San Francisco", estadio: "Levi's Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "D", data_hora: "2026-06-19T16:00:00-03:00", time_casa: "Estados Unidos", time_visitante: "Austrália", cidade: "Seattle", estadio: "Lumen Field" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "C", data_hora: "2026-06-19T19:00:00-03:00", time_casa: "Escócia", time_visitante: "Marrocos", cidade: "Boston", estadio: "Gillette Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "C", data_hora: "2026-06-19T22:00:00-03:00", time_casa: "Brasil", time_visitante: "Haiti", cidade: "Filadélfia", estadio: "Lincoln Financial Field" },
  // 20 de junho
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "F", data_hora: "2026-06-20T14:00:00-03:00", time_casa: "Holanda", time_visitante: "Suécia", cidade: "Houston", estadio: "NRG Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "E", data_hora: "2026-06-20T17:00:00-03:00", time_casa: "Alemanha", time_visitante: "Costa do Marfim", cidade: "Toronto", estadio: "BMO Field" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "E", data_hora: "2026-06-20T21:00:00-03:00", time_casa: "Equador", time_visitante: "Curaçao", cidade: "Kansas City", estadio: "Arrowhead Stadium" },
  // 21 de junho
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "F", data_hora: "2026-06-21T01:00:00-03:00", time_casa: "Tunísia", time_visitante: "Japão", cidade: "Monterrey", estadio: "Estádio BBVA" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "H", data_hora: "2026-06-21T13:00:00-03:00", time_casa: "Espanha", time_visitante: "Arábia Saudita", cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "G", data_hora: "2026-06-21T16:00:00-03:00", time_casa: "Bélgica", time_visitante: "Irã", cidade: "Los Angeles", estadio: "SoFi Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "H", data_hora: "2026-06-21T19:00:00-03:00", time_casa: "Uruguai", time_visitante: "Cabo Verde", cidade: "Miami", estadio: "Hard Rock Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "G", data_hora: "2026-06-21T22:00:00-03:00", time_casa: "Nova Zelândia", time_visitante: "Egito", cidade: "Vancouver", estadio: "BC Place" },
  // 22 de junho
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "J", data_hora: "2026-06-22T14:00:00-03:00", time_casa: "Argentina", time_visitante: "Áustria", cidade: "Dallas", estadio: "AT&T Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "I", data_hora: "2026-06-22T18:00:00-03:00", time_casa: "França", time_visitante: "Iraque", city: "Filadélfia", estadio: "Lincoln Financial Field" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "I", data_hora: "2026-06-22T21:00:00-03:00", time_casa: "Noruega", time_visitante: "Senegal", cidade: "Nova York/Nova Jersey", estadio: "MetLife Stadium" },
  // 23 de junho
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "J", data_hora: "2026-06-23T00:00:00-03:00", time_casa: "Jordânia", time_visitante: "Argélia", cidade: "San Francisco", estadio: "Levi's Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "K", data_hora: "2026-06-23T14:00:00-03:00", time_casa: "Portugal", time_visitante: "Uzbequistão", cidade: "Houston", estadio: "NRG Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "L", data_hora: "2026-06-23T17:00:00-03:00", time_casa: "Inglaterra", time_visitante: "Gana", cidade: "Boston", estadio: "Gillette Stadium" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "L", data_hora: "2026-06-23T20:00:00-03:00", time_casa: "Panamá", time_visitante: "Croácia", cidade: "Toronto", estadio: "BMO Field" },
  { rodada: "Fase de Grupos - 2ª rodada", grupo: "K", data_hora: "2026-06-23T23:00:00-03:00", time_casa: "Colômbia", time_visitante: "RD Congo", cidade: "Guadalajara", estadio: "Estádio Akron" },

  // --- 3ª Rodada ---
  // 24 de junho
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "B", data_hora: "2026-06-24T16:00:00-03:00", time_casa: "Suíça", time_visitante: "Canadá", cidade: "Vancouver", estadio: "BC Place" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "B", data_hora: "2026-06-24T16:00:00-03:00", time_casa: "Bósnia e Herzegovina", time_visitante: "Catar", cidade: "Seattle", estadio: "Lumen Field" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "C", data_hora: "2026-06-24T19:00:00-03:00", time_casa: "Escócia", time_visitante: "Brasil", cidade: "Miami", estadio: "Hard Rock Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "C", data_hora: "2026-06-24T19:00:00-03:00", time_casa: "Marrocos", time_visitante: "Haiti", cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "A", data_hora: "2026-06-24T22:00:00-03:00", time_casa: "República Tcheca", time_visitante: "México", cidade: "Cidade do México", estadio: "Estádio Azteca" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "A", data_hora: "2026-06-24T22:00:00-03:00", time_casa: "África do Sul", time_visitante: "Coreia do Sul", cidade: "Monterrey", estadio: "Estádio BBVA" },
  // 25 de junho
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "E", data_hora: "2026-06-25T17:00:00-03:00", time_casa: "Equador", time_visitante: "Alemanha", cidade: "Nova York/Nova Jersey", estadio: "MetLife Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "E", data_hora: "2026-06-25T17:00:00-03:00", time_casa: "Curaçao", time_visitante: "Costa do Marfim", cidade: "Filadélfia", estadio: "Lincoln Financial Field" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "F", data_hora: "2026-06-25T20:00:00-03:00", time_casa: "Japão", time_visitante: "Suécia", cidade: "Dallas", estadio: "AT&T Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "F", data_hora: "2026-06-25T20:00:00-03:00", time_casa: "Tunísia", time_visitante: "Holanda", cidade: "Kansas City", estadio: "Arrowhead Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "D", data_hora: "2026-06-25T23:00:00-03:00", time_casa: "Turquia", time_visitante: "Estados Unidos", cidade: "Los Angeles", estadio: "SoFi Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "D", data_hora: "2026-06-25T23:00:00-03:00", time_casa: "Paraguai", time_visitante: "Austrália", cidade: "San Francisco", estadio: "Levi's Stadium" },
  // 26 de junho
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "I", data_hora: "2026-06-26T16:00:00-03:00", time_casa: "Noruega", time_visitante: "França", cidade: "Boston", estadio: "Gillette Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "I", data_hora: "2026-06-26T16:00:00-03:00", time_casa: "Senegal", time_visitante: "Iraque", cidade: "Toronto", estadio: "BMO Field" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "H", data_hora: "2026-06-26T21:00:00-03:00", time_casa: "Cabo Verde", time_visitante: "Arábia Saudita", cidade: "Houston", estadio: "NRG Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "H", data_hora: "2026-06-26T21:00:00-03:00", time_casa: "Uruguai", time_visitante: "Espanha", cidade: "Guadalajara", estadio: "Estádio Akron" },
  // 27 de junho
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "G", data_hora: "2026-06-27T00:00:00-03:00", time_casa: "Egito", time_visitante: "Irã", cidade: "Seattle", estadio: "Lumen Field" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "G", data_hora: "2026-06-27T00:00:00-03:00", time_casa: "Nova Zelândia", time_visitante: "Bélgica", cidade: "Vancouver", estadio: "BC Place" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "L", data_hora: "2026-06-27T18:00:00-03:00", time_casa: "Panamá", time_visitante: "Inglaterra", cidade: "Nova York/Nova Jersey", estadio: "MetLife Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "L", data_hora: "2026-06-27T18:00:00-03:00", time_casa: "Croácia", time_visitante: "Gana", cidade: "Filadélfia", estadio: "Lincoln Financial Field" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "K", data_hora: "2026-06-27T20:30:00-03:00", time_casa: "Colômbia", time_visitante: "Portugal", cidade: "Miami", estadio: "Hard Rock Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "K", data_hora: "2026-06-27T20:30:00-03:00", time_casa: "RD Congo", time_visitante: "Uzbequistão", cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "J", data_hora: "2026-06-27T23:00:00-03:00", time_casa: "Argélia", time_visitante: "Áustria", cidade: "Kansas City", estadio: "Arrowhead Stadium" },
  { rodada: "Fase de Grupos - 3ª rodada", grupo: "J", data_hora: "2026-06-27T23:00:00-03:00", time_casa: "Jordânia", time_visitante: "Argentina", cidade: "Dallas", estadio: "AT&T Stadium" }
];

// 4. SEED DOS PLACEHOLDERS DO MATA-MATA
const jogosMataMata = [
  // 16 avos de final (32 times) - de 28/jun a 03/jul
  { rodada: "16 avos de final", grupo: null, data_hora: "2026-06-28T16:00:00-03:00", time_casa: "1º Grupo A", time_visitante: "3º Grupo C/D/E", cidade: "Los Angeles", estadio: "SoFi Stadium" },
  { rodada: "16 avos de final", grupo: null, data_hora: "2026-06-29T19:00:00-03:00", time_casa: "1º Grupo B", time_visitante: "2º Grupo F", cidade: "Boston", estadio: "Gillette Stadium" },
  { rodada: "16 avos de final", grupo: null, data_hora: "2026-06-30T17:00:00-03:00", time_casa: "2º Grupo A", time_visitante: "2º Grupo B", cidade: "Dallas", estadio: "AT&T Stadium" },
  { rodada: "16 avos de final", grupo: null, data_hora: "2026-07-01T20:00:00-03:00", time_casa: "1º Grupo C", time_visitante: "3º Grupo A/B/F", cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },
  { rodada: "16 avos de final", grupo: null, data_hora: "2026-07-02T22:00:00-03:00", time_casa: "1º Grupo D", time_visitante: "2º Grupo C", cidade: "San Francisco", estadio: "Levi's Stadium" },
  { rodada: "16 avos de final", grupo: null, data_hora: "2026-07-03T16:00:00-03:00", time_casa: "1º Grupo E", time_visitante: "2º Grupo D", cidade: "Houston", estadio: "NRG Stadium" },

  // Oitavas de final - de 04 a 07 de julho
  { rodada: "Oitavas de final", grupo: null, data_hora: "2026-07-04T16:00:00-03:00", time_casa: "Vencedor J33", time_visitante: "Vencedor J34", cidade: "Filadélfia", estadio: "Lincoln Financial Field" },
  { rodada: "Oitavas de final", grupo: null, data_hora: "2026-07-05T19:00:00-03:00", time_casa: "Vencedor J35", time_visitante: "Vencedor J36", cidade: "Nova York/Nova Jersey", estadio: "MetLife Stadium" },
  { rodada: "Oitavas de final", grupo: null, data_hora: "2026-07-06T17:00:00-03:00", time_casa: "Vencedor J37", time_visitante: "Vencedor J38", cidade: "Toronto", estadio: "BMO Field" },
  { rodada: "Oitavas de final", grupo: null, data_hora: "2026-07-07T21:00:00-03:00", time_casa: "Vencedor J39", time_visitante: "Vencedor J40", cidade: "Vancouver", estadio: "BC Place" },

  // Quartas de final - de 09 a 11 de julho
  { rodada: "Quartas de final", grupo: null, data_hora: "2026-07-09T16:00:00-03:00", time_casa: "Vencedor Oitavas 1", time_visitante: "Vencedor Oitavas 2", cidade: "Boston", estadio: "Gillette Stadium" },
  { rodada: "Quartas de final", grupo: null, data_hora: "2026-07-10T19:00:00-03:00", time_casa: "Vencedor Oitavas 3", time_visitante: "Vencedor Oitavas 4", cidade: "Los Angeles", estadio: "SoFi Stadium" },
  { rodada: "Quartas de final", grupo: null, data_hora: "2026-07-11T17:00:00-03:00", time_casa: "Vencedor Oitavas 5", time_visitante: "Vencedor Oitavas 6", cidade: "Miami", estadio: "Hard Rock Stadium" },

  // Semifinais - 14 e 15 de julho (16:00)
  { rodada: "Semifinais", grupo: null, data_hora: "2026-07-14T16:00:00-03:00", time_casa: "Vencedor Quartas 1", time_visitante: "Vencedor Quartas 2", cidade: "Dallas", estadio: "AT&T Stadium" },
  { rodada: "Semifinais", grupo: null, data_hora: "2026-07-15T16:00:00-03:00", time_casa: "Vencedor Quartas 3", time_visitante: "Vencedor Quartas 4", cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },

  // Disputa do 3º Lugar - 18 de julho, 17:00
  { rodada: "Disputa de 3º lugar", grupo: null, data_hora: "2026-07-18T17:00:00-03:00", time_casa: "Perdedor Semifinal 1", time_visitante: "Perdedor Semifinal 2", cidade: "Miami", estadio: "Hard Rock Stadium" },

  // Final - 19 de julho, 16:00
  { rodada: "Final", grupo: null, data_hora: "2026-07-19T16:00:00-03:00", time_casa: "Vencedor Semifinal 1", time_visitante: "Vencedor Semifinal 2", cidade: "Nova York/Nova Jersey", estadio: "MetLife Stadium (Nova Jersey)" }
];

async function seed() {
  console.log("Iniciando semeadura de jogos no Supabase...");
  
  const todosJogos = [...jogosGrupo, ...jogosMataMata];
  
  const rows = todosJogos.map((j) => {
    // Caso especial na digitação
    const timeCasa = j.time_casa;
    const timeVisitante = j.time_visitante;
    
    return {
      rodada: j.rodada,
      grupo: j.grupo,
      data_hora: j.data_hora,
      time_casa: timeCasa,
      time_visitante: timeVisitante,
      bandeira_casa: getFlagUrl(timeCasa),
      bandeira_visitante: getFlagUrl(timeVisitante),
      cidade: j.cidade,
      estadio: j.estadio,
      finalizado: false
    };
  });

  // Limpar jogos anteriores se existirem (para evitar duplicações em re-seed)
  const { error: deleteError } = await supabase.from("jogos").delete().neq("rodada", "");
  if (deleteError) {
    console.error("Erro ao limpar tabela de jogos:", deleteError);
  } else {
    console.log("Tabela de jogos limpa com sucesso!");
  }

  // Inserir em lotes de 20 para evitar limites do Supabase / Payload size
  const batchSize = 20;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("jogos").insert(batch);
    if (error) {
      console.error(`Erro ao inserir lote ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Lote ${i / batchSize + 1} de jogos semeado com sucesso!`);
    }
  }

  console.log("Seeding finalizado com sucesso!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Falha catastrófica no script de seed:", err);
  process.exit(1);
});
