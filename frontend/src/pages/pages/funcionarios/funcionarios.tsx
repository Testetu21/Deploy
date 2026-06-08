import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconAlert, IconCheck, IconClock, IconEye, IconUsers } from "../../components/ui/icons";
import "./funcionarios.css";
import "../../styles/data-panel.css";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { formatCurrency, formatPercent } from "../../utils/format";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`; // ✅ Adicionado /api

interface Funcionario {
  id: number;
  nome: string;
  cargo: number;
  nome_cargo: string;
  salario: number;
  percentual_comissao: number;
  ativo: number;
}

const IconPlus = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconSearch = () => <svg width="14" height="14" fill="none" stroke="#71797E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconDown = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

// ✅ Função auxiliar para fetch com token

const IconPercent = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
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

export default function Funcionarios() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, show: showToast } = useToast();

  async function fetchFuncionarios() {
    try {
      setLoading(true);
      // ✅ Usando fetchWithAuth
      const res = await fetchWithAuth(`${API}/funcionarios`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFuncionarios(data.map((c: any) => ({
        id: c.id_funcionario,
        nome: c.nome,
        cargo: c.cargo ?? 0,
        nome_cargo: c.nome_cargo ?? "Desconhecido",
        salario: Number(c.salario ?? 0),
        percentual_comissao: Number(c.percentual_comissao ?? 0),
        ativo: c.ativo ?? 1,
      })));
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        showToast(`Erro ao carregar funcionários: ${err.message}`, "err");
      } else {
        showToast("Erro ao carregar funcionários. Verifique o backend.", "err");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFuncionarios(); }, []);

  const stats = useMemo(() => ({
    total: funcionarios.length,
    ativos: funcionarios.filter(f => f.ativo === 1).length,
    inativos: funcionarios.filter(f => f.ativo === 0).length,
    comissaoMedia: funcionarios.length
      ? funcionarios.reduce((acc, current) => acc + current.percentual_comissao, 0) / funcionarios.length
      : 0,
  }), [funcionarios]);

  const lista = useMemo(() =>
    funcionarios.filter(c => {
      const q = search.toLowerCase();
      return (
        (c.nome || "").toLowerCase().includes(q) ||
        (c.nome_cargo || "").toLowerCase().includes(q)
      );
    }), [funcionarios, search]);

  // ✅ Exclusão corrigida com 2 etapas
  async function handleDelete() {
    if (!confirmId) return;
    
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/funcionarios/${confirmId}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      setConfirmId(null);
      showToast("Funcionário excluído com sucesso!", "del");
      await fetchFuncionarios();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        showToast(err.message || "Erro ao remover funcionário.", "err");
      } else {
        showToast("Erro ao remover funcionário.", "err");
      }
    } finally {
      setDeleting(false);
    }
  }

  function exportCSV() {
    const headers = ["Nome", "Cargo", "Salário", "% Comissão", "Ativo"];
    const rows = funcionarios.map(c => [c.nome, c.nome_cargo, c.salario.toFixed(2), c.percentual_comissao.toFixed(2), c.ativo === 1 ? "Sim" : "Não"]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "funcionarios.csv";
    a.click();
    showToast("CSV exportado!", "ok");
  }

  // ✅ Função para fechar o modal
  const handleCloseModal = () => {
    setConfirmId(null);
    setDeleting(false);
  };

  const confirmFuncionario = funcionarios.find(c => c.id === confirmId);

  // ✅ Mapeamento de cargos
  const getCargoNome = (cargoId: number): string => {
    const cargos: Record<number, string> = {
      1: "ADMIN",
      2: "GERENTE",
      3: "VENDEDOR",
      4: "TECNICO",
      5: "CAIXA"
    };
    return cargos[cargoId] || "Desconhecido";
  };

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">Funcionários</div>
          <div className="p-topbar-actions">
            
            <button className="btn btn-primary" onClick={() => navigate("/funcionarios/novo")}><IconPlus /> Novo Funcionário</button>
          </div>
        </header>

        <div className="p-content">
          <div className="stats-row">
            <div className="stat-card"><div className="stat-icon si-yellow"><IconUsers /></div><div className="stat-info"><p>Total de Funcionários</p><strong>{stats.total}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-green"><IconCheck /></div><div className="stat-info"><p>Ativos</p><strong>{stats.ativos}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-red"><IconAlert /></div><div className="stat-info"><p>Inativos</p><strong>{stats.inativos}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-purple"><IconPercent /></div><div className="stat-info"><p>Comissão Média</p><strong>{formatPercent(stats.comissaoMedia)}</strong></div></div>
          </div>

          <div className="data-panel">
            <div className="dp-header">
              <h3>Cadastro de Funcionários</h3>
              <div className="dp-header-right">
                <div className="dp-search">
                  <IconSearch />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar funcionário..." />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dp-loading"><div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div><p>Carregando funcionários...</p></div>
            ) : lista.length === 0 ? (
              <div className="dp-empty"><div className="dp-empty-icon"><IconUsers style={{ width: 32, height: 32 }} /></div><p>Nenhum funcionário encontrado.<br />Clique em <strong>Novo Funcionário</strong> para cadastrar.</p></div>
            ) : (
              <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
                <thead>
                  <tr>
                    <th>Nome</th><th>Cargo</th><th>Salário</th><th>% Comissão</th><th>Status</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(c => (
                    <tr key={c.id}>
                      <td className="dp-cell-muted">{c.nome}</td>
                      <td className="dp-cell-muted" data-label="Cargo">{getCargoNome(c.cargo)}</td>
                      <td className="dp-cell-muted" data-label="Salário">{formatCurrency(c.salario)}</td>
                      <td className="dp-cell-muted" data-label="Comissão">{formatPercent(c.percentual_comissao)}</td>
                      <td data-label="Status"><span className={`status ${c.ativo === 1 ? 'ativo' : 'inativo'}`}>{c.ativo === 1 ? 'Ativo' : 'Inativo'}</span></td>
                      <td>
                        <div className="dp-row-actions">
                          <button
                            className="dp-btn-icon dp-view"
                            title="Ver detalhes"
                            onClick={() => navigate("/detalhes", { state: { title: "Funcionário", data: c, from: "/funcionarios" } })}
                          >
                            <IconEye />
                          </button>
                          <button className="dp-btn-icon dp-edit" title="Editar" onClick={() => navigate(`/funcionarios/editar/${c.id}`)}><IconEdit /></button>
                          <button className="dp-btn-icon dp-del" title="Remover" onClick={() => setConfirmId(c.id)}><IconTrash /></button>
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
        title="Remover funcionário?"
        message={<>"{confirmFuncionario?.nome || 'Funcionário'}" será removido do sistema.</>}
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