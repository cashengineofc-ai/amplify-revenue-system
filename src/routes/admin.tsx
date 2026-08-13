import { useEffect, useRef, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Radio, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { brl, dateBR, num, PLATFORM_KEYS, PLATFORMS, type PlatformKey } from "@/lib/format";
import { fetchProducts, fetchProfiles } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Controle interno | ELEVE_ENGINE" },
      { name: "description", content: "Painel interno de operação da plataforma." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const INTERVALS = [
  { label: "5s", ms: 5000 },
  { label: "10s", ms: 10000 },
  { label: "30s", ms: 30000 },
  { label: "1min", ms: 60000 },
] as const;

function AdminPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [promoteEmail, setPromoteEmail] = useState("");
  const [balance, setBalance] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [commission, setCommission] = useState("");
  const [buyer, setBuyer] = useState("");
  const [platform, setPlatform] = useState<PlatformKey>("meta_instagram");
  const [autoMs, setAutoMs] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: profiles = [] } = useQuery({ queryKey: ["admin-profiles"], queryFn: fetchProfiles });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: fetchProducts });

  const selected = profiles.find((p) => p.id === userId);

  useEffect(() => {
    if (!userId && profiles[0]) setUserId(profiles[0].id);
  }, [profiles, userId]);
  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id);
  }, [products, productId]);

  const registerSale = async (opts?: { random?: boolean }) => {
    if (!userId) throw new Error("Selecione um usuário.");
    const product = products.find((p) => p.id === productId) ?? products[0];
    if (!product) throw new Error("Nenhum produto disponível.");

    const value = opts?.random
      ? Number(product.ticket)
      : Number((amount || product.ticket).toString().replace(",", "."));
    const comm = opts?.random
      ? (value * Number(product.commission_pct)) / 100
      : Number(
          (commission || (value * Number(product.commission_pct)) / 100).toString().replace(",", "."),
        );

    const plat = opts?.random
      ? PLATFORM_KEYS[Math.floor(Math.random() * PLATFORM_KEYS.length)]!
      : platform;

    const { error } = await supabase.from("sales").insert({
      user_id: userId,
      product_id: product.id,
      amount: value,
      commission: comm,
      status: "aprovada",
      method: "pix",
      platform: plat,
      buyer_name: opts?.random ? randomBuyer() : buyer || randomBuyer(),
    });
    if (error) throw error;

    await supabase.from("transactions").insert({
      user_id: userId,
      type: "comissao",
      status: "concluida",
      amount: comm,
      description: `Comissão — ${product.name}`,
    });
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Venda aprovada",
      body: `${product.name} — comissão de ${brl(comm)}`,
    });

    const current = profiles.find((p) => p.id === userId);
    await supabase
      .from("profiles")
      .update({ balance: Number(current?.balance ?? 0) + comm })
      .eq("id", userId);

    queryClient.invalidateQueries();
  };

  const sale = useMutation({
    mutationFn: () => registerSale(),
    onSuccess: () => toast.success("Venda registrada."),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao registrar venda."),
  });

  const saveBalance = useMutation({
    mutationFn: async () => {
      const value = Number(balance.replace(",", "."));
      if (!Number.isFinite(value)) throw new Error("Valor inválido.");
      const { error } = await supabase.from("profiles").update({ balance: value }).eq("id", userId);
      if (error) throw error;
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "ajuste",
        status: "concluida",
        amount: value - Number(selected?.balance ?? 0),
        description: "Ajuste manual de saldo",
      });
    },
    onSuccess: () => {
      toast.success("Saldo atualizado.");
      setBalance("");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao ajustar saldo."),
  });

  const promote = useMutation({
    mutationFn: async () => {
      const target = profiles.find(
        (p) => p.email.toLowerCase() === promoteEmail.trim().toLowerCase(),
      );
      if (!target) throw new Error("E-mail não encontrado na base.");
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: target.id, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Novo administrador promovido.");
      setPromoteEmail("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao promover."),
  });

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!autoMs || !userId) return;
    timer.current = setInterval(() => {
      void registerSale({ random: true }).catch(() => {});
    }, autoMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMs, userId, productId, products.length, profiles.length]);

  const totalBalance = profiles.reduce((acc, p) => acc + Number(p.balance), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Interno"
        title="Controle da plataforma"
        description="Gestão de contas, produtos e eventos ao vivo."
        action={
          <span className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="size-3.5" /> modo demonstração
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuários" value={num(profiles.length)} hint="Contas cadastradas" />
        <StatCard label="Produtos" value={num(products.length)} hint="Catálogo publicado" />
        <StatCard label="Saldo total" value={brl(totalBalance)} highlight hint="Somatório das contas" />
        <StatCard
          label="Automação"
          value={autoMs ? `${INTERVALS.find((i) => i.ms === autoMs)?.label}` : "desligada"}
          hint="Geração de vendas ao vivo"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Conta selecionada">
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="user">Usuário</Label>
              <select
                id="user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/60"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email} — {brl(Number(p.balance))}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Criada em {dateBR(selected?.created_at)} · saldo atual{" "}
              {brl(Number(selected?.balance ?? 0))}
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="balance">Definir saldo</Label>
                <Input
                  id="balance"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
              <Button onClick={() => saveBalance.mutate()} disabled={saveBalance.isPending}>
                Salvar
              </Button>
            </div>
            <div className="flex items-end gap-2 border-t border-border pt-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="promote">Promover admin por e-mail</Label>
                <Input
                  id="promote"
                  type="email"
                  placeholder="pessoa@email.com"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => promote.mutate()} disabled={promote.isPending}>
                Promover
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Registrar venda">
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="product">Produto</Label>
              <select
                id="product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/60"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {brl(Number(p.ticket))}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="ticket do produto"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="commission">Comissão</Label>
                <Input
                  id="commission"
                  inputMode="decimal"
                  placeholder="calculada"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buyer">Comprador</Label>
                <Input
                  id="buyer"
                  placeholder="aleatório"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="platform">Plataforma</Label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as PlatformKey)}
                  className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/60"
                >
                  {PLATFORM_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {PLATFORMS[k].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button className="w-full" onClick={() => sale.mutate()} disabled={sale.isPending}>
              Registrar venda agora
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Automação ao vivo" className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 p-5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radio className={cn("size-4", autoMs && "animate-pulse text-primary")} /> intervalo
            </span>
            {INTERVALS.map((i) => (
              <button
                key={i.label}
                onClick={() => setAutoMs(autoMs === i.ms ? null : i.ms)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
                  autoMs === i.ms
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {i.label}
              </button>
            ))}
            <Button variant="outline" onClick={() => setAutoMs(null)} disabled={!autoMs}>
              Parar
            </Button>
            <p className="text-xs text-muted-foreground">
              Gera vendas aprovadas para a conta selecionada, com plataforma aleatória.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

const NAMES = [
  "Ana Ribeiro",
  "Bruno Salles",
  "Carla Menezes",
  "Diego Prado",
  "Eduarda Lima",
  "Felipe Antunes",
  "Gabriela Souza",
  "Henrique Vaz",
];

function randomBuyer() {
  return NAMES[Math.floor(Math.random() * NAMES.length)]!;
}
