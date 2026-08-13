import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM & Leads | ELEVE_ENGINE" },
      { name: "description", content: "Leads capturados pelas suas campanhas, por estágio e origem." },
      { property: "og:title", content: "CRM & Leads | ELEVE_ENGINE" },
      { property: "og:description", content: "Leads capturados pelas suas campanhas, por estágio e origem." },
    ],
  }),
  component: Crm,
});

function Crm() {
  return (
    <>
      <PageHeader eyebrow="CRM" title="CRM & Leads" description="Leads capturados pelas suas campanhas, por estágio e origem." />
      <EmptyState title="Nenhum lead ainda" description="Os leads das suas campanhas aparecem aqui." />
    </>
  );
}
