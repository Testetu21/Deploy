import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconCart, IconCheck, IconChart, IconClock, IconMoney } from "../../components/ui/icons";
import "./vendas.css";
import "../../styles/data-panel.css";
import API_URL from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { getUser } from "../../utils/auth";

const API = `${API_URL}/api`;

interface Venda {
  id: number;
  cliente_nome: string;
  cliente_id: number;
  vendedor_nome: string;
  vendedor_id: number;
  valor_total: number;
  data_venda: string;
  status_pagamento: {
    label: string;
    fracao: string;
    cor: "verde" | "amarelo" | "azul" | "vermelho" | "neutro";
  };
}

const IconPlus = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

function getCorPagamento(cor: string) {
  const map: Record<string, string> = {
    verde: "status-ok",
    amarelo: "status-warn",
    azul: "status-info",
    vermelho: "status-bad",
    neutro: "status-neutral",
  };
  return map[cor] || "status-neutral";
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err"; visible: boolean }>({
    msg: "", type: "ok", visible: false,
  });
  function show(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }
  return { toast, show };
}

// só pendente permite editar/excluir
function isPendente(v: Venda) {
  return (
    v.status_pagamento?.label === "Aguardando pagamento" &&
    v.status_pagamento?.fracao === "-"
  );
}

export default function Vendas() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, show: showToast } = useToast();

  const user = getUser();
  const isAdminOuGerente = user?.nivel === 1 || user?.nivel === 2;

  async function fetchVendas() {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/vendas`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVendas(
        data.map((v: any) => ({
          id: v.id_venda,
          cliente_nome: v.cliente_nome || "N/A",
          cliente_id: v.id_cliente,
          vendedor_nome: v.vendedor_nome || "N/A",
          vendedor_id: v.vendedor_id,
          valor_total: Number(v.valor_total ?? 0),
          data_venda: v.data_venda,
          status_pagamento: v.status_pagamento || { label: "Sem pagamento", fracao: "-", cor: "neutro" },
        }))
      );
    } catch (err) {
      showToast(err instanceof Error ? `Erro: ${err.message}` : "Erro ao carregar vendas", "err");
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchVendas(); }, []);

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/vendas/${confirmId}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Erro ao excluir");
      }
      showToast("Venda excluída com sucesso!", "ok");
      setConfirmId(null);
      fetchVendas();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir", "err");
    } finally {
      setDeleting(false);
    }
  }

  const stats = useMemo(() => ({
    total: vendas.length,
    pagas: vendas.filter((v) => v.status_pagamento?.label === "Pago").length,
    pendentes: vendas.filter((v) =>
      v.status_pagamento?.label === "Pendente" || v.status_pagamento?.label === "Parcial"
    ).length,
    total_valor: vendas.reduce((acc, v) => acc + v.valor_total, 0),
  }), [vendas]);

  const lista = useMemo(() =>
    vendas.filter((v) => {
      const q = search.toLowerCase();
      return (
        String(v.id).includes(q) ||
        (v.cliente_nome || "").toLowerCase().includes(q) ||
        (v.vendedor_nome || "").toLowerCase().includes(q)
      );
    }), [vendas, search]
  );

  const confirmVenda = vendas.find((v) => v.id === confirmId);

  return (
    <div className="vendas-wrapper">
      <Sidebar />

      <div className="vendas-page">
        <header className="p-topbar">
          <div className="p-topbar-title">Vendas</div>
          <div className="p-topbar-actions">
            <button className="btn btn-primary" onClick={() => navigate("/vendas/novo")}>
              <IconPlus /> Nova Venda
            </button>
          </div>
        </header>

        <div className="p-content">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon si-yellow"><IconMoney /></div>
              <div className="stat-info">
                <p>Total em Vendas</p>
                <strong>{formatCurrency(stats.total_valor)}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-green"><IconCheck /></div>
              <div className="stat-info">
                <p>Pagas</p>
                <strong>{stats.pagas}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-red"><IconClock /></div>
              <div className="stat-info">
                <p>Pendentes</p>
                <strong>{stats.pendentes}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-blue"><IconChart /></div>
              <div className="stat-info">
                <p>Total de Vendas</p>
                <strong>{stats.total}</strong>
              </div>
            </div>
          </div>

          <div className="data-panel">
            <div className="dp-header">
              <h3>Lista de Vendas</h3>
              <div className="dp-header-right">
                <div className="dp-search">
                  <IconSearch />
                  <input
                    type="text"
                    placeholder="Buscar venda..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dp-loading">
                <div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div>
                <p>Carregando vendas...</p>
              </div>
            ) : lista.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><IconCart style={{ width: 32, height: 32 }} /></div>
                <p>Nenhuma venda encontrada.<br />Clique em <strong>Nova Venda</strong> para registrar.</p>
              </div>
            ) : (
              <div className="dp-table-wrap">
                <table className="dp-table dp-table-actions">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Vendedor</th>
                      <th>Valor</th>
                      <th>Data</th>
                      <th>Pagamento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((v) => (
                      <tr key={v.id}>
                        <td className="dp-cell-muted">{v.cliente_nome}</td>
                        <td className="dp-cell-muted">{v.vendedor_nome}</td>
                        <td className="dp-cell-mono"><strong>{formatCurrency(v.valor_total)}</strong></td>
                        <td className="dp-cell-muted">{formatDateTime(v.data_venda)}</td>
                        <td>
                          <span className={`status-badge ${getCorPagamento(v.status_pagamento?.cor || "neutro")}`}>
                            {v.status_pagamento?.label === "Aguardando pagamento"
                              ? "Aguardando pagamento"
                              : `${v.status_pagamento?.fracao} · ${v.status_pagamento?.label}`
                            }
                          </span>
                        </td>
                        <td>
                          <div className="dp-row-actions">
                            <button className="dp-btn-icon dp-view" title="Ver detalhes" onClick={() => navigate(`/vendas/${v.id}`)}>
                              <IconEye />
                            </button>
                            {isPendente(v) && (
                              <>
                                <button className="dp-btn-icon dp-edit" title="Editar" onClick={() => navigate(`/vendas/editar/${v.id}`)}>
                                  <IconEdit />
                                </button>
                                <button className="dp-btn-icon dp-del" title="Excluir" onClick={() => setConfirmId(v.id)}>
                                  <IconTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CONFIRMAÇÃO */}
      {confirmId !== null && (
        <div className="confirm-overlay open" onClick={() => setConfirmId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon"><IconTrash /></div>
            <h3>Excluir venda?</h3>
            <p>
              A venda de <strong>{confirmVenda?.cliente_nome}</strong> no valor de{" "}
              <strong>{formatCurrency(confirmVenda?.valor_total || 0)}</strong> e seus
              pagamentos vinculados serão removidos permanentemente.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast.visible ? " show" : ""}`}>
        <span className={`toast-dot ${toast.type}`} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}