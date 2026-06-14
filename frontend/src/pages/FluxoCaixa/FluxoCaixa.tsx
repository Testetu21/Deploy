import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import {
  IconAlert,
  IconCard,
  IconCheck,
  IconClock,
  IconDown,
  IconEdit,
  IconEye,
  IconMoney,
  IconPlus,
  IconSearch,
  IconTrash,
} from "../../components/ui/icons";
import "./FluxoCaixa.css";
import "../../styles/data-panel.css";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  formatCurrency,
  formatDate,
  formatDate as fmtDate,
} from "../../utils/format";
import API_URL from "../../utils/api";
import { getUser } from "../../utils/auth";

const API = `${API_URL}/api`;

interface Caixa {
  id_caixa: number;
  data: string;
  valor_abertura: number;
  valor_fechamento: number | null;
  saldo: number;
  id_funcionario: number;
  funcionario_nome?: string;
}

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

function useToast() {
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err" | "del";
    visible: boolean;
  }>({ msg: "", type: "ok", visible: false });
  function show(msg: string, type: "ok" | "err" | "del" = "ok") {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }
  return { toast, show };
}



export default function FluxoCaixa() {
  const navigate = useNavigate();

  const user = getUser();
  const nivel = Number(user?.nivel ?? 0);
  const isCaixa = nivel === 5;
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, show: showToast } = useToast();
  const [caixaSelecionado, setCaixaSelecionado] = useState<number | null>(null);

  async function fetchCaixas() {
    try {
      setLoading(true);
      const url = isCaixa ? `${API}/caixa/meus` : `${API}/caixa`;
      const res = await fetchWithAuth(url);
      console.log("URL usada:", url);
      console.log("isCaixa:", isCaixa, "nivel:", nivel);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("Dados recebidos:", data);
      setCaixas(
        Array.isArray(data)
          ? data.map((c: any) => ({
            id_caixa: c.id_caixa,
            data: c.data,
            valor_abertura: parseFloat(c.valor_abertura) || 0,
            valor_fechamento: c.valor_fechamento != null ? parseFloat(c.valor_fechamento) : null,
            saldo: parseFloat(c.saldo_atual) || 0,
            id_funcionario: c.id_funcionario,
            funcionario_nome: c.funcionario_nome || `ID: ${c.id_funcionario}`,
          }))
          : []
      );
    } catch (err) {
      showToast("Erro ao carregar caixas.", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCaixas();
  }, []);

  const stats = useMemo(() => {
    const caixasAbertos = caixas.filter(
      (c) => c.valor_fechamento === null,
    ).length;
    const caixasFechados = caixas.filter(
      (c) => c.valor_fechamento !== null,
    ).length;
    const saldoTotal = caixas.reduce((sum, c) => sum + c.saldo, 0);
    const aberturaTotal = caixas.reduce((sum, c) => sum + c.valor_abertura, 0);

    return {
      total: caixas.length,
      abertos: caixasAbertos,
      fechados: caixasFechados,
      saldoTotal,
      aberturaTotal,
    };
  }, [caixas]);

  // POR isso:
  const hasOpenCaixa = caixas.some(
    c => c.valor_fechamento === null && c.id_funcionario === user?.id_funcionario
  );

  const lista = useMemo(
    () =>
      caixas
        .filter(c => caixaSelecionado === null || c.id_caixa === caixaSelecionado)
        .filter((c) => {
          const q = search.toLowerCase();
          return (
            formatDate(c.data).toLowerCase().includes(q) ||
            String(c.id_caixa).includes(q) ||
            c.funcionario_nome?.toLowerCase().includes(q) ||
            false
          );
        }),
    [caixas, search, caixaSelecionado],
  );

  async function handleDelete() {
    if (!confirmId) return;

    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/caixa/${confirmId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      setConfirmId(null);
      showToast("Registro de caixa removido com sucesso!", "del");
      await fetchCaixas();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        showToast(err.message || "Erro ao remover registro.", "err");
      } else {
        showToast("Erro ao remover registro.", "err");
      }
    } finally {
      setDeleting(false);
    }
  }

  function exportCSV() {
    const headers = [
      "ID",
      "Data",
      "Valor Abertura",
      "Valor Fechamento",
      "Saldo",
      "ID Funcionário",
      "Funcionário",
    ];
    const rows = caixas.map((c) => [
      c.id_caixa,
      formatDate(c.data),
      formatCurrency(c.valor_abertura),
      c.valor_fechamento ? formatCurrency(c.valor_fechamento) : "Em aberto",
      formatCurrency(c.saldo),
      c.id_funcionario,
      c.funcionario_nome || `ID: ${c.id_funcionario}`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    a.download = "fluxo_caixa.csv";
    a.click();
    showToast("CSV exportado!", "ok");
  }

  const handleCloseModal = () => {
    setConfirmId(null);
    setDeleting(false);
  };

  const confirmCaixa = caixas.find((c) => c.id_caixa === confirmId);

  return (
    <div className="fornecedores-wrapper">
      <Sidebar />
      <div className="fornecedores-page">
        <header className="p-topbar">
          <div className="p-topbar-title">Fluxo de Caixa</div>
          <div className="p-topbar-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                if (hasOpenCaixa) {
                  showToast("Você já possui um caixa aberto. Feche-o antes de abrir outro.", "err");
                  return;
                }
                navigate("/caixa/novo");
              }}
            >
              <IconPlus /> Novo Registro
            </button>
          </div>
        </header>

        {/* Cards de seleção de caixa — só admin/gerente */}
        {!isCaixa && caixas.length > 0 && (
          <div style={{ padding: "16px 24px 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
            {caixas.map(c => (
              <button
                key={c.id_caixa}
                onClick={() => setCaixaSelecionado(caixaSelecionado === c.id_caixa ? null : c.id_caixa)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "2px solid",
                  borderColor: caixaSelecionado === c.id_caixa ? "#6366f1" : "#e4e4e7",
                  background: caixaSelecionado === c.id_caixa ? "#eef2ff" : "#fff",
                  color: caixaSelecionado === c.id_caixa ? "#6366f1" : "#667085",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  Caixa #{c.id_caixa} — {c.funcionario_nome}
                </div>
                <div style={{ fontSize: 11, marginTop: 2, color: caixaSelecionado === c.id_caixa ? "#6366f1" : "#aaa" }}>
                  {formatDate(c.data)} · {c.valor_fechamento === null ? "Aberto" : "Fechado"}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="p-content">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon si-yellow">
                <IconMoney />
              </div>
              <div className="stat-info">
                <p>Total de Registros</p>
                <strong>{stats.total}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-green">
                <IconCheck />
              </div>
              <div className="stat-info">
                <p>Caixas Abertos</p>
                <strong>{stats.abertos}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-red">
                <IconAlert />
              </div>
              <div className="stat-info">
                <p>Caixas Fechados</p>
                <strong>{stats.fechados}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-blue">
                <IconCard />
              </div>
              <div className="stat-info">
                <p>Saldo Total</p>
                <strong>{formatCurrency(stats.saldoTotal)}</strong>
              </div>
            </div>
          </div>

          <div className="data-panel">
            <div className="dp-header">
              <h3>Registros de Fluxo de Caixa</h3>
              <div className="dp-header-right">
                <div className="dp-search">
                  <IconSearch />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por data, funcionário ou ID..."
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dp-empty">
                <div className="dp-empty-icon">
                  <IconClock style={{ width: 32, height: 32 }} />
                </div>
                <p>Carregando registros...</p>
              </div>
            ) : lista.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon">
                  <IconMoney style={{ width: 32, height: 32 }} />
                </div>
                <p>
                  Nenhum registro de caixa encontrado.
                  <br />
                  Clique em <strong>Novo Registro</strong> para iniciar um novo
                  caixa.
                </p>
              </div>
            ) : (
              <div className="dp-table-wrap">
                <table className="dp-table dp-table-actions">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Valor Abertura</th>
                      <th>Valor Fechamento</th>
                      <th>Saldo</th>
                      <th>Funcionário</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((c) => (
                      <tr key={c.id_caixa}>
                        <td className="dp-cell-muted">{formatDate(c.data)}</td>
                        <td className="dp-cell-muted" data-label="Abertura">
                          {formatCurrency(c.valor_abertura)}
                        </td>
                        <td className="dp-cell-muted" data-label="Fechamento">
                          {c.valor_fechamento
                            ? formatCurrency(c.valor_fechamento)
                            : "—"}
                        </td>
                        <td
                          className={`td-saldo ${c.saldo >= 0 ? "positive" : "negative"}`}
                          data-label="Saldo"
                        >
                          {formatCurrency(c.saldo)}
                        </td>
                        <td className="dp-cell-muted" data-label="Funcionário">
                          {c.funcionario_nome || `ID: ${c.id_funcionario}`}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${c.valor_fechamento === null ? "status-open" : "status-closed"}`}
                          >
                            {c.valor_fechamento === null ? "Aberto" : "Fechado"}
                          </span>
                        </td>
                        <td>
                          <div className="dp-row-actions">
                            <button
                              className="dp-btn-icon dp-view"
                              title="Ver detalhes"
                              onClick={() =>
                                navigate("/detalhes", {
                                  state: { title: "Caixa", data: c },
                                })
                              }
                            >
                              <IconEye />
                            </button>
                            <button
                              className="dp-btn-icon dp-edit"
                              title="Editar"
                              onClick={() =>
                                navigate(`/caixa/editar/${c.id_caixa}`)
                              }
                            >
                              <IconEdit />
                            </button>
                            <button
                              className="dp-btn-icon dp-del"
                              title="Remover"
                              onClick={() => setConfirmId(c.id_caixa)}
                            >
                              <IconTrash />
                            </button>
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

      <ConfirmDialog
        open={confirmId !== null}
        title="Remover registro de caixa?"
        message={
          <>
            Registro do dia{" "}
            <strong>{confirmCaixa ? fmtDate(confirmCaixa.data) : ""}</strong>{" "}
            será removido permanentemente.
          </>
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
