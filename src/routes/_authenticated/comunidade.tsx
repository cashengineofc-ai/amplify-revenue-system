import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile, useSession } from "@/hooks/use-session";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { dateBR } from "@/lib/format";
import { fetchFeedbacks } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Depoimentos da comunidade de afiliados e envio de feedback.",
      },
      { property: "og:title", content: "Comunidade | ELEVE_ENGINE" },
      {
        property: "og:description",
        content: "Compartilhe resultados e aprenda com outros operadores.",
      },
    ],
  }),
  component: Comunidade,
});

function Comunidade() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const { data: isAdmin } = useIsAdmin(user);
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["feedbacks"],
    enabled: !!user,
    queryFn: fetchFeedbacks,
  });

  const send = useMutation({
    mutationFn: async () => {
      if (content.trim().length < 10) throw new Error("Escreva um pouco mais sobre sua experiência.");
      const { error } = await supabase.from("feedbacks").insert({
        user_id: user!.id,
        author_name: profile?.full_name ?? profile?.email ?? "Afiliado",
        content: content.trim(),
        rating,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      toast.success("Feedback enviado", { description: "Ele passa por curadoria antes de publicar." });
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao enviar."),
  });

  const approve = async (id: string, approved: boolean) => {
    await supabase.from("feedbacks").update({ approved }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
  };

  const published = feedbacks.filter((f) => f.approved);
  const mine = feedbacks.filter((f) => !f.approved);

  return (
    <>
      <PageHeader
        eyebrow="Comunidade"
        title="Comunidade ELEVE"
        description="Resultados, aprendizados e feedback direto de quem opera todos os dias."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <SectionCard title={`Depoimentos publicados (${published.length})`}>
          {published.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Ainda não há depoimentos publicados. Envie o seu ao lado.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {published.map((f) => (
                <li key={f.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{f.author_name ?? "Afiliado"}</p>
                    <Stars value={f.rating} />
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{dateBR(f.created_at)}</p>
                  {isAdmin && (
                    <button
                      onClick={() => approve(f.id, false)}
                      className="mt-2 text-xs font-semibold text-destructive"
                    >
                      remover da vitrine
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Enviar feedback">
            <form
              className="space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                send.mutate();
              }}
            >
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} estrelas`}
                    onClick={() => setRating(n)}
                  >
                    <Star
                      className={cn(
                        "size-5 transition-colors",
                        n <= rating ? "fill-primary text-primary" : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Conte como a plataforma mudou a sua operação..."
              />
              <Button type="submit" className="w-full" disabled={send.isPending}>
                Enviar feedback
              </Button>
              <p className="text-xs text-muted-foreground">
                Seu feedback fica visível apenas para a curadoria até ser aprovado.
              </p>
            </form>
          </SectionCard>

          <SectionCard title={isAdmin ? `Aguardando curadoria (${mine.length})` : "Seus envios"}>
            {mine.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-muted-foreground">
                Nada pendente por aqui.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {mine.map((f) => (
                  <li key={f.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{f.author_name ?? "Afiliado"}</p>
                      <Stars value={f.rating} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{f.content}</p>
                    {isAdmin && (
                      <button
                        onClick={() => approve(f.id, true)}
                        className="mt-2 text-xs font-semibold text-primary"
                      >
                        aprovar e publicar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-3.5", n <= value ? "fill-primary text-primary" : "text-border")}
        />
      ))}
    </span>
  );
}
