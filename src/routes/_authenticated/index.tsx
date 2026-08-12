import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/use-session";
import { AnimatedNumber } from "@/components/animated-number";
import { PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { brl, dateBR, num, pct } from "@/lib/format";
import { buildSeries, fetchProducts, fetchSales, rangeStart, type Range } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard | ELEVE_ENGINE" },
      {
        name: "description",
        content:
          "Visão geral do seu faturamento: comissões, conversão, leads e evolução de vendas em tempo real.",
      },
      { property: "og:title", content: "Dashboard | ELEVE_ENGINE" },
      { property: "og:description", content: "Métricas consolidadas do seu ecossistema de vendas." },
    ],
  }),
  component: Dashboard,
});

const RANGES: { key: Range; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "12m", label: "12m" },
];

function Dashboard() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const [range, setRange] = useState<Range>("30d");

  const { data: sales = [] } = useQuery({
    queryKey: ["sales", user?.id],
    enabled: !!user,
    queryFn: () => fetchSales(user!.id),
  });

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const { data: leadsCount = 0 } = useQuery({
    queryKey: ["leads-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: campaignAgg } = useQuery({
    queryKey: ["campaign-agg", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_metrics_daily")
        .select("spend, clicks, impressions, sales")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.reduce(
        (acc, r) => ({
          spend: acc.spend + Number(r.spend),
          clicks: acc.clicks + r.clicks,
          impressions: acc.impressions + r.impressions,
          sales: acc.sales + r.sales,
        }),
        { spend: 0, clicks: 0, impressions: 0, sales: 0 },
      );
    },
  });

  const stats = useMemo(() => {
    const start = rangeStart(range);
    const inRange = sales.filter((s) => new Date(s.created_at) >= start);
    const commissions = inRange.reduce((a, s) => a + Number(s.commission), 0);
    const revenue = inRange.reduce((a, s) => a + Number(s.amount), 0);
    const clicks = campaignAgg?.clicks ?? 0;
    const conversion = clicks > 0 ? (inRange.length / clicks) * 100 : 0;
    return { commissions, revenue, conversion, count: inRange.length };
  }, [sales, range, campaignAgg]);

  const series = useMemo(() => buildSeries(sales, range), [sales, range]);
  const featured = products.find((p) => p.featured) ?? products[0];
  const recent = sales.slice(0, 6);
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "afiliado";

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Bom te ver, ${firstName}`}
        description="Métricas consolidadas do seu ecossistema de vendas, atualizadas ao vivo."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          label="Saldo disponível"
          value={
            <AnimatedNumber
              value={Number(profile?.balance ?? 0)}
              format={brl}
              className="animate-glow-pulse"
            />
          }
          hint={
            Number(profile?.balance ?? 0) > 0
              ? "Disponível para saque via PIX"
              : "Nenhuma comissão liberada ainda"
          }
        />
        <StatCard
          label={`Comissões (${range})`}
          value={<AnimatedNumber value={stats.commissions} format={brl} />}
          hint={`${num(stats.count)} vendas no período`}
        />
        <StatCard
          label="Taxa de conversão"
          value={<AnimatedNumber value={stats.conversion} format={(n) => pct(n, 2)} />}
          hint={
            campaignAgg?.clicks
              ? `${num(campaignAgg.clicks)} cliques rastreados`
              : "Sem tráfego registrado"
          }
        />
        <StatCard
          label="Leads no CRM"
          value={<AnimatedNumber value={leadsCount} format={(n) => num(n)} />}
          hint={leadsCount ? "Capturados pelas suas campanhas" : "Adicione seu primeiro lead"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Evolução de faturamento"
          action={
            <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                    range === r.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-comissao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  minTickGap={16}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(v) => brl(Number(v)).replace(/\s/g, " ")}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number, key) => [brl(v), key === "comissao" ? "Comissão" : "Faturamento"]}
                />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="var(--color-chart-3)"
                  strokeWidth={1.5}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="comissao"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#fill-comissao)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Produto em destaque"
          action={
            featured && (
              <Link
                to="/marketplace/$slug"
                params={{ slug: featured.slug }}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                Ver produto <ArrowUpRight className="size-3" />
              </Link>
            )
          }
        >
          {featured && (
            <div>
              <img
                src={featured.cover_url ?? ""}
                alt={featured.name}
                loading="lazy"
                className="h-40 w-full object-cover"
              />
              <div className="p-5">
                <p className="label-mono">{featured.category}</p>
                <p className="mt-1 font-display text-lg font-bold">{featured.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{featured.tagline}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-2 p-3">
                    <p className="label-mono">Ticket</p>
                    <p className="font-semibold">{brl(Number(featured.ticket))}</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-3">
                    <p className="label-mono">Comissão</p>
                    <p className="font-semibold text-primary">
                      {num(Number(featured.commission_pct))}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        className="mt-6"
        title="Vendas recentes"
        action={
          <Link to="/minhas-vendas" className="text-xs font-semibold text-primary">
            VER TODAS →
          </Link>
        }
      >
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Suas vendas aparecem aqui assim que forem aprovadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="label-mono px-5 py-3 font-normal">Produto</th>
                  <th className="label-mono px-5 py-3 font-normal">Valor</th>
                  <th className="label-mono px-5 py-3 font-normal">Comissão</th>
                  <th className="label-mono px-5 py-3 font-normal">Data</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-medium">{s.products?.name ?? "Produto"}</td>
                    <td className="px-5 py-3">{brl(Number(s.amount))}</td>
                    <td className="px-5 py-3 font-semibold text-success">
                      {brl(Number(s.commission))}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{dateBR(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}
