import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import { SectionCard } from "@/components/ui-kit";
import { brl, num, pct, PLATFORMS, PLATFORM_KEYS, type PlatformKey } from "@/lib/format";
import { fetchAffiliations, fetchProductBySlug } from "@/lib/queries";
import { affiliateToProduct } from "@/lib/affiliate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/marketplace/$slug")({
  head: () => ({
    meta: [
      { title: "Produto | ELEVE_ENGINE" },
      { name: "description", content: "Detalhes da oferta, materiais, funil e regras de comissão." },
      { property: "og:title", content: "Produto | ELEVE_ENGINE" },
      { property: "og:description", content: "Afilie-se e gere links por plataforma." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user } = useSession();
  const qc = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });
  const { data: affiliations = [] } = useQuery({
    queryKey: ["affiliations", user?.id],
    enabled: !!user,
    queryFn: () => fetchAffiliations(user!.id),
  });

  const affiliation = affiliations.find((a) => a.product_id === product?.id);
  const links = (affiliation?.links ?? {}) as Partial<Record<PlatformKey, string>>;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("Sessão expirada");
      return affiliateToProduct(user.id, {
        id: product.id,
        slug: product.slug,
        name: product.name,
        ticket: Number(product.ticket),
        commission_pct: Number(product.commission_pct),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Afiliação concluída", {
        description: "Links e campanhas criados para todas as plataformas.",
      });
    },
    onError: (e: Error) => toast.error("Não foi possível afiliar", { description: e.message }),
  });

  if (isLoading) return <div className="panel h-96 animate-pulse" />;
  if (!product) return <p className="text-muted-foreground">Produto não encontrado.</p>;

  const m = product.product_metrics;
  const gallery = (Array.isArray(product.gallery) ? product.gallery : []) as string[];
  const materials = (Array.isArray(product.materials) ? product.materials : []) as string[];

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success("Link copiado");
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <>
      <Link
        to="/marketplace"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar ao marketplace
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="panel overflow-hidden">
            <img
              src={product.cover_url ?? ""}
              alt={product.name}
              className="h-56 w-full object-cover md:h-72"
            />
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-semibold">
                  {product.category}
                </span>
                {product.is_subscription && (
                  <span className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                    Assinatura
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                  <Star className="size-3 fill-current" /> {num(Number(m?.stars ?? 0), 1)}
                </span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">{product.name}</h1>
              <p className="mt-2 text-muted-foreground">{product.tagline}</p>
              <p className="mt-5 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          </div>

          {gallery.length > 0 && (
            <SectionCard title="Galeria">
              <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-3">
                {gallery.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${product.name} ${i + 1}`}
                    loading="lazy"
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </SectionCard>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Público-alvo">
              <p className="p-5 text-sm leading-relaxed text-muted-foreground">
                {product.audience ?? "—"}
              </p>
            </SectionCard>
            <SectionCard title="Funil">
              <p className="p-5 text-sm leading-relaxed text-muted-foreground">
                {product.funnel ?? "—"}
              </p>
            </SectionCard>
            <SectionCard title="Materiais">
              <ul className="space-y-2 p-5 text-sm">
                {materials.length ? (
                  materials.map((mat) => (
                    <li key={mat} className="flex items-center gap-2">
                      <Check className="size-3.5 text-success" /> {mat}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">Em breve</li>
                )}
              </ul>
            </SectionCard>
            <SectionCard title="Regras de comissão">
              <p className="p-5 text-sm leading-relaxed text-muted-foreground">
                {product.commission_rules ?? "—"}
              </p>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-glow p-6">
            <p className="label-mono">Sua comissão por venda</p>
            <p className="mt-1 font-display text-3xl font-bold text-primary">
              {brl((Number(product.ticket) * Number(product.commission_pct)) / 100)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {num(Number(product.commission_pct))}% sobre ticket de {brl(Number(product.ticket))}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["EPC", brl(Number(m?.epc ?? 0))],
                ["Conversão", pct(Number(m?.conversion_rate ?? 0), 1)],
                ["Vendas 30d", num(Number(m?.sales_30d ?? 0))],
                ["Reembolso", pct(Number(m?.refund_rate ?? 0), 1)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface-2 p-3">
                  <p className="label-mono">{k}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>

            {affiliation ? (
              <p className="mt-5 rounded-lg bg-success/10 px-3 py-2 text-center text-sm font-semibold text-success">
                Você já é afiliado
              </p>
            ) : (
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Afiliar-se agora
              </button>
            )}
          </div>

          {affiliation && (
            <SectionCard title="Seus links">
              <div className="space-y-3 p-5">
                {PLATFORM_KEYS.map((key) => (
                  <div key={key} className="rounded-lg border border-border bg-surface-2 p-3">
                    <p className="label-mono">{PLATFORMS[key].label}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="flex-1 truncate text-[11px] text-muted-foreground">
                        {links[key]}
                      </code>
                      <button
                        onClick={() => copy(key, links[key] ?? "")}
                        className={cn(
                          "rounded-md p-1.5 transition-colors",
                          copied === key ? "text-success" : "text-muted-foreground hover:text-foreground",
                        )}
                        aria-label="Copiar link"
                      >
                        {copied === key ? <Check className="size-4" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <Link
                  to="/campanhas"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border text-sm font-semibold hover:bg-surface-2"
                >
                  Ver campanhas
                </Link>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}
