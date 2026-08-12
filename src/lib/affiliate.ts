import { supabase } from "@/integrations/supabase/client";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/format";

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const ri = (min: number, max: number) => Math.round(rand(min, max));

export function buildLinks(productSlug: string, userId: string) {
  const base = `https://pay.eleve.app/${productSlug}`;
  const short = userId.slice(0, 8);
  return Object.fromEntries(
    PLATFORM_KEYS.map((p) => [
      p,
      `${base}?ref=${short}&utm_source=${p}&utm_medium=cpc&utm_campaign=${productSlug}&utm_content=${p}_01`,
    ]),
  ) as Record<PlatformKey, string>;
}

const CREATIVES = [
  "VSL 60s — Prova social",
  "Reels — Antes e depois",
  "Carrossel — 5 erros comuns",
  "UGC — Depoimento cliente",
  "Story nativo — Bastidores",
];

function buildAdMetrics(ticket: number, commissionPct: number) {
  const spend = rand(180, 2400);
  const cpm = rand(9, 34);
  const impressions = Math.round((spend / cpm) * 1000);
  const ctr = rand(0.9, 4.2);
  const clicks = Math.round((impressions * ctr) / 100);
  const linkClicks = Math.round(clicks * rand(0.55, 0.85));
  const lpv = Math.round(linkClicks * rand(0.7, 0.94));
  const viewContent = Math.round(lpv * rand(0.6, 0.9));
  const addToCart = Math.round(viewContent * rand(0.2, 0.45));
  const initiateCheckout = Math.round(addToCart * rand(0.4, 0.75));
  const conv = rand(0.8, 3.6);
  const purchases = Math.max(0, Math.round((linkClicks * conv) / 100));
  const revenue = purchases * ticket;
  const commission = (revenue * commissionPct) / 100;
  const leads = Math.round(lpv * rand(0.05, 0.2));
  const v3s = Math.round(impressions * rand(0.25, 0.55));
  const v25 = Math.round(v3s * rand(0.5, 0.8));
  const v50 = Math.round(v25 * rand(0.5, 0.8));
  const v75 = Math.round(v50 * rand(0.5, 0.85));
  const v100 = Math.round(v75 * rand(0.4, 0.8));

  return {
    investimento: +spend.toFixed(2),
    impressoes: impressions,
    alcance: Math.round(impressions / rand(1.1, 2.4)),
    frequencia: +rand(1.1, 2.4).toFixed(2),
    cliques: clicks,
    cliques_link: linkClicks,
    ctr: +ctr.toFixed(2),
    ctr_link: +((linkClicks / impressions) * 100).toFixed(2),
    cpc: +(spend / Math.max(clicks, 1)).toFixed(2),
    cpm: +cpm.toFixed(2),
    cpa: +(spend / Math.max(purchases, 1)).toFixed(2),
    cpl: +(spend / Math.max(leads, 1)).toFixed(2),
    cac: +(spend / Math.max(purchases, 1)).toFixed(2),
    roi: +(((commission - spend) / spend) * 100).toFixed(2),
    roas: +(revenue / spend).toFixed(2),
    rpm: +((revenue / Math.max(impressions, 1)) * 1000).toFixed(2),
    resultados: purchases,
    lpv,
    conversao: +conv.toFixed(2),
    receita: +revenue.toFixed(2),
    lucro: +(commission - spend).toFixed(2),
    vendas: purchases,
    ticket_medio: +ticket.toFixed(2),
    view_content: viewContent,
    add_to_cart: addToCart,
    initiate_checkout: initiateCheckout,
    purchase: purchases,
    video_3s: v3s,
    video_25: v25,
    video_50: v50,
    video_75: v75,
    video_100: v100,
    thruplays: Math.round(v75 * rand(0.7, 1)),
    hook_rate: +((v3s / Math.max(impressions, 1)) * 100).toFixed(2),
    hold_rate: +((v100 / Math.max(v3s, 1)) * 100).toFixed(2),
    engajamento: ri(120, 9800),
    comentarios: ri(3, 420),
    compartilhamentos: ri(1, 260),
    salvamentos: ri(2, 380),
    seguidores: ri(0, 190),
    leads,
  };
}

