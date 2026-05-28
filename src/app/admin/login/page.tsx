"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast, Button, Card, Input } from "@/components/ui-custom";
import Logo from "@/components/logo";
import { Eye, EyeOff, ShieldCheck, Lock, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redireciona se o usuário administrador já estiver logado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/admin");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      showToast("Preencha todos os campos para fazer login!", "warning");
      return;
    }

    setLoading(true);

    try {
      // 1. Efetuar login via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        throw new Error(authError.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : authError.message);
      }

      if (authData?.user) {
        const userEmail = authData.user.email;

        // 2. Verificar se o e-mail está cadastrado na tabela "admins"
        const { data: adminExists, error: dbError } = await supabase
          .from("admins")
          .select("id")
          .eq("email", userEmail)
          .single();

        if (dbError || !adminExists) {
          // Se não estiver na tabela de administradores, desconecta imediatamente!
          await supabase.auth.signOut();
          throw new Error("Acesso negado. Seu e-mail não possui permissão de Administrador!");
        }

        showToast("Autenticado com sucesso! Entrando no painel...", "success");
        router.push("/admin");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro desconhecido ao logar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-background flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden select-none">
      {/* Glow de Fundo Vermelho Lounge VIP */}
      <div className="absolute top-[-30%] left-[-15%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px] pointer-events-none animate-live-pulse" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo */}
        <Logo size="md" className="mb-4" />
        <span className="text-[10px] text-accent tracking-[0.25em] font-display font-black uppercase mb-8 flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(185,28,28,0.2)]">
          <ShieldCheck className="w-4 h-4 text-accent fill-accent/10" />
          Painel de Controle Restrito
        </span>

        {/* Card do Formulário */}
        <Card variant="red" hoverable={false} className="w-full px-6 py-8 border-accent/20 bg-zinc-950/90 shadow-2xl">
          <div className="flex flex-col gap-1 mb-6 text-center">
            <h2 className="text-lg font-display uppercase tracking-widest font-bold text-foreground">
              Login do Administrador
            </h2>
            <p className="text-xs text-muted">
              Valide suas credenciais do Troia para gerenciar o bolão
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                label="E-mail Administrativo"
                type="email"
                placeholder="seuemail@troia.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="w-4 h-4 text-zinc-600 absolute right-3.5 top-9.5" />
            </div>

            <div className="relative">
              <Input
                label="Senha de Acesso"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                disabled={loading}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 absolute right-3 top-8.5 hover:bg-white/5 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            <div className="flex gap-2 items-center text-[10px] text-zinc-500 mt-1 select-none">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              Conexão criptografada e protegida por RLS.
            </div>

            <Button variant="accent" type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Autenticando..." : "Entrar no Painel"}
            </Button>
          </form>
        </Card>

        {/* Retornar ao site */}
        <button
          onClick={() => router.push("/")}
          className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-primary transition-colors mt-6 font-display"
        >
          ← Voltar para o Bolão Público
        </button>
      </div>
    </div>
  );
}
