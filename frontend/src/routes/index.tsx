import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  CircleDollarSign, ShoppingCart, UserPlus, Activity, ArrowUpRight,
  CheckCircle2, Clock, UserCheck, AlertTriangle, BadgeCheck,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nebula Premium Suite" },
      { name: "description", content: "Resumo elegante do desempenho do seu negócio." },
    ],
  }),
  component: DashboardPage,
});

const chartData = [
  { m: "Jan", receita: 22, custos: 14 },
  { m: "Fev", receita: 25, custos: 16 },
  { m: "Mar", receita: 28, custos: 18 },
  { m: "Abr", receita: 27, custos: 17 },
  { m: "Mai", receita: 32, custos: 20 },
  { m: "Jun", receita: 36, custos: 22 },
  { m: "Jul", receita: 41, custos: 24 },
  { m: "Ago", receita: 48, custos: 27 },
  { m: "Set", receita: 46, custos: 26 },
  { m: "Out", receita: 50, custos: 28 },
  { m: "Nov", receita: 53, custos: 29 },
  { m: "Dez", receita: 58, custos: 31 },
];

const activities = [
  { icon: CheckCircle2, color: "text-success", title: "Venda #4821 concluída", sub: "R$ 2.480,00 · há 4 min" },
  { icon: Clock, color: "text-primary", title: "Orçamento aguardando aprovação", sub: "Cliente Acme · há 22 min" },
  { icon: UserCheck, color: "text-foreground", title: "Novo cliente cadastrado", sub: "Marina Souza · há 1 h" },
  { icon: AlertTriangle, color: "text-warning", title: "Estoque baixo: Produto X", sub: "Restam 3 unidades · há 2 h" },
  { icon: BadgeCheck, color: "text-success", title: "Pagamento confirmado", sub: "OS #318 · há 3 h" },
];

const topProdutos = [
  { nome: "Plano Pro Anual", vendas: 124, receita: "R$ 148.800", perf: 92 },
  { nome: "Consultoria Premium", vendas: 87, receita: "R$ 96.250", perf: 78 },
  { nome: "Setup Express", vendas: 64, receita: "R$ 41.600", perf: 58 },
  { nome: "Manutenção Mensal", vendas: 52, receita: "R$ 28.080", perf: 41 },
];

function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader
        eyebrow="Operação ao vivo"
        title={<>Bem-vindo de volta, <span className="text-primary">Lovable</span></>}
        description="Aqui está um resumo elegante do desempenho do seu negócio. Tudo otimizado para foco e clareza."
        actions={
          <>
            <button className="h-10 px-4 rounded-xl border border-border bg-surface text-sm font-medium hover:bg-accent transition">
              Exportar
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition shadow-elegant">
              Nova venda <ArrowUpRight className="size-4" />
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita do mês" value="R$ 142.380" delta="+12.4%" deltaPositive icon={<CircleDollarSign className="size-4" />} />
        <StatCard label="Vendas" value="1.284" delta="+8.2%" deltaPositive icon={<ShoppingCart className="size-4" />} />
        <StatCard label="Novos clientes" value="312" delta="-2.1%" deltaPositive={false} icon={<UserPlus className="size-4" />} />
        <StatCard label="Ticket médio" value="R$ 487" delta="+4.6%" deltaPositive icon={<Activity className="size-4" />} />
      </div>

      {/* Chart + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-surface border border-border p-5 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">Receita anual</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Comparação entre vendas e custos</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Receita</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground/60" />Custos</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCustos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}k`} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="receita" stroke="var(--primary)" strokeWidth={2.5} fill="url(#gReceita)" />
                <Area type="monotone" dataKey="custos" stroke="var(--foreground)" strokeOpacity={0.7} strokeWidth={2} fill="url(#gCustos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Atividade recente</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground">Ver tudo</button>
          </div>
          <ul className="space-y-4">
            {activities.map((a, i) => (
              <li key={i} className="flex gap-3">
                <div className={`size-8 rounded-full bg-primary-soft border border-primary/15 grid place-items-center shrink-0 ${a.color}`}>
                  <a.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.sub}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top produtos */}
      <div className="rounded-2xl bg-surface border border-border shadow-soft overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Top produtos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Mais vendidos nos últimos 30 dias</p>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground">Relatório completo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground bg-surface-2 border-y border-border">
                <th className="text-left font-medium px-5 py-3">Produto</th>
                <th className="text-left font-medium px-5 py-3">Vendas</th>
                <th className="text-left font-medium px-5 py-3">Receita</th>
                <th className="text-left font-medium px-5 py-3 w-[28%]">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProdutos.map((p) => (
                <tr key={p.nome} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                  <td className="px-5 py-4 font-medium">{p.nome}</td>
                  <td className="px-5 py-4 text-muted-foreground">{p.vendas}</td>
                  <td className="px-5 py-4">{p.receita}</td>
                  <td className="px-5 py-4">
                    <div className="h-1.5 rounded-full bg-primary-soft overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${p.perf}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
