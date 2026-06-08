import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { nome: "Lovable Admin", email: "admin@nebula.com", nivel: "Administrador", ultimo: "há 2 min", status: "ativo" },
  { nome: "Carlos Mendes", email: "carlos@nebula.com", nivel: "Técnico", ultimo: "há 1 h", status: "ativo" },
  { nome: "Diego Souza", email: "diego@nebula.com", nivel: "Vendedor", ultimo: "há 3 h", status: "ativo" },
  { nome: "Renata Alves", email: "renata@nebula.com", nivel: "Caixa", ultimo: "há 2 dias", status: "inativo" },
];

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Sistema"
      title={<>Acessos & <span className="text-primary">usuários</span></>}
      description="Defina perfis, permissões e mantenha sua operação segura."
      columns={[
        { key: "nome", label: "Nome" },
        { key: "email", label: "E-mail" },
        { key: "nivel", label: "Nível" },
        { key: "ultimo", label: "Último acesso" },
        { key: "status", label: "Status", render: (r) =>
          r.status === "ativo" ? <StatusBadge tone="success">Ativo</StatusBadge>
          : <StatusBadge tone="muted">Inativo</StatusBadge>
        },
      ]}
      rows={rows}
      actionLabel="Novo usuário"
    />
  ),
});
