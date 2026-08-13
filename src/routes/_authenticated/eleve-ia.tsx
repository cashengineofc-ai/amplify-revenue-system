import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/eleve-ia")({
  head: () => ({
    meta: [
      { title: "Eleve IA | ELEVE_ENGINE" },
      { name: "description", content: "Copys, criativos e análises geradas por IA." },
      { property: "og:title", content: "Eleve IA | ELEVE_ENGINE" },
      { property: "og:description", content: "Copys, criativos e análises geradas por IA." },
    ],
  }),
  component: EleveIa,
});

function EleveIa() {
  return (
    <>
      <PageHeader eyebrow="Inteligência" title="Eleve IA" description="Copys, criativos e análises geradas por IA." />
      <EmptyState title="Em preparação" description="Os assistentes de IA serão liberados para a sua conta." />
    </>
  );
}
