import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { EmptyState, PageHeader, StatCard } from "@/components/ui-kit";
import { brl, dateBR, num, PLATFORMS, type PlatformKey } from "@/lib/format";
import { fetchLeads } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM & Leads | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Leads captados pelas campanhas, organizados por estágio e origem.",
      },
      { property: "og:title", content: "CRM & Leads | ELEVE_ENGINE" },
      {
        property: "og:description",
        content: "Pipeline completo de leads com valor potencial por estágio.",
      },
    ],
  }),
  component: Crm,
});

const STAGES = [
  { key: "novo", label: "Novo" },
  { key: "contato", label: "Em contato" },
  { key: "qualificado", label: "Qualificado" },
  { key: "negociacao", label: "Negociação" },
  { key: "ganho", label: "Ganho" },
  { key: "perdido", label: "Perdido" },
] as const;

type Stage = (typeof STAGES)[number]["key"];

function Crm() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", user?.id],
    enabled: !!user,
    queryFn: () => fetchLeads(user!.id),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((l) =>
      [l.name, l.email, l.phone, l.source].some((v) => v?.toLowerCase().includes(term)),
    );
  }, [leads, search]);

  const total = leads.reduce((acc, l) => acc + Number(l.value), 0);
  const won = leads.filter((l) => l.stage === "ganho");
  const conversion = leads.length ? (won.length / leads.length) * 100 : 0;

  const move = async (id: string, stage: Stage) => {
    await supabase.from("leads").update({ stage }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

  if (leads.length === 0)
    return (
      <>
        <PageHeader eyebrow="Relacionamento" title="CRM & Leads" />
        <EmptyState
          title="Nenhum lead capturado"
          description="Ao se afiliar e rodar campanhas, os leads chegam automaticamente neste pipeline."
        />
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow="Relacionamento"
        title="CRM & Leads"
        description="Cada contato gerado pelas suas campanhas, por estágio e origem."
        action={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lead..."
            className="h-10 w-56 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/60"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads totais" value={num(leads.length)} hint="Base acumulada" />
        <StatCard label="Valor potencial" value={brl(total)} hint="Soma do pipeline" />
        <StatCard
          label="Ganhos"
          value={num(won.length)}
          hint={`${num(conversion, 1)}% de conversão`}
          highlight
        />
        <StatCard
          label="Em negociação"
          value={num(leads.filter((l) => l.stage === "negociacao").length)}
          hint="Prioridade de follow-up"
        />
      </div>

      <div className="scroll-slim mt-6 flex gap-4 overflow-x-auto pb-3">
        {STAGES.map((stage) => {
          const items = filtered.filter((l) => l.stage === stage.key);
          const value = items.reduce((acc, l) => acc + Number(l.value), 0);
          return (
            <div key={stage.key} className="panel min-w-[280px] flex-1 p-4">
              <header className="mb-3 flex items-center justify-between">
                <p className="label-mono">{stage.label}</p>
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {items.length}
                </span>
              </header>
              <p className="mb-3 font-display text-sm font-bold">{brl(value)}</p>
              <div className="space-y-2">
                {items.slice(0, 12).map((lead) => {
                  const platform = lead.campaigns?.platform as PlatformKey | null | undefined;
                  return (
                    <article
                      key={lead.id}
                      className="rounded-lg border border-border bg-surface-2 p-3"
                    >
                      <p className="truncate text-sm font-semibold">{lead.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {lead.email ?? lead.phone ?? "sem contato"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="rounded bg-primary/12 px-1.5 py-0.5 font-semibold text-primary">
                          {brl(Number(lead.value))}
                        </span>
                        <span className="rounded bg-background px-1.5 py-0.5 text-muted-foreground">
                          {platform ? PLATFORMS[platform].short : lead.source}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-[11px] text-muted-foreground">
                        {lead.products?.name ?? "—"} · {dateBR(lead.created_at)}
                      </p>
                      <select
                        value={lead.stage}
                        onChange={(e) => move(lead.id, e.target.value as Stage)}
                        className={cn(
                          "mt-2 h-8 w-full rounded-md border border-border bg-background px-2 text-xs outline-none",
                          "focus:border-primary/60",
                        )}
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </article>
                  );
                })}
                {items.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">Vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
