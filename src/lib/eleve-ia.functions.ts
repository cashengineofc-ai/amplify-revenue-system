import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM = `Você é a ELEVE IA, copiloto de marketing de afiliados da plataforma ELEVE_ENGINE.
Escreva sempre em português do Brasil, direto ao ponto e com foco em performance.
Especialidades: copy para anúncios (Meta, TikTok, Kwai), roteiros de VSL, ideias de criativo,
segmentação, diagnóstico de métricas (ROAS, CPA, CTR) e estratégias de escala.
Formate com títulos curtos e listas quando ajudar. Nunca invente números do usuário.`;

export const askEleveIa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: ChatMessage[] }) => {
    if (!Array.isArray(input?.messages) || input.messages.length === 0) {
      throw new Error("Mensagem inválida");
    }
    return { messages: input.messages.slice(-12) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponível no momento.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      }),
    });

    if (response.status === 429) return { text: "Limite de uso atingido. Tente novamente em instantes." };
    if (response.status === 402) return { text: "Créditos de IA esgotados no workspace." };
    if (!response.ok) {
      console.error("[eleve-ia] gateway error", response.status, await response.text());
      return { text: "Não consegui responder agora. Tente novamente." };
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { text: json.choices?.[0]?.message?.content ?? "Sem resposta." };
  });
