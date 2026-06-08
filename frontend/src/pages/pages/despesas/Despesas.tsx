import "../../utils/toast";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconClock, IconMoney, IconCheck, IconAlert, IconEye, IconTrash } from "../../components/ui/icons";
import "./Despesas.css";
import "../../styles/data-panel.css";
import API_URL from "../../utils/api";
import { formatCurrency, formatDate } from "../../utils/format";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const API = `${API_URL}/api`;

interface Despesa {
  id_despesa: number;
  descricao: string;
  valor: number;
  status?: string;
  data?: string;
  id_ref?: string;
}

// ── Ícones ──────────────────────────────────────────────────────────────────
const IconPlus   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconSearch = () => <svg width="14" height="14" fill="none" stroke="#71797E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCheckCircle = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

// ── Auth fetch ───────────────────────────────────────────────────────────────
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "del"; visible: boolean }>({ msg: "", type: "ok", visible: false });
  function show(msg: string, type: "ok" | "err" | "del" = "ok") {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }
  return { toast, show };
}

function getStatusMeta(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "pago")     return { label: "Confirmado", className: "is-paid" };
  if (s === "pendente") return { label: "Pendente", className: "is-pending" };
  return { label: status || "—", className: "is-neutral" };
}

function normalizeIdString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits ? digits : null;
}

