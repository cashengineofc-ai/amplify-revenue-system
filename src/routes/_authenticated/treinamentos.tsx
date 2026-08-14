import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Play } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { fetchTrainingProgress, fetchTrainings } from "@/lib/queries";
import { num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/treinamentos")({
  head: () => ({
    meta: [
      { title: "Treinamentos | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Trilhas de tráfego, copy e escala para acelerar seu faturamento como afiliado.",
      },
      { property: "og:title", content: "Treinamentos | ELEVE_ENGINE" },
      { property: "og:description", content: "Trilhas práticas de tráfego, copy e escala." },
    ],
  }),
  component: Treinamentos,
});

function Treinamentos() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [openTrack, setOpenTrack] = useState<string | null>(null);

  const { data: trainings = [] } = useQuery({ queryKey: ["trainings"], queryFn: fetchTrainings });
  const { data: done = [] } = useQuery({
    queryKey: ["training-progress", user?.id],
    enabled: !!user,
    queryFn: () => fetchTrainingProgress(user!.id),
  });

  const toggle = useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      if (completed) {
        const { error } = await supabase
          .from("training_progress")
          .delete()
          .eq("user_id", user!.id)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("training_progress")
          .insert({ user_id: user!.id, lesson_id: lessonId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-progress", user?.id] }),
  });

  const lessons = useMemo(
    () => trainings.flatMap((t) => t.training_lessons ?? []),
    [trainings],
  );
  const totalMin = lessons.reduce((a, l) => a + Number(l.duration_min ?? 0), 0);
  const progress = lessons.length ? (done.length / lessons.length) * 100 : 0;

  if (trainings.length === 0)
    return (
      <>
        <PageHeader eyebrow="Educação" title="Treinamentos" />
        <EmptyState title="Nenhuma trilha publicada" description="As trilhas aparecem aqui em breve." />
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow="Educação"
        title="Treinamentos"
        description="Trilhas práticas de tráfego, copy e escala — do zero à operação lucrativa."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard highlight label="Progresso" value={pct(progress, 0)} hint={`${done.length} de ${lessons.length} aulas`} />
        <StatCard label="Trilhas" value={num(trainings.length)} hint="Conteúdo liberado" />
        <StatCard label="Carga horária" value={`${num(Math.round(totalMin / 60))}h`} hint={`${num(totalMin)} minutos`} />
      </div>

      <div className="mt-6 space-y-5">
        {trainings.map((t) => {
          const tl = [...(t.training_lessons ?? [])].sort(
            (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
          );
          const completed = tl.filter((l) => done.includes(l.id)).length;
          const open = openTrack === t.id;
          return (
            <SectionCard
              key={t.id}
              title={t.title}
              action={
                <button
                  onClick={() => setOpenTrack(open ? null : t.id)}
                  className="text-xs font-semibold text-primary"
                >
                  {open ? "FECHAR" : "VER AULAS"}
                </button>
              }
            >
              <div className="p-5">
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${tl.length ? (completed / tl.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="label-mono">
                    {completed}/{tl.length}
                  </span>
                </div>
              </div>
              {open && (
                <ul className="border-t border-border">
                  {tl.map((l) => {
                    const isDone = done.includes(l.id);
                    return (
                      <li
                        key={l.id}
                        className="flex items-center gap-3 border-b border-border/60 px-5 py-3 last:border-0"
                      >
                        <button
                          onClick={() => toggle.mutate({ lessonId: l.id, completed: isDone })}
                          aria-label={isDone ? "Marcar como não assistida" : "Marcar como assistida"}
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                            isDone ? "bg-success/15 text-success" : "bg-surface-2 text-muted-foreground",
                          )}
                        >
                          {isDone ? <Check className="size-4" /> : <Play className="size-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-sm font-medium", isDone && "text-muted-foreground line-through")}>
                            {l.title}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {num(Number(l.duration_min ?? 0))} min
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
