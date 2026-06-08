import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconCart, IconCheck, IconChart, IconClock, IconMoney } from "../../components/ui/icons";
import "./vendas.css";
import "../../styles/data-panel.css";
import API_URL from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/format";

const API = `${API_URL}/api`; // ✅ Adicionado /api

interface Venda {
  id: number;
  cliente_nome: string;
  cliente_id: number;
  vendedor_nome: string;
  vendedor_id: number;
  valor_total: number;
  data_venda: string;
  status: number;
  status_texto: string;
}

const IconPlus = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// ✅ Função auxiliar para fetch com token
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err"; visible: boolean }>({ msg: "", type: "ok", visible: false });
  function show(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }
  return { toast, show };
}

export default function Vendas() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast, show: showToast } = useToast();

  async function fetchVendas() {
    try {
      setLoading(true);
      // ✅ Usando fetchWithAuth
      const res = await fetchWithAuth(`${API}/vendas`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

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
          status: v.status ?? 0,
          status_texto: v.status_texto || (v.status === 1 ? "Concluída" : "Pendente")
        }))
      );
    } catch (err) {
      console.error("Erro ao buscar vendas:", err);
      if (err instanceof Error) {
        showToast(`Erro ao carregar vendas: ${err.message}`, "err");
      } else {
        showToast("Erro ao carregar vendas. Verifique o backend.", "err");
      }
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVendas();
  }, []);

  const stats = useMemo(
    () => ({
      total: vendas.length,
      concluidas: vendas.filter((v) => v.status === 1).length,
      pendentes: vendas.filter((v) => v.status === 0).length,
      total_valor: vendas.reduce((acc, v) => acc + v.valor_total, 0)
    }),
    [vendas]
  );

  const lista = useMemo(
    () =>
      vendas.filter((v) => {
        const q = search.toLowerCase();
        return (
          String(v.id).includes(q) ||
          (v.cliente_nome || "").toLowerCase().includes(q) ||
          (v.vendedor_nome || "").toLowerCase().includes(q)
        );
      }),
    [vendas, search]
  );


  return (
    <div className="vendas-wrapper">
      <Sidebar />

      <div className="vendas-page">
        <header className="p-topbar">
          <div className="p-topbar-title">Vendas</div>

          <div className="p-topbar-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/vendas/novo")}
            >
              <IconPlus /> Nova Venda
            </button>
          </div>
        </header>

        <div className="p-content">
          {/* STATS */}
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
                <p>Concluídas</p>
                <strong>{stats.concluidas}</strong>
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

          {/* TABELA */}
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
              <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Vendedor</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {lista.map((v) => (
                    <tr key={v.id}>
                      <td className="dp-cell-muted">{v.cliente_nome}</td>
                      <td className="dp-cell-muted" data-label="Vendedor">{v.vendedor_nome}</td>
                      <td className="dp-cell-mono" data-label="Valor"><strong>{formatCurrency(v.valor_total)}</strong></td>
                      <td className="dp-cell-muted" data-label="Data">{formatDateTime(v.data_venda)}</td>
                      <td>
                        <span className={`badge ${v.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                          {v.status_texto}
                        </span>
                      </td>
                      <td>
                        <div className="dp-row-actions">
                          <button 
                            className="dp-btn-icon dp-view" 
                            title="Ver detalhes" 
                            onClick={() => navigate(`/vendas/${v.id}`)}
                          >
                            <IconEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>

      <div className={`toast${toast.visible ? " show" : ""}`}>
        <span className={`toast-dot ${toast.type}`} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}