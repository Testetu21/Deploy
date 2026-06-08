import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CircleDollarSign, ArrowDown, ArrowUp, Wallet } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

const data = [
  { d: "Sem 1", entradas: 24, saidas: 12 },
  { d: "Sem 2", entradas: 28, saidas: 14 },
  { d: "Sem 3", entradas: 32, saidas: 18 },
  { d: "Sem 4", entradas: 41, saidas: 22 },
];

export const Route = createFileRoute("/caixa")({
  head: () => ({ meta: [{ title: "Fluxo de Caixa — Nebula" }] }),
  component: () => (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader
        eyebrow="Financeiro"
        title={<>Fluxo de <span className="text-primary">caixa</span></>}
        description="Veja entradas, saídas e saldo projetado com clareza absoluta."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saldo atual" value="R$ 84.210" delta="+6.1%" deltaPositive icon={<Wallet className="size-4" />} />
        <StatCard label="Entradas (mês)" value="R$ 142.380" delta="+12.4%" deltaPositive icon={<ArrowDown className="size-4" />} />
        <StatCard label="Saídas (mês)" value="R$ 58.170" delta="-3.2%" deltaPositive icon={<ArrowUp className="size-4" />} />
        <StatCard label="Resultado" value="R$ 84.210" delta="+18.0%" deltaPositive icon={<CircleDollarSign className="size-4" />} />
      </div>
      <div className="rounded-2xl bg-surface border border-border p-5 shadow-soft">
        <h3 className="font-semibold mb-4">Entradas vs Saídas</h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="d" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}k`} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="saidas" fill="var(--foreground)" fillOpacity={0.65} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  ),
});
