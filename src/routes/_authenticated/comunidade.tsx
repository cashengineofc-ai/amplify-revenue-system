import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade | ELEVE_ENGINE" },
      { name: "description", content: "Conecte-se com outros afiliados e envie seu feedback." },
      { property: "og:title", content: "Comunidade | ELEVE_ENGINE" },
      { property: "og:description", content: "Conecte-se com outros afiliados e envie seu feedback." },
    ],
  }),
  component: Comunidade,
});

function Comunidade() {
  return (
    <>
      <PageHeader eyebrow="Comunidade" title="Comunidade" description="Conecte-se com outros afiliados e envie seu feedback." />
      <EmptyState title="Sem publicações" description="As publicações da comunidade aparecem aqui." />
    </>
  );
}
