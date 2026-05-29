import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Carregar variáveis de ambiente
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqoxodcvbdlfquwodujr.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_AcUblUbl88DVGe2jEWg0nA_2nT31RjT";

// Cria cliente Supabase PÚBLICO (igual ao navegador)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminLogin() {
  const email = "adm@troiacabofrio.com.br";
  const password = "Copatroia2026";

  console.log(`Testando autenticação de ${email}...`);

  // 1. Tenta logar
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("❌ Erro de Autenticação Supabase Auth:", authError.message);
    process.exit(1);
  }

  console.log("✓ Autenticação básica realizada com sucesso!");
  console.log("ID do Usuário:", authData.user?.id);
  console.log("E-mail retornado pela Auth:", authData.user?.email);

  const userEmail = authData.user?.email;

  // 2. Tenta fazer a consulta na tabela "admins" com o cliente autenticado (simulando o navegador)
  console.log("\nTentando consultar a tabela 'admins'...");
  const { data: adminExists, error: dbError } = await supabase
    .from("admins")
    .select("id, email")
    .eq("email", userEmail)
    .single();

  if (dbError) {
    console.error("❌ Erro ao consultar tabela 'admins':", dbError.message);
    console.error("Detalhes do erro:", dbError);
    
    // Tenta uma consulta alternativa para auditar
    console.log("\nAuditoria: Tenta buscar TODOS os admins com RLS...");
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from("admins")
      .select("*");
    if (allAdminsError) {
      console.error("❌ Falha também ao listar todos:", allAdminsError.message);
    } else {
      console.log("Lista de admins visíveis para esta sessão:", allAdmins);
    }
  } else {
    console.log("🎉 SUCESSO! Administrador encontrado no banco de dados:", adminExists);
  }

  // Desconecta a sessão de teste
  await supabase.auth.signOut();
  process.exit(0);
}

testAdminLogin();
