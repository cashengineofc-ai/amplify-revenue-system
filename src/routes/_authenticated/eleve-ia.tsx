import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/ui-kit";
import { askEleveIa } from "@/lib/eleve-ia.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/eleve-ia")({
  head: () => ({
    meta: [
      { title: "Eleve IA | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Copiloto de IA para copys, criativos, segmentação e diagnóstico de campanhas.",
      },
      { property: "og:title", content: "Eleve IA | ELEVE_ENGINE" },
      { property: "og:description", content: "Gere copys e estratégias de tráfego em segundos." },
    ],
  }),
  component: EleveIa,
});

type Message = { role: "user" | "assistant"; content: string };

/** Renderiza um subconjunto de markdown (títulos, negrito, listas, divisórias). */
function RichText({ text }: { text: string }) {
  const bold = (line: string) =>
    line.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-foreground">
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  return (
    <div className="space-y-2">
      {text.split("\n").map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (/^---+$/.test(line.trim()))
          return <hr key={i} className="border-border/70" />;
        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading)
          return (
            <p key={i} className="font-display text-sm font-bold text-foreground">
              {bold(heading[2] ?? "")}
            </p>
          );
        const bullet = /^\s*([-*•]|\d+\.)\s+(.*)$/.exec(line);
        if (bullet)
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-primary">•</span>
              <span>{bold(bullet[2] ?? "")}</span>
            </p>
          );
        return <p key={i}>{bold(line)}</p>;
      })}
    </div>
  );
}

const SUGGESTIONS = [
  "Crie 5 copys de anúncio para Meta Ads de um curso de renda extra",
  "Meu ROAS caiu de 3.2 para 1.4. O que devo checar primeiro?",
  "Roteiro de VSL de 60s para TikTok com gancho forte",
  "Estrutura de campanha para escalar do zero a R$ 500/dia",
];

function EleveIa() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askEleveIa);

  const mutation = useMutation({
    mutationFn: async (history: Message[]) => ask({ data: { messages: history } }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    },
    onError: () =>
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Não consegui responder agora. Tente novamente." },
      ]),
  });

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || mutation.isPending) return;
    const history: Message[] = [...messages, { role: "user", content: clean }];
    setMessages(history);
    setInput("");
    mutation.mutate(history);
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Inteligência"
        title="Eleve IA"
        description="Copys, criativos, segmentação e diagnóstico de métricas em segundos."
      />

      <div className="panel flex h-[calc(100vh-16rem)] min-h-[480px] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="grid place-items-center py-8 text-center">
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <p className="mt-3 font-display text-lg font-bold">Como posso acelerar seu faturamento?</p>
              <p className="mt-1 text-sm text-muted-foreground">Escolha um atalho ou escreva sua pergunta.</p>
              <div className="mt-5 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-lg border border-border bg-surface-2 p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  m.role === "user"
                    ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground",
                )}
              >
                {m.role === "user" ? m.content : <RichText text={m.content} />}
              </div>
            </div>
          ))}

          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl bg-surface-2 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Peça uma copy, um roteiro ou um diagnóstico…"
            aria-label="Mensagem para a Eleve IA"
            className="h-11 flex-1 rounded-lg border border-border bg-surface-2 px-4 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={mutation.isPending || !input.trim()}
            className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </>
  );
}
