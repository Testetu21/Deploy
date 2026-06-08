import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { ref: "PG-9942", origem: "Venda #4821", metodo: "Cartão de crédito", valor: "R$ 2.480,00", data: "10/05/2026", status: "confirmado" },
  { ref: "PG-9941", origem: "OS #318", metodo: "PIX", valor: "R$ 1.120,00", data: "09/05/2026", status: "confirmado" },
  { ref: "PG-9940", origem: "Venda #4818", metodo: "Boleto", valor: "R$ 312,00", data: "08/05/2026", status: "pendente" },
  { ref: "PG-9939", origem: "Venda #4815", metodo: "PIX", valor: "R$ 4.620,00", data: "07/05/2026", status: "confirmado" },
];

export const Route = createFileRoute("/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Financeiro"
      title={<>Pagamentos <span className="text-primary">recebidos</span></>}
      description="Reconcilie recebimentos por método, origem e status — sem ruído."
      columns={[
        { key: "ref", label: "Referência" },
        { key: "origem", label: "Origem" },
        { key: "metodo", label: "Método" },
        { key: "valor", label: "Valor" },
        { key: "data", label: "Data" },
        { key: "status", label: "Status", render: (r) =>
          r.status === "confirmado" ? <StatusBadge tone="success">Confirmado</StatusBadge>
          : <StatusBadge tone="warning">Pendente</StatusBadge>
        },
      ]}
      rows={rows}
      actionLabel="Registrar pagamento"
    />
  ),
});
