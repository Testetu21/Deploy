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

interface Venda {
  id_venda: number;
  cliente_nome: string;
  vendedor_nome: string;
  valor_total: number;
  data_venda: string;
  status: number;
  itens: Item[];
}

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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
        </div>
      </div>
    </div>
  );
}