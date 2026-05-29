import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqoxodcvbdlfquwodujr.supabase.co";
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxb3hvZGN2YmRsZnF1d29kdWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMTEyNjEsImV4cCI6MjA4MzU4NzI2MX0.-_WHLzr3gGWgZNN8mSdZ_6yzgynxqNqXh2ajSYJwmCc";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
  if (typeof window !== "undefined") {
    console.warn(
      "Aviso: Nenhuma chave pública do Supabase encontrada no ambiente. Usando fallbacks de produção."
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
