import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconAlert, IconCheck, IconClock, IconEdit, IconEye, IconMoney, IconPlus, IconSearch, IconTrash } from "../../components/ui/icons";
import "./Pagamentos.css";
import "../../styles/data-panel.css";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import API_URL from "../../utils/api";
import { formatCurrency, formatDate } from "../../utils/format";

const API = `${API_URL}/api`;

interface Pagamento {
  id_pagamento: number;
  id_venda: number | null;
  id_ordem_servico: number | null;
  id_cliente: number;
  cliente_nome: string;
  valor: number;
  forma_pagamento: string;
  parcelas: number;
  status: string;
  data_pagamento: string | null;
  data_vencimento: string;
  descricao: string;
}

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
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "del"; visible: boolean }>({
    msg: "", type: "ok", visible: false
  });

  function show(msg: string, type: "ok" | "err" | "del" = "ok") {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  return { toast, show };
}

// ── Calcula se um pagamento pendente está atrasado ────────────────────────────
function isAtrasado(p: Pagamento) {
  if (p.status !== 'pendente') return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(p.data_vencimento);
  return venc < hoje;
}

// ── Status "visual" (inclui atrasado calculado) ────────────────────────────────
function getStatusVisual(p: Pagamento): string {
  if (isAtrasado(p)) return 'atrasado';
  return p.status;
}

function getStatusBadge(status: string): string {
  const statusMap: Record<string, string> = {
    'pago': 'status-paid',
    'pendente': 'status-pending',
    'cancelado': 'status-cancelled',
    'atrasado': 'status-overdue'
  };
  return statusMap[status] || 'status-pending';
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pago': 'Pago',
    'pendente': 'Pendente',
    'cancelado': 'Cancelado',
    'atrasado': 'Atrasado'
  };
  return statusMap[status] || status;
}

function getFormaPagamentoText(forma: string): string {
  const formaMap: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'cartao_credito': 'Cartão Crédito',
    'cartao_debito': 'Cartão Débito',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'transferencia': 'Transferência'
  };
  return formaMap[forma] || forma;
}

