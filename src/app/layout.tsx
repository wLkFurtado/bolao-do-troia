import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui-custom";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolão do Troia 🏆 Copa do Mundo 2026",
  description: "Faça seus palpites nos jogos da Copa do Mundo 2026 enquanto curte a melhor experiência no Troia Lounge Bar em Cabo Frio - RJ. Concorra a prêmios incríveis!",
  keywords: ["bolão", "copa do mundo 2026", "troia lounge bar", "cabo frio", "palpites", "futebol"],
  authors: [{ name: "Troia Lounge Bar" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} h-full dark antialiased`}>
      <body className="bg-background text-foreground font-sans min-h-full flex flex-col no-scrollbar">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
