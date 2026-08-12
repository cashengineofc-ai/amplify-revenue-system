import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Search, Star, Users } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { PageHeader } from "@/components/ui-kit";
import { brl, num, pct } from "@/lib/format";
import { fetchAffiliations, fetchProducts } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/marketplace/")({
  head: () => ({
    meta: [
      { title: "Marketplace | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Produtos disponíveis para afiliação com comissão, EPC, conversão e temperatura.",
      },
      { property: "og:title", content: "Marketplace | ELEVE_ENGINE" },
      { property: "og:description", content: "Escolha os melhores produtos para promover." },
    ],
  }),
  component: Marketplace,
});

const SORTS = {
  temperatura: "Temperatura",
  comissao: "Maior comissão",
  epc: "Maior EPC",
  vendas: "Mais vendidos",
  ticket: "Maior ticket",
} as const;

function Temperature({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-warning to-primary"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-warning">
        <Flame className="size-3" /> {num(value)}
      </span>
    </div>
  );
}

function Marketplace() {
  const { user } = useSession();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [sort, setSort] = useState<keyof typeof SORTS>("temperatura");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const { data: affiliations = [] } = useQuery({
    queryKey: ["affiliations", user?.id],
    enabled: !!user,
    queryFn: () => fetchAffiliations(user!.id),
  });
  const affiliated = new Set(affiliations.map((a) => a.product_id));

  const categories = useMemo(
    () => ["todas", ...new Set(products.map((p) => p.category))],
    [products],
  );

  const list = useMemo(() => {
    const metric = (p: (typeof products)[number]) => p.product_metrics?.[0];
    return products
      .filter((p) => (cat === "todas" ? true : p.category === cat))
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase().trim()))
      .sort((a, b) => {
        const ma = metric(a);
        const mb = metric(b);
        switch (sort) {
          case "comissao":
            return Number(b.commission_pct) - Number(a.commission_pct);
          case "epc":
            return Number(mb?.epc ?? 0) - Number(ma?.epc ?? 0);
          case "vendas":
            return Number(mb?.sales_30d ?? 0) - Number(ma?.sales_30d ?? 0);
          case "ticket":
            return Number(b.ticket) - Number(a.ticket);
          default:
            return Number(mb?.temperature ?? 0) - Number(ma?.temperature ?? 0);
        }
      });
  }, [products, cat, q, sort]);

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Produtos para afiliação"
        description="Selecione ofertas validadas e gere seus links por plataforma em um clique."
      />

      <div className="panel mb-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produto..."
            className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                cat === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
          className="h-10 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const m = p.product_metrics?.[0];
            return (
              <Link
                key={p.id}
                to="/marketplace/$slug"
                params={{ slug: p.slug }}
                className="panel group overflow-hidden transition-transform hover:-translate-y-1"
              >
                <div className="relative">
                  <img
                    src={p.cover_url ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="rounded-md bg-background/80 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                      {p.category}
                    </span>
                    {affiliated.has(p.id) && (
                      <span className="rounded-md bg-success/90 px-2 py-1 text-[11px] font-semibold text-background">
                        Afiliado
                      </span>
                    )}
                  </div>
                  {p.is_subscription && (
                    <span className="absolute top-3 right-3 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                      Assinatura
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-base leading-snug font-bold">{p.name}</h2>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-warning">
                      <Star className="size-3 fill-current" />
                      {num(Number(m?.rating ?? 0), 1)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="label-mono">Ticket</p>
                      <p className="font-display text-lg font-bold">{brl(Number(p.ticket))}</p>
                    </div>
                    <div className="text-right">
                      <p className="label-mono">Comissão</p>
                      <p className="font-display text-lg font-bold text-primary">
                        {num(Number(p.commission_pct))}%
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          {brl((Number(p.ticket) * Number(p.commission_pct)) / 100)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                    <div>
                      <p className="label-mono">EPC</p>
                      <p className="text-sm font-semibold">{brl(Number(m?.epc ?? 0))}</p>
                    </div>
                    <div>
                      <p className="label-mono">Conversão</p>
                      <p className="text-sm font-semibold">{pct(Number(m?.conversion ?? 0), 1)}</p>
                    </div>
                    <div>
                      <p className="label-mono">Reembolso</p>
                      <p className="text-sm font-semibold">{pct(Number(m?.refund_rate ?? 0), 1)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Temperature value={Number(m?.temperature ?? 0)} />
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="size-3" /> {num(Number(m?.affiliates ?? 0))} afiliados ·{" "}
                      {num(Number(m?.sales_30d ?? 0))} vendas/30d
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
