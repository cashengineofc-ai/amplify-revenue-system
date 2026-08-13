import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/meus-produtos")({
  head: () => ({
    meta: [
      { title: "Meus produtos | ELEVE_ENGINE" },
      { name: "description", content: "Desempenho de cada produto que você promove." },
      { property: "og:title", content: "Meus produtos | ELEVE_ENGINE" },
      { property: "og:description", content: "Desempenho de cada produto que você promove." },
    ],
  }),
  component: MeusProdutos,
});

function MeusProdutos() {
  return (
    <>
      <PageHeader eyebrow="Produtos" title="Meus produtos" description="Desempenho de cada produto que você promove." />
      <EmptyState title="Nenhum produto afiliado" description="Afilie-se a um produto no marketplace para ver o desempenho aqui." />
    </>
  );
}
