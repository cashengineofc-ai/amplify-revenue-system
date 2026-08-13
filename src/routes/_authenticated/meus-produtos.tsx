import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { EmptyState, PageHeader, StatCard } from "@/components/ui-kit";
import { brl, num, pct } from "@/lib/format";
import { fetchAffiliations, fetchSales } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/meus-produtos")({
  head: () => ({
    meta: [
      { title: "Meus produtos | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Desempenho de cada produto afiliado: vendas, comissões e conversão.",
      },
      { property: "og:title", content: "Meus produtos | ELEVE_ENGINE" },
      {
        property: "og:description",
        content: "Compare o resultado dos produtos que você promove.",
      },
    ],
  }),
  component: MeusProdutos,
});

function MeusProdutos() {
  const { user } = useSession();

  const { data: affiliations = [] } = useQuery({
    queryKey: ["affiliations", user?.id],
    enabled: !!user,
    queryFn: () => fetchAffiliations(user!.id),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales", user?.id],
    enabled: !!user,
    queryFn: () => fetchSales(user!.id),
  });

  if (affiliations.length === 0)
    return (
      <>
        <PageHeader eyebrow="Portfólio" title="Meus produtos" />
        <EmptyState
          title="Você ainda não é afiliado"
          description="Escolha um produto no marketplace e gere seus links por plataforma em segundos."
        />
      </>
    );

  const approved = sales.filter((s) => s.status === "aprovada");
  const totalCommission = approved.reduce((acc, s) => acc + Number(s.commission), 0);

  return (
    <>
      <PageHeader
        eyebrow="Portfólio"
        title="Meus produtos"
        description="Resultado consolidado de cada produto que você promove."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Produtos afiliados" value={num(affiliations.length)} hint="Portfólio ativo" />
        <StatCard label="Vendas aprovadas" value={num(approved.length)} hint="Todos os produtos" />
        <StatCard label="Comissões" value={brl(totalCommission)} highlight hint="Acumulado" />
        <StatCard
          label="Ticket médio"
          value={brl(approved.length ? approved.reduce((a, s) => a + Number(s.amount), 0) / approved.length : 0)}
          hint="Por venda aprovada"
        />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {affiliations.map((aff) => {
          const product = aff.products;
          if (!product) return null;
          const own = approved.filter((s) => s.product_id === product.id);
          const commission = own.reduce((acc, s) => acc + Number(s.commission), 0);
          const revenue = own.reduce((acc, s) => acc + Number(s.amount), 0);
          const metrics = Array.isArray(product.product_metrics)
            ? product.product_metrics[0]
            : product.product_metrics;

          return (
            <article key={aff.id} className="panel overflow-hidden">
              <div className="relative h-36 overflow-hidden">
                {product.cover_url && (
                  <img
                    src={product.cover_url}
                    alt={`Capa do produto ${product.name}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
                <span className="absolute left-3 top-3 rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur">
                  {product.category}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-bold">{product.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">{product.tagline}</p>
                  </div>
                  <Link
                    to="/marketplace/$slug"
                    params={{ slug: product.slug }}
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
                  >
                    abrir <ArrowUpRight className="size-3" />
                  </Link>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-surface-2 px-3 py-2">
                    <dt className="label-mono">Comissões</dt>
                    <dd className="font-display font-bold text-primary">{brl(commission)}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-2 px-3 py-2">
                    <dt className="label-mono">Faturado</dt>
                    <dd className="font-display font-bold">{brl(revenue)}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-2 px-3 py-2">
                    <dt className="label-mono">Vendas</dt>
                    <dd className="font-display font-bold">{num(own.length)}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-2 px-3 py-2">
                    <dt className="label-mono">Conversão</dt>
                    <dd className="font-display font-bold">
                      {pct(Number(metrics?.conversion_rate ?? 0), 2)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs text-muted-foreground">
                  Comissão de {num(Number(product.commission_pct))}% · ticket{" "}
                  {brl(Number(product.ticket))}
                  {product.is_subscription ? " · recorrente" : ""}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
