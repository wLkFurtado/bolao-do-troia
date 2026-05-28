"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useToast, Button, Card, Input } from "@/components/ui-custom";
import Logo from "@/components/logo";
import { Trophy, ShieldAlert, Award, Star, Compass } from "lucide-react";

// Validação com Zod
const cadastroSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Endereço de e-mail inválido"),
  telefone: z
    .string()
    .min(14, "Telefone inválido. Formato: (00) 00000-0000")
    .max(15, "Telefone inválido. Formato: (00) 00000-0000"),
  dataNascimento: z.string().refine((val) => {
    if (!val) return false;
    const nascimento = new Date(val);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade >= 18;
  }, "Você precisa ter pelo menos 18 anos para participar"),
});

type CadastroFormData = z.infer<typeof cadastroSchema>;

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // 1. Verificar se participante já está logado
  useEffect(() => {
    const id = localStorage.getItem("participante_id");
    if (id) {
      router.push("/bolao");
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      dataNascimento: "",
    },
  });

  // Máscara de telefone em tempo real
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    
    // Aplicar máscara (XX) XXXXX-XXXX
    if (value.length > 6) {
      value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
    } else if (value.length > 2) {
      value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    
    setValue("telefone", value, { shouldValidate: true });
  };

  const onSubmit = async (formData: CadastroFormData) => {
    setLoading(true);
    try {
      const ref = searchParams.get("ref");
      let startingPoints = 0;
      let refParticipantId = "";

      // Verificar se há uma indicação válida
      if (ref && ref.length === 36) {
        try {
          const { data: referrer, error: refError } = await supabase
            .from("participantes")
            .select("id, nome, pontos_total")
            .eq("id", ref)
            .single();

          if (!refError && referrer) {
            startingPoints = 5; // Novo usuário ganha 5 pontos
            refParticipantId = referrer.id;
          }
        } catch (e) {
          console.warn("Código de indicação inválido.");
        }
      }

      // Salvar novo participante no banco
      const { data: newPart, error } = await supabase
        .from("participantes")
        .insert([
          {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            data_nascimento: formData.dataNascimento,
            pontos_total: startingPoints,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este endereço de e-mail já está cadastrado no bolão!");
        }
        throw error;
      }

      if (newPart) {
        // Se houver indicação, atualizar os pontos de quem indicou (+5)
        if (refParticipantId) {
          const { data: referrerData } = await supabase
            .from("participantes")
            .select("pontos_total")
            .eq("id", refParticipantId)
            .single();
            
          const currentReferrerPoints = referrerData?.pontos_total || 0;

          await supabase
            .from("participantes")
            .update({ pontos_total: currentReferrerPoints + 5 })
            .eq("id", refParticipantId);

          // Disparar notificação n8n se configurada (via API interna)
          try {
            await fetch("/api/webhook-cadastro", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tipo: "indicacao",
                indicou_nome: "Amigo",
                cadastrado_nome: newPart.nome,
                cadastrado_email: newPart.email,
              }),
            });
          } catch (e) {
            console.warn("Erro ao registrar webhook n8n:", e);
          }
        }

        // Disparar webhook de cadastro padrão
        try {
          await fetch("/api/webhook-cadastro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: newPart.nome,
              telefone: newPart.telefone,
              email: newPart.email,
            }),
          });
        } catch (e) {
          console.warn("Erro ao enviar webhook:", e);
        }

        // Guardar ID no LocalStorage
        localStorage.setItem("participante_id", newPart.id);
        
        showToast("Cadastro realizado com sucesso! Bem-vindo ao bolão.", "success");
        
        if (startingPoints > 0) {
          showToast("Você ganhou +5 pontos de bônus por indicação de amigo! 🎁", "info");
        }

        // Redirecionar
        router.push("/bolao");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao efetuar cadastro. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 md:py-16 relative overflow-hidden">
      {/* Background decorativo de luz do bar */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 flex flex-col items-center">
        {/* Logo superior */}
        <Logo size="lg" className="mb-6 animate-pulse" />

        {/* Textos de chamada */}
        <h1 className="text-center font-display text-3xl md:text-4xl font-extrabold tracking-wide text-foreground uppercase mb-2">
          Bolão do Troia
        </h1>
        <p className="text-center font-display text-sm md:text-base font-semibold tracking-wider text-primary uppercase mb-8 max-w-sm">
          🏆 Copa do Mundo FIFA 2026 ⚽
        </p>

        {/* Card do Formulário */}
        <Card variant="gold" hoverable={false} className="w-full px-6 py-8 border-primary/20 bg-zinc-950/80">
          <div className="flex flex-col gap-1 mb-6 text-center">
            <h2 className="text-lg font-display uppercase tracking-widest font-bold text-foreground">
              Cadastre-se & Palpite
            </h2>
            <p className="text-xs text-muted">
              Preencha os dados abaixo e ganhe prêmios enquanto assiste aos jogos no bar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nome Completo"
              placeholder="Ex: João da Silva"
              error={errors.nome?.message}
              disabled={loading}
              {...register("nome")}
            />

            <Input
              label="WhatsApp / Telefone"
              placeholder="(22) 99999-9999"
              error={errors.telefone?.message}
              disabled={loading}
              {...register("telefone")}
              onChange={handleTelefoneChange}
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="seuemail@exemplo.com"
              error={errors.email?.message}
              disabled={loading}
              {...register("email")}
            />

            <Input
              label="Data de Nascimento"
              type="date"
              error={errors.dataNascimento?.message}
              disabled={loading}
              {...register("dataNascimento")}
            />

            <div className="flex gap-2.5 items-start mt-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
              <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted leading-relaxed font-sans">
                Para participar do bolão e receber prêmios alcoólicos no Troia Lounge Bar, é obrigatório possuir idade superior a 18 anos.
              </p>
            </div>

            <Button variant="primary" type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Cadastrando..." : "Entrar no Bolão"}
            </Button>
          </form>
        </Card>

        {/* Rodapé informativo */}
        <div className="flex justify-center items-center gap-6 mt-8 text-[11px] text-muted tracking-wider uppercase font-semibold font-display">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-primary" />
            Caipirinhas & Chopp
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Cabo Frio - RJ
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex justify-center items-center">
        <Logo size="md" className="animate-pulse mb-4" />
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}
