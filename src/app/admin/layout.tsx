"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/ui-custom";
import Link from "next/link";
import Logo from "@/components/logo";
import { LayoutDashboard, Calendar, Users, Award, LogOut, Zap } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          router.push("/admin/login");
          return;
        }

        const { data: adminExists, error: dbError } = await supabase
          .from("admins")
          .select("id")
          .eq("email", session.user.email)
          .single();

        if (dbError || !adminExists) {
          await supabase.auth.signOut();
          router.push("/admin/login");
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error("Erro na verificação de administrador:", err);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loading size="lg" className="mb-4" />
        <span className="text-xs uppercase tracking-widest text-muted font-display">Verificando Credenciais...</span>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Lançar Jogos", path: "/admin/jogos", icon: Calendar },
    { name: "Participantes", path: "/admin/participantes", icon: Users },
    { name: "Ganhadores", path: "/admin/ganhadores", icon: Award },
    { name: "Simulador", path: "/admin/simulacao", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground select-none">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between p-6 shrink-0">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2">
            <Logo size="sm" />
            <span className="text-[10px] text-accent tracking-[0.2em] font-display font-black uppercase bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">
              ADMIN PANEL
            </span>
          </div>

          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold font-display uppercase tracking-wider transition-all duration-300 ${
                    active
                      ? "bg-accent/10 text-accent border border-accent/20 shadow-[0_0_10px_rgba(185,28,28,0.15)]"
                      : "text-muted hover:text-foreground hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4 mt-8 pt-4 border-t border-zinc-800/80">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold font-display uppercase tracking-wider text-muted hover:text-accent transition-colors w-full"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="bg-zinc-950/40 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <h1 className="text-sm font-display uppercase tracking-widest font-bold text-foreground">
            {menuItems.find((item) => item.path === pathname)?.name || "Administração"}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Modo Seguro Ativo
          </div>
        </header>

        {/* Content wrap */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
