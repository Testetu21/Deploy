import "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { getUser } from "../../utils/auth";
import "./OrdemServicoForm.css";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`;

export default function OrdemServicoForm() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { id }    = useParams();

  const user      = getUser();
  const nivel     = Number(user?.nivel ?? (user as any)?.nivel_acesso ?? 0);
  const isTecnico = nivel === 4;
  const isGerente = nivel === 1 || nivel === 2;
  const podeGerenciar = isGerente || isTecnico;

  // Estado pré-preenchido vindo da página de orçamentos
  const locationState = (location.state as any) || {};

  const [clientes,   setClientes]   = useState<any[]>([]);
  const [tecnicos,   setTecnicos]   = useState<any[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);

  // Campos gerente
  const [idCliente,   setIdCliente]   = useState(String(locationState.id_cliente_orc || ""));
  const [idTecnico,   setIdTecnico]   = useState("");
  const [descricao,   setDescricao]   = useState(locationState.descricao_orc || "");
  const [idOrcamento, setIdOrcamento] = useState(String(locationState.id_orcamento || ""));

  // Campos técnico — recebimento
  const [equipamento,     setEquipamento]     = useState("");
  const [numeroSerie,     setNumeroSerie]      = useState("");
  const [condicaoEntrada, setCondicaoEntrada] = useState("");

  // Status execução
  const [statusExecucao, setStatusExecucao] = useState("0");

  const [loading, setLoading] = useState(false);

  // ── CARREGAR ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (podeGerenciar) {
      fetchClientes();
      fetchOrcamentos();
    }
    if (isGerente) {
      fetchTecnicos();
    }
    const idNum = Number(id);
    if (id && !isNaN(idNum) && idNum > 0) fetchOS();
  }, [id]);

  async function fetchClientes() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { console.warn("fetchClientes:", res.status); return; }
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Erro ao carregar clientes", e); }
  }

  async function fetchTecnicos() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/funcionarios?cargo=4`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { console.warn("fetchTecnicos:", res.status); return; }
      const data = await res.json();
      setTecnicos(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Erro ao carregar técnicos", e); }
  }

  async function fetchOrcamentos() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/orcamentos/disponiveis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrcamentos(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Erro ao carregar orçamentos", e); }
  }

  async function fetchOS() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    } catch { alert("Erro ao carregar OS"); }
  }

  // ── SALVAR TÉCNICO (criar nova OS) ─────────────────────────────────────────
  async function salvarTecnico(e: any) {
    e.preventDefault();
    if (!idCliente || !descricao) {
      alert("Cliente e descrição são obrigatórios");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        id_cliente:         Number(idCliente),
        descricao_problema: descricao,
        equipamento:        equipamento || null,
        numero_serie:       numeroSerie || null,
        condicao_entrada:   condicaoEntrada || null,
        id_orcamento:       idOrcamento ? Number(idOrcamento) : null,
      };
      const res = await fetch(`${API}/OrdemServico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("OS criada com sucesso!");
      navigate("/ordem");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  // ── SALVAR GERENTE (dados gerais) ───────────────────────────────────────────
  async function salvarGerente(e: any) {
    e.preventDefault();
    if (!idCliente || !descricao) {
      alert("Cliente e descrição são obrigatórios");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        id_cliente:         Number(idCliente),
        id_tecnico:         idTecnico ? Number(idTecnico) : null,
        descricao_problema: descricao,
        id_orcamento:       idOrcamento ? Number(idOrcamento) : null,
      };
      const res = await fetch(
        id ? `${API}/OrdemServico/${id}` : `${API}/OrdemServico`,
        {
          method: id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("Salvo com sucesso!");
      navigate("/ordem");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  // ── REGISTRAR RECEBIMENTO (técnico) ────────────────────────────────────────
  async function registrarRecebimento(e: any) {
    e.preventDefault();
    if (!equipamento) { alert("Nome do equipamento é obrigatório"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}/recebimento`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipamento,
          numero_serie:     numeroSerie || null,
          condicao_entrada: condicaoEntrada || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro"); return; }
      alert("Recebimento registrado!");
      navigate("/ordem");
    } catch { alert("Erro ao registrar recebimento"); }
    finally { setLoading(false); }
  }

  // ── ATUALIZAR STATUS (técnico) ──────────────────────────────────────────────
  async function atualizarStatus(e: any) {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status_execucao: Number(statusExecucao) }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro"); return; }
      alert("Status atualizado!");
      navigate("/ordem");
    } catch { alert("Erro ao atualizar status"); }
    finally { setLoading(false); }
  }

  // ── LABELS ──────────────────────────────────────────────────────────────────
  const statusOpcoes = [
    { value: "0", label: "Aguardando" },
    { value: "1", label: "Em diagnóstico" },
    { value: "2", label: "Em reparo" },
    { value: "3", label: "Concluída" },
    { value: "4", label: "Cancelada" },
  ];

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">

        <header className="p-topbar">
          <div className="p-topbar-title">
            {isTecnico ? (id ? `OS #${id} — Painel Técnico` : "Nova OS") : id ? "Editar OS" : "Nova OS"}
          </div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/ordem")}>
              Voltar
            </button>
          </div>
        </header>

        <div className="p-content">

          {/* ── GERENTE: formulário completo ── */}
          {isGerente && (
            <form className="form-card" onSubmit={salvarGerente}>
              <h3 className="form-card-title">Dados da OS</h3>

              <label>Cliente *</label>
              <select value={idCliente} onChange={e => setIdCliente(e.target.value)}>
                <option value="">Selecione</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
                ))}
              </select>

              <label>Técnico responsável</label>
              <select value={idTecnico} onChange={e => setIdTecnico(e.target.value)}>
                <option value="">Nenhum</option>
                {tecnicos.map(t => (
                  <option key={t.id_funcionario} value={t.id_funcionario}>{t.nome}</option>
                ))}
              </select>

              <label>Descrição do problema *</label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={4}
                placeholder="Descreva o problema relatado pelo cliente..."
              />

              <label>Orçamento vinculado</label>
              <input
                type="number"
                value={idOrcamento}
                onChange={e => setIdOrcamento(e.target.value)}
                placeholder="ID do orçamento (opcional)"
              />

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar OS"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate("/ordem")}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* ── TÉCNICO: recebimento + status ── */}
          {isTecnico && id && (
            <>
              {/* Recebimento do equipamento */}
              <form className="form-card" onSubmit={registrarRecebimento} style={{ marginBottom: 20 }}>
                <h3 className="form-card-title">Recebimento do equipamento</h3>

                <label>Equipamento *</label>
                <input
                  type="text"
                  value={equipamento}
                  onChange={e => setEquipamento(e.target.value)}
                  placeholder="Ex: Notebook Dell Inspiron"
                />

                <label>Número de série</label>
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={e => setNumeroSerie(e.target.value)}
                  placeholder="Opcional"
                />

                <label>Condição de entrada</label>
                <textarea
                  value={condicaoEntrada}
                  onChange={e => setCondicaoEntrada(e.target.value)}
                  rows={3}
                  placeholder="Descreva o estado físico do equipamento ao receber..."
                />

                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" disabled={loading}>
                    {loading ? "Registrando..." : "Registrar recebimento"}
                  </button>
                </div>
              </form>

              {/* Atualizar status */}
              <form className="form-card" onSubmit={atualizarStatus}>
                <h3 className="form-card-title">Atualizar status da OS</h3>

                <label>Status atual</label>
                <select value={statusExecucao} onChange={e => setStatusExecucao(e.target.value)}>
                  {statusOpcoes.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" disabled={loading}>
                    {loading ? "Atualizando..." : "Atualizar status"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── TÉCNICO: criar nova OS ── */}
          {isTecnico && !id && (
            <form className="form-card" onSubmit={salvarTecnico}>
              <h3 className="form-card-title">Nova Ordem de Serviço</h3>
              <p style={{ color: "#71717a", marginBottom: 16, fontSize: 14 }}>
                Você será automaticamente atribuído como técnico responsável.
              </p>

              <label>Orçamento vinculado</label>
              <select value={idOrcamento} onChange={e => {
                const val = e.target.value;
                setIdOrcamento(val);
                if (val) {
                  const orc = orcamentos.find((o: any) => String(o.id_orcamento) === val);
                  if (orc) {
                    setDescricao(orc.descricao || "");
                    setIdCliente(String(orc.id_cliente || ""));
                  }
                } else {
                  setDescricao("");
                  setIdCliente("");
                }
              }}>
                <option value="">— Nenhum —</option>
                {orcamentos.map((o: any) => (
                  <option key={o.id_orcamento} value={o.id_orcamento}>
                    #{o.id_orcamento} · {o.nome_cliente || "Cliente"} · {
                      o.valor_total != null
                        ? Number(o.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : ""
                    } · {o.status}
                  </option>
                ))}
              </select>

              {/* Card de resumo do orçamento selecionado */}
              {idOrcamento && (() => {
                const orc = orcamentos.find((o: any) => String(o.id_orcamento) === idOrcamento);
                return orc ? (
                  <div style={{ background: "var(--color-surface, #f4f4f5)", border: "1px solid var(--color-border, #e4e4e7)", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: "var(--color-text-secondary, #52525b)" }}>
                    <strong style={{ color: "var(--color-text, #18181b)" }}>Orçamento #{orc.id_orcamento}</strong>
                    {" — "}{orc.nome_cliente}
                    {orc.descricao ? <><br />{orc.descricao}</> : null}
                    <br />
                    <span style={{ color: orc.status === "aceito" ? "#16a34a" : orc.status === "cancelado" ? "#dc2626" : "#ca8a04" }}>
                      {orc.status === "aceito" ? "✓ Aprovado" : orc.status === "cancelado" ? "✗ Cancelado" : "⏳ Pendente"}
                    </span>
                    {orc.valor_total != null && (
                      <span style={{ marginLeft: 12 }}>
                        {Number(orc.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    )}
                  </div>
                ) : null;
              })()}

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

              <label>Equipamento</label>
              <input
                type="text"
                value={equipamento}
                onChange={e => setEquipamento(e.target.value)}
                placeholder="Ex: Notebook Dell Inspiron (opcional)"
              />

              <label>Número de série</label>
              <input
                type="text"
                value={numeroSerie}
                onChange={e => setNumeroSerie(e.target.value)}
                placeholder="Opcional"
              />

              <label>Condição de entrada</label>
              <textarea
                value={condicaoEntrada}
                onChange={e => setCondicaoEntrada(e.target.value)}
                rows={3}
                placeholder="Descreva o estado físico do equipamento ao receber..."
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

          {/* ── FALLBACK: nivel não reconhecido ── */}
          {!isGerente && !isTecnico && (
            <div className="form-card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "#71717a" }}>Sem permissão para acessar este formulário.</p>
              <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/ordem")}>
                Voltar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}