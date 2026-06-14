import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { getUser } from "../../utils/auth";
import "./OrdemServico.css";
import "./OrdemServicoDetalhes.css";
import API_URL from "../../utils/api";

const IconAlert = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;

const API = `${API_URL}/api`;

interface OS {
  id_ordem_servico: number;
  descricao_problema: string;
  status_execucao: number;
  equipamento: string;
  numero_serie: string;
  condicao_entrada: string;
  data_abertura: string;
  data_recebimento: string;
  data_conclusao: string;
  nome_cliente: string;
  telefone_cliente: string;
  nome_tecnico: string;
  id_tecnico: number;
  id_orcamento: number;
  diagnosticos: Diagnostico[];
  reparos: Reparo[];
  garantia: Garantia | null;
}

interface Diagnostico {
  id_diagnostico: number;
  descricao: string;
  nome_tecnico: string;
  created_at: string;
}

interface Reparo {
  id_reparo: number;
  descricao: string;
  pecas_utilizadas: string;
  nome_tecnico: string;
  created_at: string;
}

interface Garantia {
  id_garantia: number;
  dias_garantia: number;
  data_inicio: string;
  data_fim: string;
  observacoes: string;
}

function useToast() {
  const [toast, setToast] = useState({ show: false, msg: "", type: "ok" });
  function showToast(msg: string, type = "ok") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }
  return { toast, showToast };
}

