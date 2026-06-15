import "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { getUser } from "../../utils/auth";
import "./OrdemServicoForm.css";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`;

export default function OrdemServicoForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const user = getUser();
  const nivel = Number(user?.nivel ?? (user as any)?.nivel_acesso ?? 0);
  const isTecnico = nivel === 4;
  const isGerente = nivel === 1 || nivel === 2;
  const podeGerenciar = isGerente || isTecnico;

  const locationState = (location.state as any) || {};

  const [clientes, setClientes] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);

  const [idCliente, setIdCliente] = useState(String(locationState.id_cliente_orc || ""));
  const [idTecnico, setIdTecnico] = useState("");
  const [descricao, setDescricao] = useState(locationState.descricao_orc || "");
  const [idOrcamento, setIdOrcamento] = useState(String(locationState.id_orcamento || ""));
  const [equipamento, setEquipamento] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [condicaoEntrada, setCondicaoEntrada] = useState("");
  const [statusExecucao, setStatusExecucao] = useState("0");
  const [motivoSemConserto, setMotivoSemConserto] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusExecucaoGerente, setStatusExecucaoGerente] = useState("0");

  useEffect(() => {
    if (podeGerenciar) {
      fetchClientes();
      fetchOrcamentos();
      fetchTecnicos(); // técnico também precisa ver a lista na edição
    }
    const idNum = Number(id);
    if (id && !isNaN(idNum) && idNum > 0) fetchOS();
  }, [id]);

  async function fetchClientes() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/clientes`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  async function fetchTecnicos() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/funcionarios?cargo=4`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setTecnicos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  async function fetchOrcamentos() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/orcamentos/disponiveis`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrcamentos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  async function fetchOS() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { alert("Erro ao carregar OS"); return; }
      const data = await res.json();
      setIdCliente(String(data.id_cliente || ""));
      setIdTecnico(String(data.id_tecnico || ""));
      setDescricao(data.descricao_problema || "");
      setIdOrcamento(String(data.id_orcamento || ""));
      setEquipamento(data.equipamento || "");
      setNumeroSerie(data.numero_serie || "");
      setCondicaoEntrada(data.condicao_entrada || "");
      setStatusExecucao(String(data.status_execucao ?? "0"));
      setStatusExecucaoGerente(String(data.status_execucao ?? "0"));
    } catch { alert("Erro ao carregar OS"); }
  }

  async function salvarGerente(e: any) {
    e.preventDefault();
    if (!descricao) { alert("Descrição é obrigatória"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        id_cliente: idCliente ? Number(idCliente) : null,
        id_tecnico: idTecnico ? Number(idTecnico) : null,
        descricao_problema: descricao,
        ...(id ? { status_execucao: Number(statusExecucaoGerente) } : {}),
      };
      const res = await fetch(
        id ? `${API}/OrdemServico/${id}` : `${API}/OrdemServico`,
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("Salvo com sucesso!");
      navigate("/ordem");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  async function salvarTecnico(e: any) {
    e.preventDefault();
    if (!descricao) { alert("Descrição do problema é obrigatória"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        ...(idCliente ? { id_cliente: Number(idCliente) } : {}),
        id_tecnico: idTecnico ? Number(idTecnico) : undefined,
        descricao_problema: descricao,
        equipamento: equipamento || null,
        numero_serie: numeroSerie || null,
        condicao_entrada: condicaoEntrada || null,
      };
      const res = await fetch(`${API}/OrdemServico`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("OS criada com sucesso!");
      navigate("/ordem");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  async function registrarRecebimento(e: any) {
    e.preventDefault();
    if (!equipamento) { alert("Nome do equipamento é obrigatório"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}/recebimento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ equipamento, numero_serie: numeroSerie || null, condicao_entrada: condicaoEntrada || null }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro"); return; }
      alert("Recebimento registrado!");
      navigate("/ordem");
    } catch { alert("Erro ao registrar recebimento"); }
    finally { setLoading(false); }
  }

  async function atualizarStatus(e: any) {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status_execucao: Number(statusExecucao) }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro"); return; }
      alert("Status atualizado!");
      navigate("/ordem");
    } catch { alert("Erro ao atualizar status"); }
    finally { setLoading(false); }
  }

  const statusOpcoes = [
    { value: "0", label: "Aguardando" },
    { value: "1", label: "Em diagnóstico" },
    { value: "2", label: "Em reparo" },
    { value: "3", label: "Concluída" },
    { value: "4", label: "Cancelada" },
  ];

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">

        <header className="p-topbar">
          <div className="p-topbar-title">
            {id ? "Editar OS" : "Nova OS"}
          </div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/ordem")}>
              Voltar
            </button>
          </div>
        </header>

        <div className="p-content">

          {/* ── FORMULÁRIO PRINCIPAL — gerente e técnico na edição ── */}
          {(isGerente || (isTecnico && id)) && (
            <form className="form-card" onSubmit={salvarGerente}>
              <h3 className="form-card-title">Dados da OS</h3>

              {id && ["3", "4"].includes(statusExecucaoGerente) && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
                  ⚠️ Esta OS está <strong>{statusExecucaoGerente === "3" ? "concluída" : "cancelada"}</strong> e não pode ser editada.
                </div>
              )}

              <label>Cliente *</label>
              <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)} disabled={id ? ["3", "4"].includes(statusExecucaoGerente) : false}>
                <option value="">Consumidor final (sem cadastro)</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
                ))}
              </select>

              {!isTecnico && (
                <>
                  <label>Técnico responsável</label>
                  <select
                    value={idTecnico}
                    onChange={e => setIdTecnico(e.target.value)}
                    disabled={id ? ["3", "4"].includes(statusExecucaoGerente) : false}
                  >
                    <option value="">Nenhum</option>
                    {tecnicos.map(t => (
                      <option key={t.id_funcionario} value={t.id_funcionario}>{t.nome}</option>
                    ))}
                  </select>
                </>
              )}

              <label>Descrição do problema *</label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={4}
                placeholder="Descreva o problema relatado pelo cliente..."
                disabled={id ? ["3", "4"].includes(statusExecucaoGerente) : false}
              />

              {id && (
                <>
                  <label>Status</label>
                  <select value={statusExecucaoGerente} onChange={e => setStatusExecucaoGerente(e.target.value)} disabled={["3", "4"].includes(statusExecucaoGerente)}>
                    <option value="0">Aguardando</option>
                    <option value="1">Em diagnóstico</option>
                    <option value="2">Em reparo</option>
                    <option value="3">Concluída</option>
                    <option value="4">Cancelada</option>
                    <option value="5">Concluída sem reparo</option>
                  </select>
                </>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" disabled={loading || (id ? ["3", "4"].includes(statusExecucaoGerente) : false)}>
                  {loading ? "Salvando..." : "Salvar OS"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate("/ordem")}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* ── TÉCNICO: criar nova OS ── */}
          {isTecnico && !id && (
            <form className="form-card" onSubmit={salvarTecnico}>
              <h3 className="form-card-title">Nova Ordem de Serviço</h3>
              <p style={{ color: "#71717a", marginBottom: 16, fontSize: 14 }}>
                Você será automaticamente atribuído como técnico responsável.
              </p>

              <label>Cliente *</label>
              <select value={idCliente} onChange={e => setIdCliente(e.target.value)}>
                <option value="">Selecione</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
                ))}
              </select>

              <label>Descrição do problema *</label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={4}
                placeholder="Descreva o problema relatado pelo cliente..."
              />

              <label>Equipamento *</label>
              <input
                type="text"
                value={equipamento}
                onChange={e => setEquipamento(e.target.value)}
                placeholder="Ex: Notebook Dell Inspiron"
              />

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" disabled={loading}>
                  {loading ? "Salvando..." : "Criar OS"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate("/ordem")}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!isGerente && !isTecnico && (
            <div className="form-card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "#71717a" }}>Sem permissão para acessar este formulário.</p>
              <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/ordem")}>Voltar</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}