function buildBreakdowns() {
  const share = (labels: string[]) => {
    const raw = labels.map(() => rand(1, 10));
    const total = raw.reduce((a, b) => a + b, 0);
    return labels.map((label, i) => ({
      label,
      share: +((raw[i]! / total) * 100).toFixed(1),
      roas: +rand(0.6, 5.2).toFixed(2),
      cpa: +rand(18, 240).toFixed(2),
    }));
  };
  return {
    idade: share(["18-24", "25-34", "35-44", "45-54", "55+"]),
    genero: share(["Feminino", "Masculino"]),
    dispositivo: share(["Mobile", "Desktop", "Tablet"]),
    posicionamento: share(["Feed", "Stories", "Reels", "Explorar"]),
    regiao: share(["SP", "RJ", "MG", "PR", "BA"]),
    hora: share(["00-06", "06-12", "12-18", "18-24"]),
  };
}

export async function affiliateToProduct(
  userId: string,
  product: { id: string; slug: string; name: string; ticket: number; commission_pct: number },
) {
  const links = buildLinks(product.slug, userId);

  const { error: affError } = await supabase
    .from("affiliations")
    .insert({ user_id: userId, product_id: product.id, links });
  if (affError && affError.code !== "23505") throw affError;

  const { data: existing } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", product.id);
  if (existing && existing.length > 0) return links;

  const { data: campaigns, error: campError } = await supabase
    .from("campaigns")
    .insert(
      PLATFORM_KEYS.map((platform, i) => ({
        user_id: userId,
        product_id: product.id,
        platform,
        name: `${product.name} — ${platform.replace("meta_", "").toUpperCase()} 0${i + 1}`,
        objective: i % 2 === 0 ? "Conversões" : "Geração de leads",
        status: "ativa",
        daily_budget: Math.round(rand(80, 600)),
        balance: Math.round(rand(200, 3000)),
      })),
    )
    .select("id, platform");
  if (campError) throw campError;

  const ads = (campaigns ?? []).flatMap((c) =>
    Array.from({ length: 3 }, (_, i) => ({
      campaign_id: c.id,
      user_id: userId,
      adset: `Conjunto 0${i + 1} — ${i === 0 ? "Amplo" : i === 1 ? "Interesses" : "Lookalike 1%"}`,
      name: `${CREATIVES[(i + 1) % CREATIVES.length]}`,
      creative: CREATIVES[(i + 2) % CREATIVES.length] ?? null,
      format: i === 2 ? "imagem" : "video",
      status: i === 2 ? "pausado" : "ativo",
      quality: i === 0 ? "Acima da média" : "Média",
      delivery: i === 2 ? "Pausado" : "Veiculando",
      metrics: buildAdMetrics(Number(product.ticket), Number(product.commission_pct)),
      breakdowns: buildBreakdowns(),
    })),
  );

  const { data: insertedAds, error: adsError } = await supabase
    .from("campaign_ads")
    .insert(ads)
    .select("id, campaign_id");
  if (adsError) throw adsError;

  const daily: Record<string, unknown>[] = [];
  for (const c of campaigns ?? []) {
    const campaignAds = (insertedAds ?? []).filter((a) => a.campaign_id === c.id);
    for (let d = 89; d >= 0; d--) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      const m = buildAdMetrics(Number(product.ticket), Number(product.commission_pct));
      const factor = 0.05 + Math.random() * 0.12;
      daily.push({
        campaign_id: c.id,
        ad_id: campaignAds[0]?.id ?? null,
        user_id: userId,
        day: day.toISOString().slice(0, 10),
        spend: +(m.investimento * factor).toFixed(2),
        revenue: +(m.receita * factor).toFixed(2),
        sales: Math.round(m.vendas * factor),
        clicks: Math.round(m.cliques * factor),
        impressions: Math.round(m.impressoes * factor),
        leads: Math.round(m.leads * factor),
        metrics: {},
      });
    }
  }
  if (daily.length) {
    const { error } = await supabase.from("campaign_metrics_daily").insert(daily);
    if (error) throw error;
  }

  // leads iniciais no CRM
  const nomes = ["Ana Souza", "Bruno Lima", "Carla Dias", "Diego Alves", "Elisa Rocha", "Felipe Moura"];
  await supabase.from("leads").insert(
    nomes.map((name, i) => ({
      user_id: userId,
      campaign_id: campaigns?.[i % (campaigns?.length || 1)]?.id ?? null,
      product_id: product.id,
      name,
      email: `${name.toLowerCase().replace(/\s/g, ".")}@email.com`,
      phone: `(11) 9${ri(1000, 9999)}-${ri(1000, 9999)}`,
      stage: (["novo", "contato", "qualificado", "negociacao", "ganho", "perdido"] as const)[i % 6],
      source: PLATFORM_KEYS[i % PLATFORM_KEYS.length],
      value: Number(product.ticket),
    })),
  );

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Afiliação aprovada",
    body: `Seus links e campanhas de ${product.name} já estão disponíveis.`,
    kind: "success",
  });

  return links;
}
