import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { sku: "PRD-001", nome: "Plano Pro Anual", categoria: "Assinatura", preco: "R$ 1.200,00", estoque: "—", status: "ativo" },
  { sku: "PRD-002", nome: "Consultoria Premium", categoria: "Serviço", preco: "R$ 1.106,89", estoque: "—", status: "ativo" },
  { sku: "PRD-003", nome: "Setup Express", categoria: "Serviço", preco: "R$ 650,00", estoque: "—", status: "ativo" },
  { sku: "PRD-004", nome: "Cabo HDMI 2m", categoria: "Acessório", preco: "R$ 49,90", estoque: "3", status: "baixo" },
  { sku: "PRD-005", nome: "Mouse Wireless", categoria: "Acessório", preco: "R$ 129,00", estoque: "42", status: "ativo" },
];

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Cadastros"
      title={<>Catálogo de <span className="text-primary">produtos</span></>}
      description="Gerencie SKUs, preços, estoque e categorias num catálogo limpo e poderoso."
      columns={[
        { key: "sku", label: "SKU" },
        { key: "nome", label: "Produto" },
        { key: "categoria", label: "Categoria" },
        { key: "preco", label: "Preço" },
        { key: "estoque", label: "Estoque" },
        { key: "status", label: "Status", render: (r) =>
          r.status === "ativo" ? <StatusBadge tone="success">Ativo</StatusBadge>
          : <StatusBadge tone="warning">Estoque baixo</StatusBadge>
        },
      ]}
      rows={rows}
      actionLabel="Novo produto"
    />
  ),
});
