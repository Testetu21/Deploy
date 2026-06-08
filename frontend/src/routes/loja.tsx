import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { ArrowUpRight } from "lucide-react";

const produtos = [
  { nome: "Plano Pro Anual", preco: "R$ 1.200", tag: "Mais vendido" },
  { nome: "Consultoria Premium", preco: "R$ 1.106", tag: "Novo" },
  { nome: "Setup Express", preco: "R$ 650", tag: "Promo" },
  { nome: "Manutenção Mensal", preco: "R$ 540", tag: "Recorrente" },
  { nome: "Mouse Wireless", preco: "R$ 129", tag: "Acessório" },
  { nome: "Cabo HDMI 2m", preco: "R$ 49", tag: "Acessório" },
];

export const Route = createFileRoute("/loja")({
  head: () => ({ meta: [{ title: "Loja — Nebula" }, { name: "description", content: "Vitrine pública dos seus produtos." }] }),
  component: () => (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader
        eyebrow="Vitrine"
        title={<>Sua <span className="text-primary">loja</span> em destaque</>}
        description="Personalize a vitrine pública e venda direto pelo link da Nebula."
        actions={
          <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 shadow-elegant">
            Compartilhar loja <ArrowUpRight className="size-4" />
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtos.map((p) => (
          <div key={p.nome} className="rounded-2xl bg-surface border border-border overflow-hidden shadow-soft hover:shadow-elegant transition">
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/40 via-primary/15 to-surface-2 relative">
              <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.14em] font-medium bg-surface px-2 py-1 rounded-full border border-border">
                {p.tag}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.nome}</div>
                <div className="text-xs text-muted-foreground">A partir de</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg">{p.preco}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
});
