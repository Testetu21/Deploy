import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconAlert, IconBox, IconBuilding, IconClock, IconEye, IconMoney } from "../../components/ui/icons";
import "./Produtos.css";
import "../../styles/data-panel.css";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { formatCurrency } from "../../utils/format";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`;

type Tipo = 1 | 2 | 3;

interface Produto {
  id: number;
  nome: string;
  tipo: Tipo;
  preco_custo: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  garantia: number;
  id_fornecedor: number;
}

const TIPOS: Record<Tipo, string> = { 1: "Ferramenta", 2: "Peça", 3: "Acessório" };

function fmt(v: number) { return formatCurrency(v); }

function getStatus(p: Produto): { label: string; cls: string } {
  if (p.quantidade_estoque <= 0)                      return { label: "Sem estoque", cls: "badge-low" };
  if (p.quantidade_estoque <= p.estoque_minimo)       return { label: "Crítico",     cls: "badge-low" };
  if (p.quantidade_estoque <= p.estoque_minimo * 1.5) return { label: "Baixo",       cls: "badge-warn" };
  return { label: "OK", cls: "badge-ok" };
}

const IconPlus   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconSearch = () => <svg width="14" height="14" fill="none" stroke="#71797E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconDown   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

// Função auxiliar para fetch com token
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

export default function Produtos() {
  const navigate = useNavigate();
  const [produtos, setProdutos]     = useState<Produto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [confirmId, setConfirmId]   = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const { toast, show: showToast }  = useToast();

  async function fetchProdutos() {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/produtos`);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      setProdutos(data.map((p: any) => ({
        id:                 p.id_produto,
        nome:               p.nome,
        tipo:               p.tipo as Tipo,
        preco_custo:        p.preco_custo,
        preco_venda:        p.preco_venda,
        quantidade_estoque: p.quantidade_estoque,
        estoque_minimo:     p.estoque_minimo,
        garantia:           p.garantia,
        id_fornecedor:      p.id_fornecedor,
      })));
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        showToast(`Erro ao carregar produtos: ${err.message}`, "err");
      } else {
        showToast("Erro ao carregar produtos. Verifique o backend.", "err");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProdutos(); }, []);

  const stats = useMemo(() => ({
    total:        produtos.length,
    criticos:     produtos.filter(p => p.quantidade_estoque <= p.estoque_minimo).length,
    valor:        produtos.reduce((s, p) => s + p.preco_venda * p.quantidade_estoque, 0),
    fornecedores: new Set(produtos.map(p => p.id_fornecedor)).size,
  }), [produtos]);

  const lista = useMemo(() =>
    produtos.filter(p => {
      const q = search.toLowerCase();
      return ((p.nome || "").toLowerCase().includes(q) || String(p.id).includes(q))
        && (!filterTipo || String(p.tipo) === filterTipo);
    }), [produtos, search, filterTipo]);

  // ============================================
  // EXCLUSÃO CORRIGIDA
  // ============================================
  async function handleDelete() {
    if (!confirmId) return;
    
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/produtos/${confirmId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      // ✅ Fecha o modal primeiro
      setConfirmId(null);
      
      // ✅ Mostra toast de sucesso
      showToast("Produto excluído com sucesso!", "del");
      
      // ✅ Recarrega a lista
      await fetchProdutos();
      
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        showToast(err.message || "Erro ao excluir produto.", "err");
      } else {
        showToast("Erro ao excluir produto.", "err");
      }
    } finally {
      setDeleting(false);
    }
  }

  function exportCSV() {
    const headers = ["Nome","Tipo","Preço Custo","Preço Venda","Estoque","Est. Mínimo","Garantia","Fornecedor"];
    const rows    = produtos.map(p => [p.id, p.nome, TIPOS[p.tipo], p.preco_custo, p.preco_venda, p.quantidade_estoque, p.estoque_minimo, p.garantia, p.id_fornecedor]);
    const csv     = [headers, ...rows].map(r => r.join(";")).join("\n");
    const a       = document.createElement("a");
    a.href        = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download    = "produtos.csv";
    a.click();
    showToast("CSV exportado!", "ok");
  }

  const confirmProduto = produtos.find(p => p.id === confirmId);

  // ✅ Função para fechar o modal e resetar
  const handleCloseModal = () => {
    setConfirmId(null);
    setDeleting(false);
  };

  return (
    <div className="produtos-wrapper">
      <Sidebar />
      <div className="produtos-page">
        <header className="p-topbar">
          <div className="p-topbar-title">Produtos</div>
          <div className="p-topbar-actions">
            
            <button className="btn btn-primary" onClick={() => navigate("/produtos/novo")}>
              <IconPlus /> Novo Produto
            </button>
          </div>
        </header>

        <div className="p-content">
          <div className="stats-row">
            <div className="stat-card"><div className="stat-icon si-yellow"><IconBox /></div><div className="stat-info"><p>Total de Produtos</p><strong>{stats.total}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-red"><IconAlert /></div><div className="stat-info"><p>Estoque Crítico</p><strong>{stats.criticos}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-green"><IconMoney /></div><div className="stat-info"><p>Valor em Estoque</p><strong>{"R$ " + stats.valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</strong></div></div>
            <div className="stat-card"><div className="stat-icon si-blue"><IconBuilding /></div><div className="stat-info"><p>Fornecedores</p><strong>{stats.fornecedores}</strong></div></div>
          </div>

          <div className="data-panel">
            <div className="dp-header">
              <h3>Cadastro de Produtos</h3>
              <div className="dp-header-right">
                <div className="dp-search">
                  <IconSearch />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." />
                </div>
                <select className="dp-select" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                  <option value="">Todos os tipos</option>
                  <option value="1">Ferramenta</option>
                  <option value="2">Peça</option>
                  <option value="3">Acessório</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="dp-loading"><div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div><p>Carregando produtos...</p></div>
            ) : lista.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><IconBox style={{ width: 32, height: 32 }} /></div>
                <p>Nenhum produto encontrado.<br />Clique em <strong>Novo Produto</strong> para cadastrar.</p>
              </div>
            ) : (
              <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
                <thead>
                  <tr>
                    <th>Produto</th><th>Tipo</th>
                    <th>Preço Venda</th>
                    <th>Estoque</th>
                    <th>Status</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(p => {
                    const st = getStatus(p);
                    return (
                      <tr key={p.id}>
                        <td className="dp-cell-muted">{p.nome}</td>
                        <td data-label="Tipo">{TIPOS[p.tipo]}</td>
                        <td data-label="Preço"><strong>{fmt(p.preco_venda)}</strong></td>
                        <td data-label="Estoque">{p.quantidade_estoque}</td>
                        <td data-label="Status"><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td>
                          <div className="dp-row-actions">
                            <button
                              className="dp-btn-icon dp-view"
                              title="Ver detalhes"
                              onClick={() => navigate("/detalhes", { state: { title: "Produto", data: p, from: "/produtos" } })}
                            >
                              <IconEye />
                            </button>
                            <button 
                              className="dp-btn-icon dp-edit" 
                              title="Editar" 
                              onClick={() => navigate(`/produtos/editar/${p.id}`)}
                            >
                              <IconEdit />
                            </button>
                            <button 
                              className="dp-btn-icon dp-del" 
                              title="Excluir" 
                              onClick={() => setConfirmId(p.id)}
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
        title="Excluir este produto?"
        message={<>"{confirmProduto?.nome || 'Produto'}" será removido permanentemente.</>}
        confirmLabel={deleting ? "Excluindo..." : "Sim, excluir"}
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