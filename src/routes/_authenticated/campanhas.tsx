import { Fragment, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { brl, num, pct, PLATFORMS, type PlatformKey } from "@/lib/format";
import {
  fetchCampaigns,
  fetchDailyMetrics,
  rangeStart,
  type CampaignRow,
  type Range,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/campanhas")({
  head: () => ({
    meta: [
      { title: "Campanhas | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Campanhas e anúncios por produto e plataforma com métricas completas.",
      },
      { property: "og:title", content: "Campanhas | ELEVE_ENGINE" },
      { property: "og:description", content: "Gerencie Meta Ads, TikTok e Kwai em um só lugar." },
    ],
  }),
  component: Campanhas,
});

type Metrics = Record<string, number>;
type Breakdowns = Record<string, { label: string; share: number; roas: number; cpa: number }[]>;

const RANGES: { key: Range; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "12m", label: "12m" },
];

const emptyTotals = { investimento: 0, receita: 0, vendas: 0, cliques: 0, impressoes: 0, leads: 0 };

function sumAds(campaigns: CampaignRow[]) {
  return campaigns.reduce((acc, c) => {
    for (const a of c.campaign_ads ?? []) {
      const m = (a.metrics ?? {}) as Metrics;
      acc.investimento += Number(m["investimento"] ?? 0);
      acc.receita += Number(m["receita"] ?? 0);
      acc.vendas += Number(m["vendas"] ?? 0);
      acc.cliques += Number(m["cliques"] ?? 0);
      acc.impressoes += Number(m["impressoes"] ?? 0);
      acc.leads += Number(m["leads"] ?? 0);
    }
    return acc;
  }, { ...emptyTotals });
}

