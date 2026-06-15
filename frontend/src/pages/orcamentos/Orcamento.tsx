import "../../utils/toast";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import "./Orcamento.css";
import "../../styles/data-panel.css";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { IconEye } from "../../components/ui/icons";
import { formatCurrency, formatDate } from "../../utils/format";
import API_URL from "../../utils/api";
import { getUser } from "../../utils/auth";

const API = `${API_URL}/api`;

interface Orcamento {
  id: number;
  cliente: string;
  tecnico: string;
  descricao: string;
  dados: string;
  valor: number;
  status: string; // ✅ CORRIGIDO
  data: string;
  validade: string;
}

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

const IconDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h8" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconBan = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 8l8 8" />
  </svg>
);

export default function Orcamentos() {
  const navigate = useNavigate();

  const user = getUser();
  const nivel = Number(user?.nivel ?? (user as any)?.nivel_acesso ?? 0);
  const isTecnico = nivel === 4;

  const [lista, setLista] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orcamentoParaExcluir, setOrcamentoParaExcluir] = useState<Orcamento | null>(null);

  const stats = useMemo(() => {
    const pendentes = lista.filter(o => o.status !== "aceito" && o.status !== "cancelado").length;
    const aprovados = lista.filter(o => o.status === "aceito").length;
    const cancelados = lista.filter(o => o.status === "cancelado").length;

    return {
      total: lista.length,
      pendentes,
      aprovados,
      cancelados,
    };
  }, [lista]);


  async function fetchOrcamentos() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/orcamentos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erro ao buscar orçamentos");

      const data = await res.json();
      setLista(Array.isArray(data) ? data.map((o: any) => ({
        id: o.id_orcamento,
        id_cliente: o.id_cliente,
        cliente: o.nome_cliente || "Consumidor final",
        tecnico: o.nome_tecnico || "Sem técnico",
        descricao: o.descricao || "",
        dados: o.dados || "",
        valor: Number(o.valor_total) || 0,
        status: o.status || "pendente",
        data: o.data || "",
        validade: o.validade || ""
      })) : []);

    } catch (err) {
      console.error(err);
      alert("Erro ao carregar orçamentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  const filtrado = useMemo(() =>
    lista.filter(o =>
      (o.cliente || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.tecnico || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.descricao || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.dados || "").toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search)
    ), [lista, search]
  );

  function abrirConfirmacaoExclusao(orcamento: Orcamento) {
    setOrcamentoParaExcluir(orcamento);
  }

  function fecharConfirmacaoExclusao() {
    setOrcamentoParaExcluir(null);
  }

  async function deletar(id: number) {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/orcamentos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const e = await res.json();
        alert(e.error || 'Erro ao excluir');
        return;
      }

      setLista(prev => prev.filter(item => item.id !== id));
      setOrcamentoParaExcluir(null);
      fetchOrcamentos();

    } catch (err) {
      console.error(err);
      alert("Erro ao deletar orçamento");
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "aceito": return "Aprovado";
      case "cancelado": return "Cancelado";
      default: return "Pendente";
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "aceito": return "status-ok";
      case "cancelado": return "status-bad";
      default: return "status-warn";
    }
  }

  function exportCSV() {
    const headers = ["ID", "Cliente", "Técnico", "Descrição", "Dados", "Valor", "Status", "Data", "Validade"];

    const rows = lista.map(o => [
      o.id,
      o.cliente,
      o.tecnico,
      o.descricao,
      o.dados,
      o.valor,
      getStatusLabel(o.status),
      o.data ? new Date(o.data).toLocaleDateString("pt-BR") : "-",
      o.validade ? new Date(o.validade).toLocaleDateString("pt-BR") : "-"
    ]);

    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = "orcamentos.csv";
    a.click();
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />

      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">
            Orçamentos
          </div>

          <div className="p-topbar-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/orcamentos/novo")}
            >
              <IconPlus /> Novo Orçamento
            </button>
          </div>
        </header>

        <div className="p-content">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon si-blue"><IconFileText /></div>
              <div className="stat-info">
                <p>Total de orçamentos</p>
                <strong>{stats.total}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-yellow"><IconClock /></div>
              <div className="stat-info">
                <p>Pendentes</p>
                <strong>{stats.pendentes}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-green"><IconCheckCircle /></div>
              <div className="stat-info">
                <p>Aprovados</p>
                <strong>{stats.aprovados}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-red"><IconBan /></div>
              <div className="stat-info">
                <p>Cancelados</p>
                <strong>{stats.cancelados}</strong>
              </div>
            </div>
          </div>

          <div className="data-panel">

            <div className="dp-header">
              <div>
                <h3>Lista de Orçamentos</h3>
                <p className="table-subtitle">Acompanhe propostas, validade e situação de cada orçamento.</p>
              </div>

              <div className="dp-search">
                <IconSearch />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                />
              </div>
            </div>

            {loading ? (
              <div className="dp-loading">
                <div className="dp-empty-icon"><IconFileText /></div>
                <p>Carregando orçamentos...</p>
              </div>
            ) : filtrado.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><IconFileText /></div>
                <p>Nenhum orçamento encontrado</p>
              </div>
            ) : (
              <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Validade</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtrado.map(o => (
                    <tr key={o.id}>
                      <td data-label="Cliente">{o.cliente}</td>
                      <td data-label="Descrição">{o.descricao || "-"}</td>
                      <td className="dp-cell-mono" data-label="Valor">{formatCurrency(o.valor)}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </span>
                      </td>
                      <td data-label="Validade">{formatDate(o.validade)}</td>
                      <td>
                        <div className="dp-row-actions">
                          <button
                            className="dp-btn-icon dp-view"
                            title="Ver detalhes"
                            onClick={() => navigate("/detalhes", { state: { title: "Orçamento", data: o, from: "/orcamentos" } })}
                          >
                            <IconEye />
                          </button>
                          {/* Técnico pode criar OS a partir do orçamento */}
                          {isTecnico && o.status === "aceito" && (
                            <button
                              className="btn btn-primary"
                              title="Criar OS vinculada a este orçamento"
                              style={{ height: 32, fontSize: 12, padding: "0 10px", borderRadius: 8 }}
                              onClick={() => navigate("/ordem/novo", { state: { id_orcamento: o.id, id_cliente_orc: (o as any).id_cliente, descricao_orc: o.descricao } })}
                            >
                              + OS
                            </button>
                          )}
                          {/* Editar — todos, exceto status aceito... mas você removeu essa restrição antes */}
                          <button
                            className="dp-btn-icon dp-edit"
                            onClick={() => navigate(`/orcamentos/editar/${o.id}`)}
                          >
                            <IconEdit />
                          </button>

                          <button className="dp-btn-icon dp-del" onClick={() => abrirConfirmacaoExclusao(o)}>
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

      <ConfirmDialog
        open={!!orcamentoParaExcluir}
        title="Excluir este orçamento?"
        message={
          orcamentoParaExcluir
            ? <>Você está prestes a excluir o orçamento <strong>#{orcamentoParaExcluir.id}</strong> de <strong>{orcamentoParaExcluir.cliente}</strong>. Essa ação não pode ser desfeita.</>
            : null
        }
        confirmLabel="Excluir orçamento"
        variant="danger"
        onConfirm={() => orcamentoParaExcluir && deletar(orcamentoParaExcluir.id)}
        onCancel={fecharConfirmacaoExclusao}
      />
    </div>
  );
}