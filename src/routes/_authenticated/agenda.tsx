import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | ELEVE_ENGINE" },
      { name: "description", content: "Lançamentos, mentorias e eventos da plataforma." },
      { property: "og:title", content: "Agenda | ELEVE_ENGINE" },
      { property: "og:description", content: "Lançamentos, mentorias e eventos da plataforma." },
    ],
  }),
  component: Agenda,
});

function Agenda() {
  return (
    <>
      <PageHeader eyebrow="Agenda" title="Agenda" description="Lançamentos, mentorias e eventos da plataforma." />
      <EmptyState title="Nenhum evento agendado" description="Os próximos eventos aparecem aqui." />
    </>
  );
}