function Campanhas() {
  const { user } = useSession();
  const [range, setRange] = useState<Range>("30d");
  const [productId, setProductId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformKey | "all">("all");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", user?.id],
    enabled: !!user,
    queryFn: () => fetchCampaigns(user!.id),
  });

  const { data: daily = [] } = useQuery({
    queryKey: ["campaign-daily", user?.id, range],
    enabled: !!user,
    queryFn: () => fetchDailyMetrics(user!.id, range),
  });

  const products = useMemo(() => {
    const map = new Map<string, { id: string; name: string; is_subscription: boolean }>();
    for (const c of campaigns) {
      if (!map.has(c.product_id))
        map.set(c.product_id, {
          id: c.product_id,
          name: c.products?.name ?? "Produto",
          is_subscription: !!c.products?.is_subscription,
        });
    }
    return [...map.values()];
  }, [campaigns]);

  const activeProduct = products.find((p) => p.id === productId) ?? products[0];

  const scoped = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          c.product_id === activeProduct?.id && (platform === "all" || c.platform === platform),
      ),
    [campaigns, activeProduct, platform],
  );

  const platformsForProduct = useMemo(() => {
    const set = new Set<PlatformKey>();
    for (const c of campaigns) if (c.product_id === activeProduct?.id) set.add(c.platform);
    return [...set];
  }, [campaigns, activeProduct]);

  const totals = useMemo(() => sumAds(scoped), [scoped]);

  const series = useMemo(() => {
    const ids = new Set(scoped.map((c) => c.id));
    const monthly = range === "12m";
    const buckets = new Map<string, { label: string; investimento: number; receita: number; roas: number }>();
    const cursor = new Date(rangeStart(range));
    const now = new Date();
    while (cursor <= now) {
      const key = monthly
        ? `${cursor.getFullYear()}-${cursor.getMonth()}`
        : cursor.toISOString().slice(0, 10);
      const label = monthly
        ? cursor.toLocaleDateString("pt-BR", { month: "short" })
        : cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!buckets.has(key)) buckets.set(key, { label, investimento: 0, receita: 0, roas: 0 });
      if (monthly) cursor.setMonth(cursor.getMonth() + 1);
      else cursor.setDate(cursor.getDate() + 1);
    }
    for (const row of daily) {
      if (!ids.has(row.campaign_id)) continue;
      const d = new Date(`${row.day}T12:00:00`);
      const key = monthly ? `${d.getFullYear()}-${d.getMonth()}` : row.day;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.investimento += Number(row.spend);
      bucket.receita += Number(row.revenue);
    }
    for (const b of buckets.values()) b.roas = +(b.receita / Math.max(b.investimento, 1)).toFixed(2);
    return [...buckets.values()];
  }, [daily, scoped, range]);

  const subscription = useMemo(() => {
    if (!activeProduct?.is_subscription) return null;
    const ticket = totals.vendas > 0 ? totals.receita / totals.vendas : 0;
    const churn = 6.4;
    const meses = 100 / churn;
    return {
      ativas: Math.round(totals.vendas * 0.78),
      mrr: totals.receita * 0.78,
      ltv: ticket * meses,
      churn,
      renovacoes: Math.round(totals.vendas * 0.78 * 0.62),
    };
  }, [activeProduct, totals]);

  if (campaigns.length === 0)
    return (
      <>
        <PageHeader eyebrow="Tráfego" title="Campanhas" />
        <EmptyState
          title="Nenhuma campanha ativa"
          description="Afilie-se a um produto no marketplace para gerar campanhas automaticamente."
        />
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow="Tráfego"
        title="Campanhas"
        description="Escolha o produto, a plataforma e acompanhe cada criativo."
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
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setProductId(p.id);
              setPlatform("all");
            }}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
              activeProduct?.id === p.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface-2 text-muted-foreground hover:text-foreground",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
        {(["all", ...platformsForProduct] as (PlatformKey | "all")[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              platform === p
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p === "all" ? "Todas" : PLATFORMS[p].short}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Investimento" value={brl(totals.investimento)} hint={`${num(totals.impressoes)} impressões`} />
        <StatCard label="Receita" value={brl(totals.receita)} hint={`${num(totals.vendas)} vendas`} />
        <StatCard
          highlight
          label="ROAS"
          value={`${num(totals.receita / Math.max(totals.investimento, 1), 2)}x`}
          hint={`Lucro bruto ${brl(totals.receita - totals.investimento)}`}
        />
        <StatCard
          label="Conversão"
          value={pct((totals.vendas / Math.max(totals.cliques, 1)) * 100, 2)}
          hint={`${num(totals.cliques)} cliques • ${num(totals.leads)} leads`}
        />
      </div>

      {subscription && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="MRR" value={brl(subscription.mrr)} />
          <StatCard label="LTV" value={brl(subscription.ltv)} />
          <StatCard label="Assinaturas ativas" value={num(subscription.ativas)} />
          <StatCard label="Churn" value={pct(subscription.churn, 1)} />
          <StatCard label="Renovações" value={num(subscription.renovacoes)} />
        </div>
      )}

      <SectionCard className="mt-6" title={`Investimento x Receita (${range})`}>
        <div className="h-72 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="fill-receita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={16}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                yAxisId="money"
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickFormatter={(v) => brl(Number(v))}
              />
              <YAxis
                yAxisId="roas"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number, key) =>
                  key === "roas" ? [`${num(v, 2)}x`, "ROAS"] : [brl(v), key === "receita" ? "Receita" : "Investimento"]
                }
              />
              <Area
                yAxisId="money"
                type="monotone"
                dataKey="receita"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                fill="url(#fill-receita)"
              />
              <Area
                yAxisId="money"
                type="monotone"
                dataKey="investimento"
                stroke="var(--color-chart-3)"
                strokeWidth={1.5}
                fill="transparent"
              />
              <Line
                yAxisId="roas"
                type="monotone"
                dataKey="roas"
                stroke="var(--color-chart-2)"
                strokeWidth={1.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="mt-6 space-y-6">
        {scoped.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </>
  );
}

