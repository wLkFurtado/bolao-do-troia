import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE (.env.local)
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

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "wallkerfurtado@gmail.com";
  // Senha fornecida via argumento do terminal ou senha padrão segura
  const password = process.argv[2] || "TroiaLounge2026@";

  console.log("-----------------------------------------------------------------");
  console.log("  CONFIGURADOR DE ADMINISTRADOR - BOLÃO DO TROIA LOUNGE BAR      ");
  console.log("-----------------------------------------------------------------");
  console.log(`E-mail: ${email}`);
  console.log(`Senha:  ${password}`);
  console.log("-----------------------------------------------------------------");

  // 1. Garantir que o email está registrado na tabela SQL "admins"
  const { error: dbError } = await supabase
    .from("admins")
    .upsert({ email }, { onConflict: "email" });

  if (dbError) {
    console.error("❌ Erro ao registrar e-mail na tabela 'admins' do banco de dados:", dbError.message);
    process.exit(1);
  }
  console.log("✓ E-mail registrado com sucesso na tabela de controle 'admins'.");

  try {
    // 2. Verificar se o usuário já existe na Autenticação (Auth) do Supabase
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    const existingUser = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      console.log(`ℹ️ O usuário administrador com e-mail ${email} já existe na autenticação.`);
      
      // Atualiza a senha do usuário existente
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      );
      if (updateError) throw updateError;
      
      console.log(`✓ Senha atualizada com sucesso para o administrador existente!`);
    } else {
      // Cria um novo usuário na autenticação com e-mail confirmado automaticamente
      const { error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (createError) throw createError;

      console.log(`✓ Administrador criado e confirmado com sucesso na autenticação do Supabase!`);
    }

    console.log("-----------------------------------------------------------------");
    console.log("🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("-----------------------------------------------------------------");
    console.log(`Agora você já pode fazer login na área restrita:`);
    console.log(`🔗 Link:  http://localhost:3001/admin/login`);
    console.log(`📧 Login: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log("-----------------------------------------------------------------");
    process.exit(0);

  } catch (err: any) {
    console.error("❌ Erro ao gerenciar credenciais de autenticação no Supabase Auth:", err.message || err);
    console.log("\nDica: Verifique se sua SUPABASE_SERVICE_ROLE_KEY está correta no arquivo .env.local.");
    process.exit(1);
  }
}

createAdmin();
