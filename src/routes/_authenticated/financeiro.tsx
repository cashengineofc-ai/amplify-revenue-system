import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Conta & Saldo | ELEVE_ENGINE" },
      { name: "description", content: "Histórico de transações, saldo e saques." },
      { property: "og:title", content: "Conta & Saldo | ELEVE_ENGINE" },
      { property: "og:description", content: "Histórico de transações, saldo e saques." },
    ],
  }),
  component: Financeiro,
});

function Financeiro() {
  return (
    <>
      <PageHeader eyebrow="Financeiro" title="Conta & Saldo" description="Histórico de transações, saldo e saques." />
      <EmptyState title="Sem movimentações" description="Suas transações e saques aparecem aqui." />
    </>
  );
}