function toSafeNumber(value: string | null): number | null {
  if (!value) return null;
  if (value.length > 15) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Despesas() {
  const navigate = useNavigate();
  const [despesas, setDespesas]   = useState<Despesa[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [confirmId, setConfirmId] = useState<number | string | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const { toast, show: showToast } = useToast();

  async function fetchDespesas() {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/despesas`);
      if (!res.ok) {
        if (res.status === 401) { alert("Sessão expirada, faça login novamente"); navigate("/login"); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setDespesas([]);
        return;
      }

      const unique = new Map<string, Despesa>();

      data.forEach((d: any, index: number) => {
        const rawId = d.id_despesa ?? d.id ?? d.ID ?? d.ID_DESPESA ?? d.idDespesa;
        const idRef = normalizeIdString(rawId);
        const idSafe = toSafeNumber(idRef);
        const item: Despesa = {
          id_despesa: idSafe ?? -(index + 1),
          descricao: d.descricao || "",
          valor: Number(d.valor) || 0,
          status: (d.status || "pendente").toString().toLowerCase(),
          data: d.data || "",
          id_ref: idRef || undefined,
        };

        const key = idRef
          ? `id:${idRef}`
          : `cmp:${item.descricao}|${item.valor}|${item.status}|${item.data}`;

        unique.set(key, item);
      });

      setDespesas([...unique.values()]);
    } catch (err) {
      if (err instanceof Error) showToast(`Erro ao carregar despesas: ${err.message}`, "err");
      else showToast("Erro ao carregar despesas. Verifique o backend.", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDespesas(); }, []);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     despesas.reduce((s, d) => s + (d.valor || 0), 0),
    pagas:     despesas.filter(d => (d.status || "").toLowerCase() === "pago").reduce((s, d) => s + (d.valor || 0), 0),
    pendentes: despesas.filter(d => (d.status || "").toLowerCase() === "pendente").reduce((s, d) => s + (d.valor || 0), 0),
    qtdPend:   despesas.filter(d => (d.status || "").toLowerCase() === "pendente").length,
  }), [despesas]);

  // ── Filtro ───────────────────────────────────────────────────────────────
  const lista = useMemo(() =>
    despesas.filter(d => {
      const q = search.toLowerCase();
      return (
        (d.descricao || "").toLowerCase().includes(q) ||
        (d.status    || "").toLowerCase().includes(q) ||
        formatDate(d.data).includes(q)
      );
    }), [despesas, search]);

  // ── Confirmar como pago ───────────────────────────────────────────────────
  async function handleConfirmar(id: number | string) {
    try {
      const res = await fetchWithAuth(`${API}/despesas/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "pago" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erro ao confirmar despesa.");
      }
      showToast("Despesa confirmada como paga!", "ok");
      await fetchDespesas();
    } catch (err) {
      if (err instanceof Error) showToast(err.message, "err");
      else showToast("Erro ao confirmar despesa.", "err");
    }
  }

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/despesas/${confirmId}`, { method: "DELETE" });
      if (!res.ok) {
        let message = "Erro ao excluir despesa.";
        try {
          const data = await res.json();
          message = data?.error || message;
        } catch {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }
      setConfirmId(null);
      showToast("Despesa excluída com sucesso!", "del");
      await fetchDespesas();
    } catch (err) {
      if (err instanceof Error) showToast(err.message || "Erro ao excluir despesa.", "err");
      else showToast("Erro ao excluir despesa.", "err");
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="despesas-wrapper">
      <Sidebar />

      <div className="despesas-page">

        {/* Topbar */}
        <header className="p-topbar">
          <div className="p-topbar-title">Despesas</div>
          <div className="p-topbar-actions">
            <button className="btn btn-primary" onClick={() => navigate("/despesas/novo")}>
              <IconPlus /> Nova Despesa
            </button>
          </div>
        </header>

        <div className="p-content">

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon si-yellow"><IconMoney /></div>
              <div className="stat-info">
                <p>Total Lançado</p>
                <strong>{formatCurrency(stats.total)}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon si-green"><IconCheck /></div>
              <div className="stat-info">
                <p>Total Pago</p>
                <strong>{formatCurrency(stats.pagas)}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon si-red"><IconAlert /></div>
              <div className="stat-info">
                <p>A Pagar</p>
                <strong>{formatCurrency(stats.pendentes)}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon si-blue"><IconClock /></div>
              <div className="stat-info">
                <p>Pendentes</p>
                <strong>{stats.qtdPend}</strong>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="data-panel">
            <div className="dp-header">
              <h3>Lista de Despesas</h3>
              <div className="dp-header-right">
                <div className="dp-search">
                  <IconSearch />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar despesa..."
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dp-loading">
                <div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div>
                <p>Carregando despesas...</p>
              </div>
            ) : lista.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><IconMoney style={{ width: 32, height: 32 }} /></div>
                <p>Nenhuma despesa encontrada.<br />Clique em <strong>Nova Despesa</strong> para cadastrar.</p>
              </div>
            ) : (
              <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((d, index) => {
                    const sm = getStatusMeta(d.status);
                    const effectiveId = d.id_ref || normalizeIdString(
                      d.id_despesa ?? (d as any).id ?? (d as any).ID ?? (d as any).ID_DESPESA ?? (d as any).idDespesa
                    );
                    const hasId = !!effectiveId;
                    return (
                      <tr key={d.id_despesa ?? `despesa-${index}`}>
                        <td className="dp-cell-muted">{d.descricao}</td>
                        <td className="dp-cell-mono" data-label="Valor">- {formatCurrency(d.valor)}</td>
                        <td className="dp-cell-muted" data-label="Data">{formatDate(d.data)}</td>
                        <td>
                          <span className={`dp-badge dp-badge-${sm.className.replace("is-", "")}`}>{sm.label}</span>
                        </td>
                        <td>
                          <div className="dp-row-actions">
                            <button
                              className="dp-btn-icon dp-view"
                              title="Ver detalhes"
                              onClick={() => navigate("/detalhes", { state: { title: "Despesa", data: d, from: "/despesas" } })}
                            >
                              <IconEye />
                            </button>
                            <button
                              className="dp-btn-icon dp-edit"
                              title="Editar"
                              onClick={() => {
                                if (!hasId) {
                                  showToast("Despesa sem código válido para editar.", "err");
                                  return;
                                }
                                navigate(`/despesas/editar/${effectiveId}`);
                              }}
                            >
                              <IconEdit />
                            </button>
                            <button
                              className="dp-btn-icon dp-del"
                              title="Excluir"
                              onClick={() => {
                                if (!hasId) {
                                  showToast("Despesa sem código válido para excluir.", "err");
                                  return;
                                }
                                setConfirmId(effectiveId);
                              }}
                            >
                              <IconTrash />
                            </button>
                            {d.status !== "pago" && (
                              <button
                                className="dp-btn-icon dp-ok"
                                title="Confirmar pagamento"
                                onClick={() => {
                                  if (!hasId) {
                                    showToast("Despesa sem código válido para confirmar.", "err");
                                    return;
                                  }
                                  handleConfirmar(effectiveId);
                                }}
                              >
                                <IconCheckCircle />
                              </button>
                            )}
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

      {/* Toast */}
      <div className={`toast${toast.visible ? " show" : ""}`}>
        <span className={`toast-dot ${toast.type}`} />
        <span>{toast.msg}</span>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="Excluir despesa?"
        message="Essa ação é permanente. Deseja continuar?"
        confirmLabel={deleting ? "Excluindo..." : "Sim, excluir"}
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmId(null); setDeleting(false); }}
      />
    </div>
  );
}
