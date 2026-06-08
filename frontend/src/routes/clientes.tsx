import { createFileRoute } from "@tanstack/react-router";
import { ListPage } from "@/components/list-page";

const rows = [
  { nome: "Marina Souza", email: "marina@acme.com", telefone: "(11) 98765-4321", cidade: "São Paulo", desde: "Mar/2024" },
  { nome: "Acme Indústria", email: "contato@acme.com", telefone: "(11) 4002-8922", cidade: "Campinas", desde: "Jan/2023" },
  { nome: "Estúdio Norte", email: "ola@estudionorte.co", telefone: "(21) 99887-6543", cidade: "Rio de Janeiro", desde: "Ago/2024" },
  { nome: "Pedro Lima", email: "pedro@gmail.com", telefone: "(31) 99231-1100", cidade: "Belo Horizonte", desde: "Fev/2025" },
  { nome: "Loja Aurora", email: "vendas@aurora.com", telefone: "(41) 3344-2211", cidade: "Curitiba", desde: "Out/2023" },
];

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Nebula" }, { name: "description", content: "Cadastre e gerencie clientes." }] }),
  component: () => (
    <ListPage
      eyebrow="Cadastros"
      title={<>Sua base de <span className="text-primary">clientes</span></>}
      description="Mantenha contatos, histórico e segmentações organizados em um só lugar."
      columns={[
        { key: "nome", label: "Nome" },
        { key: "email", label: "E-mail" },
        { key: "telefone", label: "Telefone" },
        { key: "cidade", label: "Cidade" },
        { key: "desde", label: "Cliente desde" },
      ]}
      rows={rows}
      actionLabel="Novo cliente"
    />
  ),
});