function CampaignCard({ campaign }: { campaign: CampaignRow }) {
  const ads = campaign.campaign_ads ?? [];
  const total = sumAds([campaign]);
  const [openAd, setOpenAd] = useState<string | null>(null);

  return (
    <SectionCard
      title={campaign.name}
      action={
        <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-semibold">
          {PLATFORMS[campaign.platform].label}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3 border-b border-border p-5 md:grid-cols-5">
        {[
          ["Investimento", brl(total.investimento)],
          ["Receita", brl(total.receita)],
          ["ROAS", `${num(total.receita / Math.max(total.investimento, 1), 2)}x`],
          ["Vendas", num(total.vendas)],
          ["Conversão", pct((total.vendas / Math.max(total.cliques, 1)) * 100, 2)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-surface-2 p-3">
            <p className="label-mono">{k}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Anúncio", "Conjunto", "Formato", "Entrega", "Invest.", "CTR", "CPA", "ROAS", "Vendas", ""].map(
                (h, i) => (
                  <th key={`${h}-${i}`} className="label-mono px-5 py-3 font-normal">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {ads.map((a) => {
              const m = (a.metrics ?? {}) as Metrics;
              const bd = (a.breakdowns ?? {}) as Breakdowns;
              const open = openAd === a.id;
              return (
                <Fragment key={a.id}>
                  <tr className="border-b border-border/60">
                    <td className="px-5 py-3 font-medium">{a.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.adset}</td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">{a.format}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                          a.status === "ativo"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {a.delivery}
                      </span>
                    </td>
                    <td className="px-5 py-3">{brl(Number(m["investimento"] ?? 0))}</td>
                    <td className="px-5 py-3">{pct(Number(m["ctr"] ?? 0), 2)}</td>
                    <td className="px-5 py-3">{brl(Number(m["cpa"] ?? 0))}</td>
                    <td className="px-5 py-3 font-semibold text-primary">
                      {num(Number(m["roas"] ?? 0), 2)}x
                    </td>
                    <td className="px-5 py-3">{num(Number(m["vendas"] ?? 0))}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setOpenAd(open ? null : a.id)}
                        aria-label="Detalhes do anúncio"
                        className="grid size-7 place-items-center rounded-md bg-surface-2 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-border/60 bg-surface-2/40">
                      <td colSpan={10} className="px-5 py-5">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-lg bg-surface-2 p-4">
                            <p className="label-mono">Criativo</p>
                            <p className="mt-1 text-sm font-semibold">{a.creative ?? a.name}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Qualidade: {a.quality} • Hook {pct(Number(m["hook_rate"] ?? 0), 1)} • Retenção{" "}
                              {pct(Number(m["hold_rate"] ?? 0), 1)}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              {[
                                ["CPM", brl(Number(m["cpm"] ?? 0))],
                                ["CPC", brl(Number(m["cpc"] ?? 0))],
                                ["Frequência", num(Number(m["frequencia"] ?? 0), 2)],
                                ["Leads", num(Number(m["leads"] ?? 0))],
                              ].map(([k, v]) => (
                                <div key={k} className="rounded-md bg-background/60 p-2">
                                  <p className="label-mono">{k}</p>
                                  <p className="font-semibold">{v}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          {Object.entries(bd).slice(0, 5).map(([key, rows]) => (
                            <div key={key} className="rounded-lg bg-surface-2 p-4">
                              <p className="label-mono capitalize">{key}</p>
                              <div className="mt-2 space-y-2">
                                {rows.map((r) => (
                                  <div key={r.label} className="text-xs">
                                    <div className="flex justify-between">
                                      <span>{r.label}</span>
                                      <span className="text-muted-foreground">
                                        {pct(r.share, 1)} • {num(r.roas, 2)}x
                                      </span>
                                    </div>
                                    <div className="mt-1 h-1.5 rounded-full bg-background/70">
                                      <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${Math.min(r.share, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
