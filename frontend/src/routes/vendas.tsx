import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { numero: "#4821", cliente: "Acme Indústria", valor: "R$ 2.480,00", data: "10/05/2026", status: "concluida" },
  { numero: "#4820", cliente: "Marina Souza", valor: "R$ 487,00", data: "10/05/2026", status: "pendente" },
  { numero: "#4819", cliente: "Estúdio Norte", valor: "R$ 8.120,00", data: "09/05/2026", status: "concluida" },
  { numero: "#4818", cliente: "Pedro Lima", valor: "R$ 312,00", data: "09/05/2026", status: "cancelada" },
  { numero: "#4817", cliente: "Loja Aurora", valor: "R$ 1.940,00", data: "08/05/2026", status: "concluida" },
];

export const Route = createFileRoute("/vendas")({
  head: () => ({ meta: [{ title: "Vendas — Nebula" }, { name: "description", content: "Acompanhe e registre suas vendas." }] }),
  component: () => (
    <ListPage
      eyebrow="Operações"
      title={<>Vendas em <span className="text-primary">tempo real</span></>}
      description="Visualize todas as vendas, status de pagamento e performance da sua equipe."
      columns={[
        { key: "numero", label: "Número" },
        { key: "cliente", label: "Cliente" },
        { key: "valor", label: "Valor" },
        { key: "data", label: "Data" },
        { key: "status", label: "Status", render: (r) => (
          r.status === "concluida" ? <StatusBadge tone="success">Concluída</StatusBadge>
          : r.status === "pendente" ? <StatusBadge tone="warning">Pendente</StatusBadge>
          : <StatusBadge tone="danger">Cancelada</StatusBadge>
        ) },
      ]}
      rows={rows}
      actionLabel="Nova venda"
    />
  ),
});
