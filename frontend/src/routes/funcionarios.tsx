import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { nome: "Carlos Mendes", cargo: "Técnico Sênior", email: "carlos@nebula.com", admissao: "Mar/2022", status: "ativo" },
  { nome: "Bruna Ribeiro", cargo: "Técnica", email: "bruna@nebula.com", admissao: "Jul/2023", status: "ativo" },
  { nome: "Diego Souza", cargo: "Vendedor", email: "diego@nebula.com", admissao: "Out/2024", status: "ativo" },
  { nome: "Renata Alves", cargo: "Caixa", email: "renata@nebula.com", admissao: "Fev/2025", status: "ferias" },
];

export const Route = createFileRoute("/funcionarios")({
  head: () => ({ meta: [{ title: "Funcionários — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Cadastros"
      title={<>Equipe <span className="text-primary">Nebula</span></>}
      description="Gerencie sua equipe, cargos, contatos e disponibilidade num só lugar."
      columns={[
        { key: "nome", label: "Nome" },
        { key: "cargo", label: "Cargo" },
        { key: "email", label: "E-mail" },
        { key: "admissao", label: "Admissão" },
        { key: "status", label: "Status", render: (r) =>
          r.status === "ativo" ? <StatusBadge tone="success">Ativo</StatusBadge>
          : <StatusBadge tone="warning">Em férias</StatusBadge>
        },
      ]}
      rows={rows}
      actionLabel="Novo funcionário"
    />
  ),
});
