import { createFileRoute } from "@tanstack/react-router";
import { ListPage } from "@/components/list-page";

const rows = [
  { nome: "Aurora Distribuidora", cnpj: "12.345.678/0001-90", contato: "Mariana", telefone: "(11) 4002-1188", categoria: "Acessórios" },
  { nome: "TechSupply BR", cnpj: "98.765.432/0001-21", contato: "Rafael", telefone: "(11) 3344-2222", categoria: "Eletrônicos" },
  { nome: "Norte Logística", cnpj: "55.443.221/0001-44", contato: "Camila", telefone: "(21) 99887-1234", categoria: "Logística" },
];

export const Route = createFileRoute("/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Cadastros"
      title={<>Seus <span className="text-primary">fornecedores</span></>}
      description="Centralize parceiros, contatos e categorias para uma operação sem atritos."
      columns={[
        { key: "nome", label: "Razão social" },
        { key: "cnpj", label: "CNPJ" },
        { key: "contato", label: "Contato" },
        { key: "telefone", label: "Telefone" },
        { key: "categoria", label: "Categoria" },
      ]}
      rows={rows}
      actionLabel="Novo fornecedor"
    />
  ),
});
