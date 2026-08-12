import { supabase } from "@/integrations/supabase/client";

export type Range = "7d" | "30d" | "90d" | "12m";

export const rangeStart = (range: Range) => {
  const d = new Date();
  if (range === "7d") d.setDate(d.getDate() - 6);
  if (range === "30d") d.setDate(d.getDate() - 29);
  if (range === "90d") d.setDate(d.getDate() - 89);
  if (range === "12m") d.setMonth(d.getMonth() - 11);
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_metrics(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_metrics(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSales(userId: string) {
  const { data, error } = await supabase
    .from("sales")
    .select("*, products(name, slug, cover_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

export async function fetchAffiliations(userId: string) {
  const { data, error } = await supabase
    .from("affiliations")
    .select("*, products(*, product_metrics(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchCampaigns(userId: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, products(name, slug, cover_url, is_subscription), campaign_ads(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export type SaleRow = Awaited<ReturnType<typeof fetchSales>>[number];
export type ProductRow = Awaited<ReturnType<typeof fetchProducts>>[number];
export type CampaignRow = Awaited<ReturnType<typeof fetchCampaigns>>[number];

/** Série temporal de vendas agregada por dia (ou mês em 12m). */
export function buildSeries(sales: { created_at: string; commission: number; amount: number }[], range: Range) {
  const start = rangeStart(range);
  const monthly = range === "12m";
  const buckets = new Map<string, { label: string; comissao: number; faturamento: number }>();

  const cursor = new Date(start);
  const now = new Date();
  while (cursor <= now) {
    const key = monthly
      ? `${cursor.getFullYear()}-${cursor.getMonth()}`
      : cursor.toISOString().slice(0, 10);
    const label = monthly
      ? cursor.toLocaleDateString("pt-BR", { month: "short" })
      : cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (!buckets.has(key)) buckets.set(key, { label, comissao: 0, faturamento: 0 });
    if (monthly) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }

  for (const sale of sales) {
    const d = new Date(sale.created_at);
    if (d < start) continue;
    const key = monthly ? `${d.getFullYear()}-${d.getMonth()}` : d.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.comissao += Number(sale.commission);
      bucket.faturamento += Number(sale.amount);
    }
  }

  return [...buckets.values()];
}
