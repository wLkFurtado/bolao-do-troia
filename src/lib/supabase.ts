import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || supabaseUrl.startsWith("https://seucaractere") || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "Aviso: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão configurados. Conecte sua conta do Supabase no arquivo .env.local!"
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para obter o cliente de serviço (backend apenas)
export const getSupabaseService = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor!");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
