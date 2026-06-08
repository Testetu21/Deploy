import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconAlert, IconCart, IconCheck, IconClock, IconDown, IconEdit, IconEye, IconMoney, IconPlus, IconSearch, IconTrash } from "../../components/ui/icons";
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

interface Parcela {
  id_parcela: number;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
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
  const [parcelas, setParcelas] = useState<Record<number, Parcela[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewParcelasId, setViewParcelasId] = useState<number | null>(null);
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

  async function fetchParcelas(id_pagamento: number) {
    if (parcelas[id_pagamento]) return;
    
    try {
      const res = await fetchWithAuth(`${API}/pagamentos/${id_pagamento}/parcelas`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setParcelas(prev => ({ ...prev, [id_pagamento]: data }));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const stats = useMemo(() => {
    const totalPendente = pagamentos
      .filter(p => p.status === 'pendente')
      .reduce((sum, p) => sum + p.valor, 0);
    
    const totalPago = pagamentos
      .filter(p => p.status === 'pago')
      .reduce((sum, p) => sum + p.valor, 0);
    
    const totalAtrasado = pagamentos
      .filter(p => p.status === 'atrasado')
      .reduce((sum, p) => sum + p.valor, 0);
    
    return {
      total: pagamentos.length,
      totalValor: pagamentos.reduce((sum, p) => sum + p.valor, 0),
      pendentes: pagamentos.filter(p => p.status === 'pendente').length,
      pagos: pagamentos.filter(p => p.status === 'pago').length,
      atrasados: pagamentos.filter(p => p.status === 'atrasado').length,
      totalPendente,
      totalPago,
      totalAtrasado
    };
  }, [pagamentos]);

  const lista = useMemo(() => {
    let filtered = pagamentos.filter(p => {
      const q = search.toLowerCase();
      return (
        p.cliente_nome?.toLowerCase().includes(q) ||
        String(p.id_pagamento).includes(q) ||
        p.descricao?.toLowerCase().includes(q)
      );
    });
    
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(p => p.status === filterStatus);
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
    const res = await fetchWithAuth(`${API}/pagamentos/${id_pagamento}/baixar`, {
      method: "PUT"
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao baixar pagamento');
    }
    
    showToast("Pagamento baixado com sucesso!", "ok");
    
    // 🔥 CORRIGIDO: status como string 'pago'
    setPagamentos(prevPagamentos => 
      prevPagamentos.map(pagamento => 
        pagamento.id_pagamento === id_pagamento 
          ? { 
              ...pagamento, 
              status: 'pago',  // ← string, não número 1
              data_pagamento: new Date().toISOString()
            }
          : pagamento
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
      getStatusText(p.status),
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
          <div className="p-topbar-title">
          </div>
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
                <p>Recebidos</p>
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
                  Clique em <strong>Novo Pagamento</strong> para registrar um recebimento.
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
                  {lista.map(p => (
                    <tr key={p.id_pagamento}>
                      <td className="dp-cell-muted">{p.cliente_nome}</td>
                      <td className="dp-cell-mono" data-label="Valor">{formatCurrency(p.valor)}</td>
                      <td className="dp-cell-muted" data-label="Forma">{getFormaPagamentoText(p.forma_pagamento)}</td>
                      <td className="dp-cell-muted" data-label="Vencimento">{formatDate(p.data_vencimento)}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(p.status)}`}>
                          {getStatusText(p.status)}
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
                          {p.parcelas > 1 && (
                            <button 
                              className="dp-btn-icon dp-parcelas" 
                              title="Ver parcelas" 
                              onClick={() => {
                                setViewParcelasId(p.id_pagamento);
                                fetchParcelas(p.id_pagamento);
                              }}
                            >
                              <IconEye />
                            </button>
                          )}
                          {p.status === 'pendente' && (
                            <button 
                              className="icon-btn success" 
                              title="Baixar pagamento" 
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
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Parcelas */}
      {viewParcelasId !== null && (
      <div 
        className="modal-overlay open"
        onClick={() => setViewParcelasId(null)}
      >
        <div className="parcelas-modal" onClick={e => e.stopPropagation()}>
          <h3><IconCart style={{ width: 18, height: 18, verticalAlign: "-3px" }} /> Parcelas do Pagamento #{viewParcelasId}</h3>
          {viewParcelasId && parcelas[viewParcelasId] && (
            <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
              <thead>
                <tr>
                  <th>Parcela</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Data Pagamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {parcelas[viewParcelasId].map(parcela => (
                  <tr key={parcela.id_parcela}>
                    <td>{parcela.numero_parcela}/{pagamentos.find(p => p.id_pagamento === viewParcelasId)?.parcelas}</td>
                    <td>{formatCurrency(parcela.valor)}</td>
                    <td>{formatDate(parcela.data_vencimento)}</td>
                    <td>{parcela.data_pagamento ? formatDate(parcela.data_pagamento) : '—'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(parcela.status)}`}>
                        {getStatusText(parcela.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setViewParcelasId(null)}>
              Fechar
            </button>
          </div>
        </div>
      </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Remover pagamento?"
        message={
          <>Pagamento de <strong>{confirmPagamento ? formatCurrency(confirmPagamento.valor) : ''}</strong> do cliente <strong>{confirmPagamento?.cliente_nome}</strong> será removido.</>
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