import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { descricao: "Aluguel escritório", categoria: "Operacional", vencimento: "10/05/2026", valor: "R$ 6.200,00", status: "pago" },
  { descricao: "Energia elétrica", categoria: "Utilidades", vencimento: "12/05/2026", valor: "R$ 740,00", status: "pendente" },
  { descricao: "Internet corporativa", categoria: "Utilidades", vencimento: "15/05/2026", valor: "R$ 320,00", status: "pendente" },
  { descricao: "Software CRM", categoria: "Ferramentas", vencimento: "20/05/2026", valor: "R$ 480,00", status: "pago" },
];

export const Route = createFileRoute("/despesas")({
  head: () => ({ meta: [{ title: "Despesas — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Financeiro"
      title={<>Controle de <span className="text-primary">despesas</span></>}
      description="Categorize, agende e nunca mais perca um vencimento."
      columns={[
        { key: "descricao", label: "Descrição" },
        { key: "categoria", label: "Categoria" },
        { key: "vencimento", label: "Vencimento" },
        { key: "valor", label: "Valor" },
        { key: "status", label: "Status", render: (r) =>
          r.status === "pago" ? <StatusBadge tone="success">Pago</StatusBadge>
          : <StatusBadge tone="warning">Pendente</StatusBadge>
        },
      ]}
      rows={rows}
      actionLabel="Nova despesa"
    />
  ),
});
