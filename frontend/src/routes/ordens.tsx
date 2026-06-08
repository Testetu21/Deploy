import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge } from "@/components/list-page";

const rows = [
  { os: "OS #318", cliente: "Acme Indústria", servico: "Manutenção de equipamento", tecnico: "Carlos M.", status: "andamento" },
  { os: "OS #317", cliente: "Estúdio Norte", servico: "Instalação", tecnico: "Bruna R.", status: "concluida" },
  { os: "OS #316", cliente: "Loja Aurora", servico: "Suporte técnico", tecnico: "Diego S.", status: "agendada" },
  { os: "OS #315", cliente: "Pedro Lima", servico: "Diagnóstico", tecnico: "Carlos M.", status: "concluida" },
];

export const Route = createFileRoute("/ordens")({
  head: () => ({ meta: [{ title: "Ordens de Serviço — Nebula" }] }),
  component: () => (
    <ListPage
      eyebrow="Serviços"
      title={<>Ordens de <span className="text-primary">serviço</span></>}
      description="Da abertura ao fechamento — controle total das suas OS, técnicos e SLAs."
      columns={[
        { key: "os", label: "OS" },
        { key: "cliente", label: "Cliente" },
        { key: "servico", label: "Serviço" },
        { key: "tecnico", label: "Técnico" },
        { key: "status", label: "Status", render: (r) =>
          r.status === "concluida" ? <StatusBadge tone="success">Concluída</StatusBadge>
          : r.status === "andamento" ? <StatusBadge tone="primary">Em andamento</StatusBadge>
          : <StatusBadge tone="warning">Agendada</StatusBadge>
        },
      ]}
      rows={rows}
      actionLabel="Nova OS"
    />
  ),
});
