import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { numero: "ORC-2031", cliente: "Acme Indústria", valor: "R$ 12.480,00", validade: "20/05/2026", status: "aprovado" },
  { numero: "ORC-2030", cliente: "Estúdio Norte", valor: "R$ 4.250,00", validade: "18/05/2026", status: "aguardando" },
  { numero: "ORC-2029", cliente: "Loja Aurora", valor: "R$ 2.180,00", validade: "15/05/2026", status: "aguardando" },
  { numero: "ORC-2028", cliente: "Pedro Lima", valor: "R$ 720,00", validade: "12/05/2026", status: "recusado" },
];

export const Route = createFileRoute("/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos — Nebula" }, { name: "description", content: "Crie e acompanhe propostas." }] }),
  component: () => (
    <ListPage
      eyebrow="Operações"
      title={<>Propostas e <span className="text-primary">orçamentos</span></>}
      description="Crie orçamentos elegantes, envie para o cliente e converta em venda com um clique."
      columns={[
        { key: "numero", label: "Número" },
        { key: "cliente", label: "Cliente" },
        { key: "valor", label: "Valor" },
        { key: "validade", label: "Validade" },
        { key: "status", label: "Status", render: (r) =>
          r.status === "aprovado" ? <StatusBadge tone="success">Aprovado</StatusBadge>
          : r.status === "aguardando" ? <StatusBadge tone="warning">Aguardando</StatusBadge>
          : <StatusBadge tone="danger">Recusado</StatusBadge>
        },
      ]}
      rows={rows}
      actionLabel="Novo orçamento"
    />
  ),
});