export default function Pagamentos() {
  const navigate = useNavigate();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, show: showToast } = useToast();

  async function fetchPagamentos() {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/pagamentos`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPagamentos(Array.isArray(data) ? data.map((p: any) => ({
        id_pagamento: p.id_pagamento,
        id_venda: p.id_venda ?? null,
        id_ordem_servico: p.id_ordem_servico ?? null,
        id_cliente: p.id_cliente,
        cliente_nome: p.cliente_nome || "—",
        valor: Number(p.valor) || 0,
        forma_pagamento: p.forma_pagamento || "",
        parcelas: Number(p.parcelas) || 1,
        status: (p.status || "pendente").toString().toLowerCase(),
        data_pagamento: p.data_pagamento || null,
        data_vencimento: p.data_vencimento || "",
        descricao: p.descricao || "",
      })) : []);
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar pagamentos", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const stats = useMemo(() => {
    const pendentesReais = pagamentos.filter(p => p.status === 'pendente' && !isAtrasado(p));
    const atrasados      = pagamentos.filter(p => isAtrasado(p));
    const pagos          = pagamentos.filter(p => p.status === 'pago');

    return {
      total: pagamentos.length,
      totalValor: pagamentos.reduce((sum, p) => sum + p.valor, 0),
      pendentes: pendentesReais.length,
      pagos: pagos.length,
      atrasados: atrasados.length,
      totalPendente: pendentesReais.reduce((sum, p) => sum + p.valor, 0),
      totalPago: pagos.reduce((sum, p) => sum + p.valor, 0),
      totalAtrasado: atrasados.reduce((sum, p) => sum + p.valor, 0),
    };
  }, [pagamentos]);

  const lista = useMemo(() => {
    let filtered = pagamentos.filter(p => {
      const s = search.toLowerCase();
      return (
        p.cliente_nome?.toLowerCase().includes(s) ||
        String(p.id_pagamento).includes(s) ||
        p.descricao?.toLowerCase().includes(s)
      );
    });

    if (filterStatus !== 'todos') {
      filtered = filtered.filter(p => getStatusVisual(p) === filterStatus);
    }

    return filtered;
  }, [pagamentos, search, filterStatus]);

  async function handleDelete() {
    if (!confirmId) return;

    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/pagamentos/${confirmId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      setConfirmId(null);
      showToast("Pagamento excluído com sucesso!", "del");
      await fetchPagamentos();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Erro ao remover pagamento", "err");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBaixarPagamento(id_pagamento: number) {
    try {
      const res = await fetchWithAuth(`${API}/pagamentos/${id_pagamento}`, {
        method: "PUT",
        body: JSON.stringify({ status: 'pago' })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao baixar pagamento');
      }

      showToast("Pagamento baixado com sucesso!", "ok");

      setPagamentos(prev =>
        prev.map(p =>
          p.id_pagamento === id_pagamento
            ? { ...p, status: 'pago', data_pagamento: new Date().toISOString() }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Erro ao baixar pagamento", "err");
    }
  }

  function exportCSV() {
    const headers = ["ID", "Cliente", "Valor", "Forma Pagamento", "Status", "Vencimento", "Descrição"];
    const rows = lista.map(p => [
      p.id_pagamento,
      p.cliente_nome,
      formatCurrency(p.valor),
      getFormaPagamentoText(p.forma_pagamento),
      getStatusText(getStatusVisual(p)),
      formatDate(p.data_vencimento),
      p.descricao || ""
    ]);

    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "pagamentos.csv";
    a.click();
    showToast("CSV exportado!", "ok");
  }

  const handleCloseModal = () => {
    setConfirmId(null);
    setDeleting(false);
  };

  const confirmPagamento = pagamentos.find(p => p.id_pagamento === confirmId);

  return (
    <div className="pagamentos-wrapper">
      <Sidebar />
      <div className="pagamentos-page">
        <header className="p-topbar">
          <div className="p-topbar-title">Pagamentos</div>
          <div className="p-topbar-actions">
            <button className="btn btn-primary" onClick={() => navigate("/pagamentos/novo")}>
              <IconPlus /> Novo Pagamento
            </button>
          </div>
        </header>

        <div className="p-content">
          {/* Stats Cards */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon si-blue"><IconMoney /></div>
              <div className="stat-info">
                <p>Total em Pagamentos</p>
                <strong>{formatCurrency(stats.totalValor)}</strong>
                <small>{stats.total} registros</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-yellow"><IconClock /></div>
              <div className="stat-info">
                <p>Pendentes</p>
                <strong>{formatCurrency(stats.totalPendente)}</strong>
                <small>{stats.pendentes} pendentes</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-green"><IconCheck /></div>
              <div className="stat-info">
                <p>Pagos</p>
                <strong>{formatCurrency(stats.totalPago)}</strong>
                <small>{stats.pagos} pagos</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-red"><IconAlert /></div>
              <div className="stat-info">
                <p>Atrasados</p>
                <strong>{formatCurrency(stats.totalAtrasado)}</strong>
                <small>{stats.atrasados} atrasados</small>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="data-panel">
            <div className="dp-header">
              <h3>Lista de Pagamentos</h3>
              <div className="dp-header-right">
                <div className="filter-group">
                  <select
                    className="dp-select"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="todos">Todos os status</option>
                    <option value="pendente">Pendentes</option>
                    <option value="pago">Pagos</option>
                    <option value="atrasado">Atrasados</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                  <div className="dp-search">
                    <IconSearch />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar por cliente, ID..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dp-loading">
                <div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div>
                <p>Carregando pagamentos...</p>
              </div>
            ) : lista.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><IconMoney style={{ width: 32, height: 32 }} /></div>
                <p>
                  Nenhum pagamento encontrado.<br />
                  Clique em <strong>Novo Pagamento</strong> para registrar uma despesa.
                </p>
              </div>
            ) : (
              <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Forma</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(p => {
                    const statusVisual = getStatusVisual(p);
                    return (
                      <tr key={p.id_pagamento}>
                        <td className="dp-cell-muted">{p.cliente_nome}</td>
                        <td className="dp-cell-mono" data-label="Valor">{formatCurrency(p.valor)}</td>
                        <td className="dp-cell-muted" data-label="Forma">{getFormaPagamentoText(p.forma_pagamento)}</td>
                        <td className="dp-cell-muted" data-label="Vencimento">{formatDate(p.data_vencimento)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadge(statusVisual)}`}>
                            {getStatusText(statusVisual)}
                          </span>
                        </td>
                        <td>
                          <div className="dp-row-actions">
                            <button
                              className="dp-btn-icon dp-view"
                              title="Ver detalhes"
                              onClick={() => navigate("/detalhes", { state: { title: "Pagamento", data: p } })}
                            >
                              <IconEye />
                            </button>
                            {p.status === 'pendente' && (
                              <button
                                className="icon-btn success"
                                title="Dar baixa"
                                onClick={() => handleBaixarPagamento(p.id_pagamento)}
                              >
                                <IconCheck />
                              </button>
                            )}
                            <button
                              className="dp-btn-icon dp-edit"
                              title="Editar"
                              onClick={() => navigate(`/pagamentos/editar/${p.id_pagamento}`)}
                            >
                              <IconEdit />
                            </button>
                            <button
                              className="dp-btn-icon dp-del"
                              title="Remover"
                              onClick={() => setConfirmId(p.id_pagamento)}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="Remover pagamento?"
        message={
          <>Pagamento de <strong>{confirmPagamento ? formatCurrency(confirmPagamento.valor) : ''}</strong> referente a <strong>{confirmPagamento?.descricao}</strong> será removido.</>
        }
        confirmLabel={deleting ? "Removendo..." : "Sim, remover"}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={handleCloseModal}
      />

      <div className={`toast${toast.visible ? " show" : ""}`}>
        <span className={`toast-dot ${toast.type}`} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}