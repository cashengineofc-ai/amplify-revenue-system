import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/hooks/use-session";
import { EmptyState, PageHeader, SectionCard } from "@/components/ui-kit";
import { brl, dateBR, PLATFORMS } from "@/lib/format";
import { fetchSales } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/minhas-vendas")({
  head: () => ({
    meta: [
      { title: "Minhas vendas | ELEVE_ENGINE" },
      { name: "description", content: "Lista detalhada de todas as suas vendas e comissões." },
      { property: "og:title", content: "Minhas vendas | ELEVE_ENGINE" },
      { property: "og:description", content: "Acompanhe cada venda aprovada, pendente ou reembolsada." },
    ],
  }),
  component: MinhasVendas,
});

function MinhasVendas() {
  const { user } = useSession();
  const { data: sales = [] } = useQuery({
    queryKey: ["sales", user?.id],
    enabled: !!user,
    queryFn: () => fetchSales(user!.id),
  });

  return (
    <>
      <PageHeader
        eyebrow="Vendas"
        title="Minhas vendas"
        description="Cada transação registrada nas suas campanhas, em tempo real."
      />
      {sales.length === 0 ? (
        <EmptyState
          title="Nenhuma venda ainda"
          description="Assim que a primeira venda cair, ela aparece aqui automaticamente."
        />
      ) : (
        <SectionCard title={`${sales.length} vendas`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Produto", "Comprador", "Plataforma", "Valor", "Comissão", "Status", "Data"].map(
                    (h) => (
                      <th key={h} className="label-mono px-5 py-3 font-normal">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-medium">{s.products?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.buyer_name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {s.platform ? PLATFORMS[s.platform].short : "—"}
                    </td>
                    <td className="px-5 py-3">{brl(Number(s.amount))}</td>
                    <td className="px-5 py-3 font-semibold text-success">
                      {brl(Number(s.commission))}
                    </td>
                    <td className="px-5 py-3 capitalize">{s.status}</td>
                    <td className="px-5 py-3 text-muted-foreground">{dateBR(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  );
}