export default function OrdemServicoDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getUser();
  const isTecnico = user?.nivel === 4;
  const { toast, showToast } = useToast();

  const [os, setOs] = useState<OS | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aba, setAba] = useState<"diagnostico" | "reparo" | "garantia">("diagnostico");

  const [diagDesc, setDiagDesc] = useState("");
  const [reparoDesc, setReparoDesc] = useState("");
  const [reparoPecas, setReparoPecas] = useState("");
  const [garDias, setGarDias] = useState("90");
  const [garObs, setGarObs] = useState("");
  const [modalSemConserto, setModalSemConserto] = useState(false);
  const [motivoSemConserto, setMotivoSemConserto] = useState("");

  const fetchOS = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { showToast("Erro ao carregar OS", "err"); return; }
      setOs(await res.json());
    } catch { showToast("Erro ao carregar OS", "err"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchOS(); }, [fetchOS]);

  async function post(endpoint: string, body: object) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/OrdemServico/${id}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro"); }
    return res.json();
  }

  async function atualizarStatus(novoStatus: number) {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status_execucao: novoStatus }),
      });
      if (!res.ok) { const e = await res.json(); showToast(e.error || "Erro ao atualizar status", "err"); return; }
      showToast(novoStatus === 3 ? "OS marcada como concluída!" : "Status atualizado!", "ok");
      fetchOS();
    } catch { showToast("Erro ao atualizar status", "err"); }
    finally { setSaving(false); }
  }

  async function concluirSemConserto(e: any) {
    e.preventDefault();
    if (!motivoSemConserto.trim()) { showToast("Informe o motivo", "err"); return; }
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/OrdemServico/${id}/sem-conserto`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ motivo: motivoSemConserto }),
      });
      if (!res.ok) { const e = await res.json(); showToast(e.error || "Erro", "err"); return; }
      showToast("OS concluída sem conserto!", "ok");
      setModalSemConserto(false);
      setMotivoSemConserto("");
      fetchOS();
    } catch { showToast("Erro ao salvar", "err"); }
    finally { setSaving(false); }
  }

  async function salvarDiagnostico(e: any) {
    e.preventDefault();
    if (!diagDesc.trim()) { showToast("Descrição obrigatória", "err"); return; }
    try {
      setSaving(true);
      await post("diagnosticos", { descricao: diagDesc });
      setDiagDesc("");
      showToast("Diagnóstico registrado!");
      fetchOS();
    } catch (err: any) { showToast(err.message, "err"); }
    finally { setSaving(false); }
  }

  async function salvarReparo(e: any) {
    e.preventDefault();
    if (!reparoDesc.trim()) { showToast("Descrição obrigatória", "err"); return; }
    try {
      setSaving(true);
      await post("reparos", { descricao: reparoDesc, pecas_utilizadas: reparoPecas || null });
      setReparoDesc("");
      setReparoPecas("");
      showToast("Reparo registrado!");
      fetchOS();
    } catch (err: any) { showToast(err.message, "err"); }
    finally { setSaving(false); }
  }

  async function salvarGarantia(e: any) {
    e.preventDefault();
    if (!garDias) { showToast("Dias de garantia obrigatório", "err"); return; }
    try {
      setSaving(true);
      await post("garantia", { dias_garantia: Number(garDias), observacoes: garObs || null });
      showToast("Garantia registrada!");
      fetchOS();
    } catch (err: any) { showToast(err.message, "err"); }
    finally { setSaving(false); }
  }

  function getStatusLabel(s: number) {
    return ["Aguardando", "Em diagnóstico", "Em reparo", "Concluída", "Cancelada"][s] ?? "–";
  }
  function getStatusClass(s: number) {
    return ["status-neutral", "status-info", "status-warn", "status-ok", "status-bad"][s] ?? "";
  }
  function fmtData(d: string) {
    if (!d) return "–";
    return new Date(d).toLocaleString("pt-BR");
  }
  function labelProximoPasso(status: number) {
    if (status === 0) return "Iniciar diagnóstico";
    if (status === 1) return "Iniciar reparo";
    if (status === 2) return "Marcar como concluída";
    return null;
  }

  if (loading) return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <div className="empty-state" style={{ marginTop: 80 }}><p>Carregando OS...</p></div>
      </div>
    </div>
  );

  if (!os) return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <p>OS não encontrada.</p>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/ordem")}>Voltar</button>
        </div>
      </div>
    </div>
  );

  const proximoPasso = labelProximoPasso(os.status_execucao);

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">

        <header className="p-topbar">
          <div className="p-topbar-title">
            OS #{os.id_ordem_servico}
            <span className={`status-badge ${getStatusClass(os.status_execucao)}`}>
              {getStatusLabel(os.status_execucao)}
            </span>
          </div>
          <div className="p-topbar-actions">
            <button className="btn btn-ghost" onClick={() => navigate("/ordem")}>Voltar</button>
          </div>
        </header>

        <div className="p-content osd-content">

          {/* CARDS DE INFO */}
          <div className="osd-info-grid">
            <div className="osd-info-card">
              <p className="osd-info-label">Cliente</p>
              <p className="osd-info-value">{os.nome_cliente || "–"}</p>
              {os.telefone_cliente && <p className="osd-info-sub">{os.telefone_cliente}</p>}
            </div>
            <div className="osd-info-card">
              <p className="osd-info-label">Técnico</p>
              <p className="osd-info-value">{os.nome_tecnico || "–"}</p>
            </div>
            <div className="osd-info-card">
              <p className="osd-info-label">Equipamento</p>
              <p className="osd-info-value">{os.equipamento || "Não informado"}</p>
              {os.numero_serie && <p className="osd-info-sub">S/N: {os.numero_serie}</p>}
            </div>
            <div className="osd-info-card">
              <p className="osd-info-label">Abertura</p>
              <p className="osd-info-value">{fmtData(os.data_abertura)}</p>
              {os.data_recebimento && <p className="osd-info-sub">Recebido: {fmtData(os.data_recebimento)}</p>}
            </div>
          </div>

          {/* PROBLEMA */}
          <div className="osd-problem-card">
            <p className="osd-info-label">Problema relatado</p>
            <p className="osd-problem-text">{os.descricao_problema}</p>
            {os.condicao_entrada && (
              <>
                <p className="osd-info-label" style={{ marginTop: 12 }}>Condição de entrada</p>
                <p className="osd-problem-text">{os.condicao_entrada}</p>
              </>
            )}
          </div>

          {/* BARRA DE STATUS — só técnico */}
          {isTecnico && os.status_execucao !== 4 && (
            <div className="osd-status-bar">
              <div className="osd-status-info">
                <div>
                  <p className="osd-info-label">Status atual</p>
                  <span className={`status-badge ${getStatusClass(os.status_execucao)}`}>
                    {getStatusLabel(os.status_execucao)}
                  </span>
                </div>
                {os.status_execucao === 3 && (
                  <div>
                    <p className="osd-info-label">Conclusão</p>
                    <p className="osd-info-value" style={{ fontSize: 13 }}>{fmtData(os.data_conclusao)}</p>
                  </div>
                )}
              </div>

              {proximoPasso && (
                <button className="btn btn-primary" disabled={saving} onClick={() => atualizarStatus(os.status_execucao + 1)}>
                  {saving ? "Atualizando..." : proximoPasso}
                </button>
              )}

              {os.status_execucao < 3 && (
                <button
                  className="btn btn-ghost"
                  style={{ border: "1px solid #ef4444", color: "#ef4444" }}
                  onClick={() => setModalSemConserto(true)}
                >
                  Concluir sem conserto
                </button>
              )}

              {os.status_execucao === 3 && (
                <div className="osd-concluida">✅ OS concluída! Registre a garantia na aba abaixo.</div>
              )}
            </div>
          )}

          {/* PAINEL DO TÉCNICO */}
          {isTecnico && (
            <div className="osd-tecnico-panel">
              <div className="osd-tabs">
                {([
                  { key: "diagnostico", label: "Diagnóstico" },
                  { key: "reparo", label: "Reparo" },
                  { key: "garantia", label: "🛡️ Garantia" },
                ] as const).map(t => (
                  <button key={t.key} className={`osd-tab ${aba === t.key ? "active" : ""}`} onClick={() => setAba(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {aba === "diagnostico" && (
                <div className="osd-tab-content">
                  <form onSubmit={salvarDiagnostico} className="osd-form">
                    <label>Novo diagnóstico</label>
                    <textarea value={diagDesc} onChange={e => setDiagDesc(e.target.value)} placeholder="Descreva o diagnóstico realizado..." rows={4} />
                    <button className="btn btn-primary" disabled={saving}>{saving ? "Registrando..." : "Registrar diagnóstico"}</button>
                  </form>
                  <div className="osd-historico">
                    <p className="osd-historico-title">Histórico de diagnósticos</p>
                    {os.diagnosticos.length === 0
                      ? <p className="osd-empty">Nenhum diagnóstico registrado ainda.</p>
                      : os.diagnosticos.map(d => (
                        <div key={d.id_diagnostico} className="osd-historico-item">
                          <div className="osd-historico-meta"><span>{d.nome_tecnico}</span><span>{fmtData(d.created_at)}</span></div>
                          <p>{d.descricao}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {aba === "reparo" && (
                <div className="osd-tab-content">
                  <form onSubmit={salvarReparo} className="osd-form">
                    <label>Reparo executado</label>
                    <textarea value={reparoDesc} onChange={e => setReparoDesc(e.target.value)} placeholder="Descreva o reparo realizado..." rows={4} />
                    <label>Peças utilizadas</label>
                    <textarea value={reparoPecas} onChange={e => setReparoPecas(e.target.value)} placeholder="Liste as peças utilizadas (opcional)..." rows={2} />
                    <button className="btn btn-primary" disabled={saving}>{saving ? "Registrando..." : "Registrar reparo"}</button>
                  </form>
                  <div className="osd-historico">
                    <p className="osd-historico-title">Histórico de reparos</p>
                    {os.reparos.length === 0
                      ? <p className="osd-empty">Nenhum reparo registrado ainda.</p>
                      : os.reparos.map(r => (
                        <div key={r.id_reparo} className="osd-historico-item">
                          <div className="osd-historico-meta"><span>{r.nome_tecnico}</span><span>{fmtData(r.created_at)}</span></div>
                          <p>{r.descricao}</p>
                          {r.pecas_utilizadas && <p className="osd-pecas">🔩 {r.pecas_utilizadas}</p>}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {aba === "garantia" && (
                <div className="osd-tab-content">
                  {os.status_execucao !== 3 && (
                    <div className="osd-aviso">
                      <IconAlert /> A OS precisa estar <strong>Concluída</strong> para registrar garantia.
                    </div>
                  )}
                  {os.garantia ? (
                    <div className="osd-garantia-card">
                      <p className="osd-historico-title">✅ Garantia registrada</p>
                      <div className="osd-garantia-grid">
                        <div><p className="osd-info-label">Prazo</p><p className="osd-info-value">{os.garantia.dias_garantia} dias</p></div>
                        <div><p className="osd-info-label">Início</p><p className="osd-info-value">{fmtData(os.garantia.data_inicio)}</p></div>
                        <div><p className="osd-info-label">Vencimento</p><p className="osd-info-value">{fmtData(os.garantia.data_fim)}</p></div>
                      </div>
                      {os.garantia.observacoes && <p className="osd-problem-text" style={{ marginTop: 12 }}>{os.garantia.observacoes}</p>}
                    </div>
                  ) : (
                    <form onSubmit={salvarGarantia} className="osd-form">
                      <label>Dias de garantia</label>
                      <input type="number" min="1" value={garDias} onChange={e => setGarDias(e.target.value)} placeholder="Ex: 90" disabled={os.status_execucao !== 3} />
                      <label>Observações</label>
                      <textarea value={garObs} onChange={e => setGarObs(e.target.value)} placeholder="Condições da garantia (opcional)..." rows={3} disabled={os.status_execucao !== 3} />
                      <button className="btn btn-primary" disabled={saving || os.status_execucao !== 3}>
                        {saving ? "Registrando..." : "Registrar garantia"}
                      </button>
                    </form>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-ghost" onClick={() => navigate("/ordem")}>Voltar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISÃO SOMENTE LEITURA PARA GERENTE */}
          {!isTecnico && (
            <div className="osd-tecnico-panel">
              <div className="osd-tabs">
                {([
                  { key: "diagnostico", label: "Diagnósticos" },
                  { key: "reparo", label: "Reparos" },
                  { key: "garantia", label: "🛡️ Garantia" },
                ] as const).map(t => (
                  <button key={t.key} className={`osd-tab ${aba === t.key ? "active" : ""}`} onClick={() => setAba(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {aba === "diagnostico" && (
                <div className="osd-tab-content">
                  <div className="osd-historico">
                    {os.diagnosticos.length === 0
                      ? <p className="osd-empty">Nenhum diagnóstico registrado.</p>
                      : os.diagnosticos.map(d => (
                        <div key={d.id_diagnostico} className="osd-historico-item">
                          <div className="osd-historico-meta"><span>{d.nome_tecnico}</span><span>{fmtData(d.created_at)}</span></div>
                          <p>{d.descricao}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {aba === "reparo" && (
                <div className="osd-tab-content">
                  <div className="osd-historico">
                    {os.reparos.length === 0
                      ? <p className="osd-empty">Nenhum reparo registrado.</p>
                      : os.reparos.map(r => (
                        <div key={r.id_reparo} className="osd-historico-item">
                          <div className="osd-historico-meta"><span>{r.nome_tecnico}</span><span>{fmtData(r.created_at)}</span></div>
                          <p>{r.descricao}</p>
                          {r.pecas_utilizadas && <p className="osd-pecas">🔩 {r.pecas_utilizadas}</p>}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {aba === "garantia" && (
                <div className="osd-tab-content">
                  {os.garantia ? (
                    <div className="osd-garantia-card">
                      <p className="osd-historico-title">✅ Garantia registrada</p>
                      <div className="osd-garantia-grid">
                        <div><p className="osd-info-label">Prazo</p><p className="osd-info-value">{os.garantia.dias_garantia} dias</p></div>
                        <div><p className="osd-info-label">Início</p><p className="osd-info-value">{fmtData(os.garantia.data_inicio)}</p></div>
                        <div><p className="osd-info-label">Vencimento</p><p className="osd-info-value">{fmtData(os.garantia.data_fim)}</p></div>
                      </div>
                      {os.garantia.observacoes && <p className="osd-problem-text" style={{ marginTop: 12 }}>{os.garantia.observacoes}</p>}
                    </div>
                  ) : (
                    <p className="osd-empty">Nenhuma garantia registrada.</p>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-ghost" onClick={() => navigate("/ordem")}>Voltar</button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL SEM CONSERTO */}
      {modalSemConserto && (
        <div className="confirm-overlay open" onClick={() => setModalSemConserto(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Concluir sem conserto</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 16 }}>
              Informe o motivo pelo qual o equipamento não pôde ser consertado.
            </p>
            <form onSubmit={concluirSemConserto}>
              <textarea
                value={motivoSemConserto}
                onChange={e => setMotivoSemConserto(e.target.value)}
                rows={4}
                placeholder="Ex: Peça indisponível no mercado, dano irreparável na placa-mãe..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, resize: "vertical" }}
              />
              <div className="confirm-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalSemConserto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ background: "#ef4444", borderColor: "#ef4444" }}>
                  {saving ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`toast ${toast.show ? "show" : ""}`}>
        <span className={`toast-dot ${toast.type}`} />
        {toast.msg}
      </div>
    </div>
  );
}