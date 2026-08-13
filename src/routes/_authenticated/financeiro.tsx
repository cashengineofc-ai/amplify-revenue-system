import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/use-session";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { AnimatedNumber } from "@/components/animated-number";
import { brl, dateBR } from "@/lib/format";
import { fetchTransactions, fetchWithdrawals } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Conta & Saldo | ELEVE_ENGINE" },
      {
        name: "description",
        content: "Saldo, histórico de transações e solicitações de saque via PIX.",
      },
      { property: "og:title", content: "Conta & Saldo | ELEVE_ENGINE" },
      {
        property: "og:description",
        content: "Acompanhe entradas, saídas e saques da sua operação.",
      },
    ],
  }),
  component: Financeiro,
});

const TX_LABEL: Record<string, string> = {
  comissao: "Comissão",
  saque: "Saque",
  pix: "PIX",
  ajuste: "Ajuste",
  bonus: "Bônus",
};

const STATUS_STYLE: Record<string, string> = {
  concluida: "bg-success/15 text-success",
  pago: "bg-success/15 text-success",
  aprovado: "bg-success/15 text-success",
  pendente: "bg-warning/15 text-warning",
  em_analise: "bg-warning/15 text-warning",
  recusada: "bg-destructive/15 text-destructive",
  recusado: "bg-destructive/15 text-destructive",
};

function Badge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        STATUS_STYLE[status] ?? "bg-surface-2 text-muted-foreground",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Financeiro() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: () => fetchTransactions(user!.id),
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: () => fetchWithdrawals(user!.id),
  });

  const balance = Number(profile?.balance ?? 0);
  const entradas = transactions
    .filter((t) => t.type !== "saque" && t.status === "concluida")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const saidas = withdrawals
    .filter((w) => w.status !== "recusado")
    .reduce((acc, w) => acc + Number(w.amount), 0);
  const pendentes = withdrawals
    .filter((w) => w.status === "em_analise")
    .reduce((acc, w) => acc + Number(w.amount), 0);

  const requestWithdrawal = useMutation({
    mutationFn: async () => {
      const value = Number(amount.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0) throw new Error("Informe um valor válido.");
      if (value > balance) throw new Error("Valor acima do saldo disponível.");
      const key = pixKey || profile?.pix_key;
      if (!key) throw new Error("Cadastre uma chave PIX para receber.");

      const { error } = await supabase.from("withdrawals").insert({
        user_id: user!.id,
        amount: value,
        pix_key: key,
        pix_key_type: profile?.pix_key_type ?? "email",
      });
      if (error) throw error;

      await supabase.from("transactions").insert({
        user_id: user!.id,
        type: "saque",
        status: "pendente",
        amount: -value,
        description: "Solicitação de saque via PIX",
      });
      await supabase
        .from("profiles")
        .update({ balance: balance - value, pix_key: key })
        .eq("id", user!.id);
    },
    onSuccess: () => {
      toast.success("Saque solicitado", { description: "Aguarde a análise financeira." });
      setAmount("");
      queryClient.invalidateQueries();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Não foi possível solicitar o saque."),
  });

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Conta & Saldo"
        description="Todo o fluxo de caixa da sua operação, atualizado em tempo real."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          label="Saldo disponível"
          value={<AnimatedNumber value={balance} format={brl} />}
          hint="Pronto para saque via PIX"
        />
        <StatCard
          label="Entradas"
          value={<AnimatedNumber value={entradas} format={brl} />}
          hint={`${transactions.length} lançamentos`}
        />
        <StatCard
          label="Saques"
          value={<AnimatedNumber value={saidas} format={brl} />}
          hint={`${withdrawals.length} solicitações`}
        />
        <StatCard
          label="Em análise"
          value={<AnimatedNumber value={pendentes} format={brl} />}
          hint="Saques aguardando aprovação"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <SectionCard title="Histórico de transações">
          {transactions.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada até agora.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {transactions.map((t) => {
                const value = Number(t.amount);
                const positive = value >= 0;
                return (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                      )}
                    >
                      {positive ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {TX_LABEL[t.type] ?? t.type}
                        {t.description ? ` — ${t.description}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{dateBR(t.created_at)}</p>
                    </div>
                    <Badge status={t.status} />
                    <span
                      className={cn(
                        "w-28 text-right font-display text-sm font-bold",
                        positive ? "text-success" : "text-destructive",
                      )}
                    >
                      {brl(value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Solicitar saque">
            <form
              className="space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                requestWithdrawal.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  placeholder={profile?.pix_key ?? "e-mail, CPF ou aleatória"}
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={requestWithdrawal.isPending}>
                Solicitar saque
              </Button>
              <p className="text-xs text-muted-foreground">
                Saques são processados em até 1 dia útil após a aprovação.
              </p>
            </form>
          </SectionCard>

          <SectionCard title="Saques">
            {withdrawals.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-muted-foreground">
                Nenhum saque solicitado.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {withdrawals.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="font-display text-sm font-bold">{brl(Number(w.amount))}</p>
                      <p className="text-xs text-muted-foreground">{dateBR(w.created_at)}</p>
                    </div>
                    <Badge status={w.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {transactions.length === 0 && withdrawals.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Seu caixa começa na primeira venda"
            description="Comissões aprovadas entram automaticamente no saldo disponível."
          />
        </div>
      )}
    </>
  );
}
