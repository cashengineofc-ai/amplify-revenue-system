import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin } from "lucide-react";

import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { fetchEvents } from "@/lib/queries";
import { dateBR, num } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | ELEVE_ENGINE" },
      { name: "description", content: "Lançamentos, mentorias e eventos da plataforma." },
      { property: "og:title", content: "Agenda | ELEVE_ENGINE" },
      { property: "og:description", content: "Lançamentos, mentorias e eventos da plataforma." },
    ],
  }),
  component: Agenda,
});

const KIND_LABEL: Record<string, string> = {
  mentoria: "Mentoria",
  lancamento: "Lançamento",
  workshop: "Workshop",
  plantao: "Plantão",
  imersao: "Imersão",
};

function Agenda() {
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now).reverse();
  const next = upcoming[0];

  return (
    <>
      <PageHeader
        eyebrow="Agenda"
        title="Agenda"
        description="Lançamentos, mentorias e eventos da plataforma."
      />

      {events.length === 0 ? (
        <EmptyState title="Nenhum evento agendado" description="Os próximos eventos aparecem aqui." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              highlight
              label="Próximo evento"
              value={next ? next.title : "—"}
              hint={next ? dateBR(next.starts_at) : "Sem eventos futuros"}
            />
            <StatCard label="Eventos futuros" value={num(upcoming.length)} hint="Confirmados no calendário" />
            <StatCard label="Realizados" value={num(past.length)} hint="Histórico da comunidade" />
          </div>

          <SectionCard className="mt-6" title="Próximos eventos">
            {upcoming.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nenhum evento futuro agendado.
              </p>
            ) : (
              <ul>
                {upcoming.map((e) => {
                  const d = new Date(e.starts_at);
                  return (
                    <li
                      key={e.id}
                      className="flex flex-wrap items-center gap-4 border-b border-border/60 px-5 py-4 last:border-0"
                    >
                      <div className="grid w-14 shrink-0 place-items-center rounded-lg bg-surface-2 py-2">
                        <span className="font-display text-lg font-bold leading-none">
                          {d.toLocaleDateString("pt-BR", { day: "2-digit" })}
                        </span>
                        <span className="label-mono mt-1">
                          {d.toLocaleDateString("pt-BR", { month: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{e.title}</p>
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                            {KIND_LABEL[e.kind] ?? e.kind}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            {dateBR(e.starts_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            Online
                          </span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {past.length > 0 && (
            <SectionCard className="mt-6" title="Realizados">
              <ul>
                {past.map((e) => (
                  <li
                    key={e.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3 last:border-0",
                      "text-sm text-muted-foreground",
                    )}
                  >
                    <span>{e.title}</span>
                    <span className="text-xs">{dateBR(e.starts_at)}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </>
  );
}
