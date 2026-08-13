import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/treinamentos")({
  head: () => ({
    meta: [
      { title: "Treinamentos | ELEVE_ENGINE" },
      { name: "description", content: "Trilhas práticas de tráfego, copy e escala." },
      { property: "og:title", content: "Treinamentos | ELEVE_ENGINE" },
      { property: "og:description", content: "Trilhas práticas de tráfego, copy e escala." },
    ],
  }),
  component: Treinamentos,
});

function Treinamentos() {
  return (
    <>
      <PageHeader eyebrow="Educação" title="Treinamentos" description="Trilhas práticas de tráfego, copy e escala." />
      <EmptyState title="Nenhuma trilha disponível" description="Novas trilhas de treinamento aparecem aqui." />
    </>
  );
}
