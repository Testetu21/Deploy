import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconBuilding, IconClock, IconEye, IconPhone } from "../../components/ui/icons";
import "./fornecedores.css";
import "../../styles/data-panel.css";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`; // ✅ Adicionado /api

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

const IconPlus   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconSearch = () => <svg width="14" height="14" fill="none" stroke="#71797E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconDown   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

// ✅ Função auxiliar para fetch com token

const IconMail    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconMailOff = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>;
const IconFileDoc = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>;
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
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "del"; visible: boolean }>({ msg: "", type: "ok", visible: false });
  function show(msg: string, type: "ok" | "err" | "del" = "ok") {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }
  return { toast, show };
}

export default function Fornecedores() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false); // ✅ Adicionado estado deleting
  const { toast, show: showToast } = useToast();

  async function fetchFornecedores() {
    try {
      setLoading(true);
      // ✅ Usando fetchWithAuth
      const res = await fetchWithAuth(`${API}/fornecedores`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFornecedores(data.map((f: any) => ({
        id: f.id_fornecedor,
        nome: f.nome,
        telefone: f.telefone || "—",
        email: f.email || "—",
        endereco: f.endereco || "—",
      })));
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        showToast(`Erro ao carregar fornecedores: ${err.message}`, "err");
      } else {
        showToast("Erro ao carregar fornecedores. Verifique o backend.", "err");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFornecedores(); }, []);

  const stats = useMemo(() => ({
    total: fornecedores.length,
    comEmail: fornecedores.filter(f => f.email !== "—").length,
    comTel: fornecedores.filter(f => f.telefone !== "—").length,
    semEmail: fornecedores.filter(f => f.email === "—").length,
  }), [fornecedores]);

  const lista = useMemo(() =>
    fornecedores.filter(f => {
      const q = search.toLowerCase();
      return (
        (f.nome || "").toLowerCase().includes(q) ||
        (f.email || "").toLowerCase().includes(q) ||
        f.telefone.includes(q) ||
        true
      );
    }), [fornecedores, search]);

  // ✅ Exclusão corrigida com 2 etapas
  async function handleDelete() {
    if (!confirmId) return;
    
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/fornecedores/${confirmId}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        let message = "Erro ao remover fornecedor.";
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
      showToast("Fornecedor excluído com sucesso!", "del");
      await fetchFornecedores();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        showToast(err.message || "Erro ao remover fornecedor.", "err");
      } else {
        showToast("Erro ao remover fornecedor.", "err");
      }
    } finally {
      setDeleting(false);
    }
  }

  function exportCSV() {
    const headers = ["Nome", "Telefone", "E-mail"];
    const rows = fornecedores.map(f => [f.nome, f.telefone, f.email, f.endereco]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "fornecedores.csv";
    a.click();
    showToast("CSV exportado!", "ok");
  }

  // ✅ Função para fechar o modal
  const handleCloseModal = () => {
    setConfirmId(null);
    setDeleting(false);
  };

  const confirmFornecedor = fornecedores.find(f => f.id === confirmId);

  return (
    <div className="fornecedores-wrapper">
      <Sidebar />
      <div className="fornecedores-page">
        <header className="p-topbar">
          <div className="p-topbar-title">Fornecedores</div>
          <div className="p-topbar-actions">
            
            <button className="btn btn-primary" onClick={() => navigate("/fornecedores/novo")}><IconPlus /> Novo Fornecedor</button>
          </div>
        </header>

        <div className="p-content">
          <div className="stats-row">
            <div className="stat-card"><div className="stat-icon si-yellow"><IconBuilding /></div><div className="stat-info"><p>Total de Fornecedores</p><strong>{stats.total}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-blue"><IconMail /></div><div className="stat-info"><p>Com E-mail</p><strong>{stats.comEmail}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-green"><IconPhone /></div><div className="stat-info"><p>Com Telefone</p><strong>{stats.comTel}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-purple"><IconMailOff /></div><div className="stat-info"><p>Sem E-mail</p><strong>{stats.semEmail}</strong></div></div>
          </div>

          <div className="data-panel">
            <div className="dp-header">
              <h3>Cadastro de Fornecedores</h3>
              <div className="dp-header-right">
                <div className="dp-search">
                  <IconSearch />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar fornecedor..." />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dp-loading"><div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div><p>Carregando fornecedores...</p></div>
            ) : lista.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><IconBuilding style={{ width: 32, height: 32 }} /></div>
                <p>Nenhum fornecedor encontrado.<br />Clique em <strong>Novo Fornecedor</strong> para cadastrar.</p>
              </div>
            ) : (
              <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
                <thead>
                  <tr>
                    <th>Nome</th><th>Telefone</th><th>E-mail</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(f => (
                    <tr key={f.id}>
                      <td className="dp-cell-muted">{f.nome}</td>
                      <td className="dp-cell-muted" data-label="Telefone">{f.telefone}</td>
                      <td className="dp-cell-muted" data-label="E-mail">{f.email}</td>
                      
                      <td>
                        <div className="dp-row-actions">
                          <button
                            className="dp-btn-icon dp-view"
                            title="Ver detalhes"
                            onClick={() => navigate("/detalhes", { state: { title: "Fornecedor", data: f, from: "/fornecedores" } })}
                          >
                            <IconEye />
                          </button>
                          <button className="dp-btn-icon dp-edit" title="Editar" onClick={() => navigate(`/fornecedores/editar/${f.id}`)}><IconEdit /></button>
                          <button className="dp-btn-icon dp-del" title="Remover" onClick={() => setConfirmId(f.id)}><IconTrash /></button>
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

      <ConfirmDialog
        open={confirmId !== null}
        title="Remover fornecedor?"
        message={<>"{confirmFornecedor?.nome || 'Fornecedor'}" será removido permanentemente.</>}
        confirmLabel={deleting ? "Removendo..." : "Sim, remover"}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={handleCloseModal}
      />

      <div className={`toast${toast.visible ? " show" : ""}`}><span className={`toast-dot ${toast.type}`} /><span>{toast.msg}</span></div>
    </div>
  );
}