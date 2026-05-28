import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    // Apenas envia se a URL do webhook estiver configurada e não for o placeholder
    if (webhookUrl && !webhookUrl.includes("suainstancia.n8n.design")) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error("Erro ao enviar dados para o n8n:", response.status, await response.text());
        return NextResponse.json(
          { success: false, error: "N8N integration returned non-2xx status" },
          { status: response.status }
        );
      }
    } else {
      console.log("Webhook N8N desativado ou URL placeholder detectada. Ignorando envio.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao processar webhook de cadastro:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
