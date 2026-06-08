import { createFileRoute } from "@tanstack/react-router";
import { ListPage } from "@/components/list-page";

const rows = [
  { tipo: "Entrada", descricao: "Recebimento Venda #4821", categoria: "Vendas", valor: "+ R$ 2.480,00", data: "10/05/2026" },
  { tipo: "Saída", descricao: "Pagamento Fornecedor Aurora", categoria: "Compras", valor: "− R$ 1.250,00", data: "09/05/2026" },
  { tipo: "Entrada", descricao: "Recebimento OS #318", categoria: "Serviços", valor: "+ R$ 1.120,00", data: "09/05/2026" },
  { tipo: "Saída", descricao: "Folha de pagamento", categoria: "Pessoal", valor: "− R$ 18.400,00", data: "05/05/2026" },
];

export const Route = createFileRoute("/movimentacoes")({
  head: () => ({ meta: [{ title: "Movimentações — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Financeiro"
      title={<>Todas as <span className="text-primary">movimentações</span></>}
      description="Entradas e saídas com categorização, busca e filtros precisos."
      columns={[
        { key: "tipo", label: "Tipo" },
        { key: "descricao", label: "Descrição" },
        { key: "categoria", label: "Categoria" },
        { key: "valor", label: "Valor", render: (r) => (
          <span className={r.valor.startsWith("+") ? "text-success font-medium" : "text-destructive font-medium"}>{r.valor}</span>
        )},
        { key: "data", label: "Data" },
      ]}
      rows={rows}
      actionLabel="Nova movimentação"
    />
  ),
});
