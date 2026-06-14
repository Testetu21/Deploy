import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconCart, IconCheck, IconClock, IconMoney, IconUsers } from "../../components/ui/icons";
import "./VendasDetalhes.css";
import API_URL from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/format";

const API = `${API_URL}/api`;

interface Item {
  id_item_venda: number;
  produto_nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

interface Pagamento {
  id_pagamento: number;
  valor: number;
  status: string;
  data_vencimento: string;
  data_pagamento: string | null;
  descricao: string;
  numero_recibo: string | null;
  codigo_venda: string | null;
}

interface StatusPagamento {
  label: string;
  fracao: string;
  cor: 'verde' | 'amarelo' | 'azul' | 'vermelho' | 'neutro';
}

interface Venda {
  id_venda: number;
  cliente_nome: string;
  vendedor_nome: string;
  valor_total: number;
  data_venda: string;
  status: number;
  itens: Item[];
  pagamentos?: Pagamento[];
  status_pagamento?: StatusPagamento;
}

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function getCorPagamento(cor: string) {
  const map: Record<string, string> = {
    verde: 'status-success',
    amarelo: 'status-warning',
    azul: 'status-info',
    vermelho: 'status-danger',
    neutro: 'status-neutral',
  };
  return map[cor] || 'status-neutral';
}

export default function VendasDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVenda() {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`${API}/vendas/${id}`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setVenda(data);
      } catch (err) {
        console.error(err);
        setVenda(null);
      } finally {
        setLoading(false);
      }
    }

    fetchVenda();
  }, [id]);


  function getStatusMeta(status: number) {
    if (status === 1) return { label: "Concluída", cls: "status-success", icon: <IconCheck /> };
    if (status === 2) return { label: "Cancelada", cls: "status-danger", icon: <IconClock /> };
    return { label: "Pendente", cls: "status-warning", icon: <IconClock /> };
  }

  if (loading) {
    return (
      <div className="vendas-detalhes-wrapper">
        <Sidebar />
        <div className="vendas-detalhes-page">
          <div className="vd-loading-shell">
            <div className="vd-loading-card">
              <div className="vd-loading-icon"><IconClock /></div>
              <h3>Carregando detalhes da venda</h3>
              <p>Buscando as informações do registro selecionado.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="vendas-detalhes-wrapper">
        <Sidebar />
        <div className="vendas-detalhes-page">
          <div className="vd-loading-shell">
            <div className="vd-loading-card">
              <div className="vd-loading-icon"><IconCart /></div>
              <h3>Venda não encontrada</h3>
              <p>Não foi possível localizar essa venda.</p>
              <button className="btn btn-primary" onClick={() => navigate("/vendas")}>Voltar para vendas</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusMeta(venda.status);
  const totalItens = venda.itens.reduce((sum, item) => sum + item.quantidade, 0);

  function imprimirRecibo() {
    if (!venda) return;

    const pagamentoComCodigo = venda.pagamentos?.find(p => p.codigo_venda && p.status === 'pendente');

    const win = window.open("", "_blank", "width=380,height=600");
    if (!win) return;

    const linhas = venda.itens.map(it => `
    <tr>
      <td style="padding:4px 0;">${it.produto_nome}</td>
      <td style="text-align:center;padding:4px 0;">${it.quantidade}</td>
      <td style="text-align:right;padding:4px 0;">${formatCurrency(it.subtotal)}</td>
    </tr>
  `).join("");

    win.document.write(`
    <html>
      <head>
        <title>Venda #${venda.id_venda}</title>
        <style>
          body { font-family: monospace; font-size: 13px; padding: 16px; color: #111; }
          h2, h3 { text-align: center; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; border-bottom: 1px dashed #999; font-size: 11px; padding-bottom: 4px; }
          .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 1px dashed #999; padding-top: 6px; }
          .codigo { text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 4px; margin: 16px 0; padding: 10px; border: 2px dashed #333; }
          .info { text-align: center; font-size: 11px; color: #555; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h2>Comprovante de Venda</h2>
        <div class="info">Venda #${venda.id_venda} — Cliente: ${venda.cliente_nome}</div>
        <table>
          <thead>
            <tr><th>Item</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Subtotal</th></tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
        <div class="total">Total: ${formatCurrency(venda.valor_total)}</div>
        ${pagamentoComCodigo ? `
          <div class="codigo">${pagamentoComCodigo.codigo_venda}</div>
          <div class="info">Apresente este código no caixa para pagamento</div>
        ` : `
          <div class="info">Pagamento já processado</div>
        `}
        <script>window.print();</script>
      </body>
    </html>
  `);
    win.document.close();
  }

  return (
    <div className="vendas-detalhes-wrapper">
      <Sidebar />

      <div className="vendas-detalhes-page">
        <header className="p-topbar vd-topbar">
          <div className="p-topbar-title vd-topbar-title">
            <span className="vd-title-chip">Detalhes</span>
            Venda #{venda.id_venda}
          </div>

          <div className="p-topbar-actions">
            <button className="btn btn-ghost" onClick={imprimirRecibo}>
              Imprimir recibo
            </button>
            <button className="btn btn-back" onClick={() => navigate("/vendas")}>
              Voltar
            </button>
          </div>
        </header>

        <div className="vd-content">
          <section className="vd-hero">
            <div>
              <p className="vd-kicker">Resumo da venda</p>
              <h1>Venda #{venda.id_venda}</h1>
              <p className="vd-hero-text">
                Visualize os dados principais, o status atual e todos os itens lançados.
              </p>
            </div>

            <div className={`vd-status-card ${statusMeta.cls}`}>
              <div className="vd-status-icon">{statusMeta.icon}</div>
              <div>
                <span>Status</span>
                <strong>{statusMeta.label}</strong>
              </div>
            </div>
          </section>

          <section className="vd-summary-grid">
            <article className="vd-summary-card">
              <div className="vd-summary-icon"><IconUsers /></div>
              <div>
                <span>Cliente</span>
                <strong>{venda.cliente_nome}</strong>
              </div>
            </article>

            <article className="vd-summary-card vd-vendedor-card">
              <div className="vd-summary-icon vd-vendedor-icon"><IconUsers /></div>
              <div>
                <span>Vendedor</span>
                <strong>{venda.vendedor_nome}</strong>
              </div>
            </article>

            <article className="vd-summary-card">
              <div className="vd-summary-icon"><IconClock /></div>
              <div>
                <span>Data</span>
                <strong>{formatDateTime(venda.data_venda)}</strong>
              </div>
            </article>

            <article className="vd-summary-card vd-money-card">
              <div className="vd-summary-icon"><IconMoney /></div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(venda.valor_total)}</strong>
              </div>
            </article>
          </section>

          <section className="vd-table-card">
            <div className="vd-table-header">
              <div>
                <h3>Itens da venda</h3>
                <p>{totalItens} item(ns) cadastrados</p>
              </div>
              <div className="vd-total-pill">{formatCurrency(venda.valor_total)}</div>
            </div>

            {venda.itens.length === 0 ? (
              <div className="vd-empty-items">
                <IconCart />
                <p>Essa venda não possui itens vinculados.</p>
              </div>
            ) : (
              <div className="vd-table-scroll">
                <table className="vd-items-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd</th>
                      <th>Valor Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {venda.itens.map((item) => (
                      <tr key={item.id_item_venda}>
                        <td className="vd-product">{item.produto_nome}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatCurrency(item.valor_unitario)}</td>
                        <td><strong>{formatCurrency(item.subtotal)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SEÇÃO DE PAGAMENTOS — fora da tabela de itens ── */}
          {venda.pagamentos && venda.pagamentos.length > 0 && (
            <section className="vd-table-card" style={{ marginTop: 20 }}>
              <div className="vd-table-header">
                <div>
                  <h3>Pagamento</h3>
                  <p>
                    {venda.status_pagamento?.fracao} parcelas pagas
                    {venda.status_pagamento?.label && ` · ${venda.status_pagamento.label}`}
                  </p>
                </div>
              </div>

              <div className="vd-table-scroll">
                {venda.pagamentos.map((p) => (
                  <div
                    key={p.id_pagamento}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(0,0,0,.06)'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{p.descricao}</p>
                      <p style={{ fontSize: 12, color: '#667085', marginTop: 4 }}>
                        Vencimento: {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                        {p.data_pagamento && ` · Pago em: ${new Date(p.data_pagamento).toLocaleDateString('pt-BR')}`}
                      </p>
                      {p.codigo_venda && p.status === 'pendente' && (
                        <p style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#6366f1',
                          marginTop: 6,
                          fontFamily: 'monospace',
                          letterSpacing: 2
                        }}>
                          Código: {p.codigo_venda}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <strong>{formatCurrency(p.valor)}</strong>
                      <span className={`status-badge ${getCorPagamento(
                        p.status === 'pago' ? 'verde' : p.status === 'cancelado' ? 'vermelho' : 'amarelo'
                      )}`}>
                        {p.status === 'pago' ? 'Pago' : p.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}