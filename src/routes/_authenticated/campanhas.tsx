import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/hooks/use-session";
import { EmptyState, PageHeader, SectionCard } from "@/components/ui-kit";
import { brl, num, pct, PLATFORMS } from "@/lib/format";
import { fetchCampaigns } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/campanhas")({
  head: () => ({
    meta: [
      { title: "Campanhas | ELEVE_ENGINE" },
      { name: "description", content: "Campanhas e anúncios por plataforma com métricas completas." },
      { property: "og:title", content: "Campanhas | ELEVE_ENGINE" },
      { property: "og:description", content: "Gerencie Meta Ads, TikTok e Kwai em um só lugar." },
    ],
  }),
  component: Campanhas,
});

type Metrics = Record<string, number>;

function Campanhas() {
  const { user } = useSession();
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", user?.id],
    enabled: !!user,
    queryFn: () => fetchCampaigns(user!.id),
  });

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
        description="Desempenho por plataforma, conjunto e criativo."
      />
      <div className="space-y-6">
        {campaigns.map((c) => {
          const ads = c.campaign_ads ?? [];
          const total = ads.reduce(
            (acc, a) => {
              const m = (a.metrics ?? {}) as Metrics;
              return {
                investimento: acc.investimento + Number(m['investimento'] ?? 0),
                receita: acc.receita + Number(m['receita'] ?? 0),
                vendas: acc.vendas + Number(m['vendas'] ?? 0),
                cliques: acc.cliques + Number(m['cliques'] ?? 0),
              };
            },
            { investimento: 0, receita: 0, vendas: 0, cliques: 0 },
          );
          return (
            <SectionCard
              key={c.id}
              title={c.name}
              action={
                <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-semibold">
                  {PLATFORMS[c.platform].label}
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-3 border-b border-border p-5 md:grid-cols-5">
                {[
                  ["Investimento", brl(total.investimento)],
                  ["Receita", brl(total.receita)],
                  ["ROAS", num(total.receita / Math.max(total.investimento, 1), 2)],
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
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Anúncio", "Conjunto", "Status", "Invest.", "CTR", "CPA", "ROAS", "Vendas"].map(
                        (h) => (
                          <th key={h} className="label-mono px-5 py-3 font-normal">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((a) => {
                      const m = (a.metrics ?? {}) as Metrics;
                      return (
                        <tr key={a.id} className="border-b border-border/60 last:border-0">
                          <td className="px-5 py-3 font-medium">{a.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{a.adset}</td>
                          <td className="px-5 py-3 capitalize">{a.status}</td>
                          <td className="px-5 py-3">{brl(Number(m['investimento'] ?? 0))}</td>
                          <td className="px-5 py-3">{pct(Number(m['ctr'] ?? 0), 2)}</td>
                          <td className="px-5 py-3">{brl(Number(m['cpa'] ?? 0))}</td>
                          <td className="px-5 py-3 font-semibold text-primary">
                            {num(Number(m['roas'] ?? 0), 2)}x
                          </td>
                          <td className="px-5 py-3">{num(Number(m['vendas'] ?? 0))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
