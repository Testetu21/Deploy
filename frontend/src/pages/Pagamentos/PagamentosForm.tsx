import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconClock } from "../../components/ui/icons";
import "./PagamentosForm.css";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, parseCurrency } from "../../utils/masks";
import { isAdmin } from "../../utils/auth";

const API = `${API_URL}/api`;

interface Caixa {
  id_caixa: number;
  data: string;
  funcionario_nome: string;
  saldo_atual?: number;
}

const IconArrowLeft = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconSave = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

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

type Tipo = "sangria" | "despesa" | null;

export default function PagamentosForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipo, setTipo] = useState<Tipo>(null);

  // Despesa
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [caixaId, setCaixaId] = useState<number | null>(null);

  // Sangria
  const [sangriaValor, setSangriaValor] = useState("");
  const [sangriaOrigem, setSangriaOrigem] = useState<number | null>(null);
  const [sangriaDestino, setSangriaDestino] = useState<number | null>(null);

  const [caixasAbertos, setCaixasAbertos] = useState<Caixa[]>([]);
  const { toast, show: showToast } = useToast();
  const [souAdmin] = useState(isAdmin());

  // Carrega todos os caixas abertos
  useEffect(() => {
    if (isEditing) return;
    async function fetchCaixas() {
      try {
        const res = await fetchWithAuth(`${API}/caixa/abertos/todos`);
        if (!res.ok) return;
        const data: Caixa[] = await res.json();
        setCaixasAbertos(data);
        // Defaults
        if (data.length > 0) {
          setCaixaId(data[0].id_caixa);
          setSangriaOrigem(data[0].id_caixa);
          if (data.length > 1) setSangriaDestino(data[1].id_caixa);
        }
      } catch { /* ignore */ }
    }
    fetchCaixas();
  }, [isEditing]);

  // Carrega dados se for edição
  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    setTipo("despesa"); // edição só existe para despesas
    async function fetchPagamento() {
      try {
        const res = await fetchWithAuth(`${API}/pagamentos/${id}`);
        if (!res.ok) throw new Error('Erro ao carregar');
        const data = await res.json();
        setDescricao(data.descricao || "");
        setValor(formatCurrencyValue(Number(data.valor || 0)));
      } catch {
        showToast('Erro ao carregar pagamento', 'err');
        navigate('/pagamentos');
      } finally {
        setLoading(false);
      }
    }
    fetchPagamento();
  }, [id, isEditing]);

  const handleSubmitDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) { showToast('Descrição é obrigatória', 'err'); return; }

    if (isEditing) {
      setSaving(true);
      try {
        const res = await fetchWithAuth(`${API}/pagamentos/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ descricao }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao salvar'); }
        showToast('Descrição atualizada com sucesso!', 'ok');
        setTimeout(() => navigate('/pagamentos'), 1200);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'err');
      } finally { setSaving(false); }
      return;
    }

    if (parseCurrency(valor) <= 0) { showToast('Valor deve ser maior que zero', 'err'); return; }
    if (caixasAbertos.length === 0) { showToast('Nenhum caixa aberto.', 'err'); return; }
    if (souAdmin && !caixaId) { showToast('Selecione o caixa de origem', 'err'); return; }

    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API}/pagamentos`, {
        method: 'POST',
        body: JSON.stringify({
          descricao,
          valor: parseCurrency(valor),
          ...(souAdmin ? { id_caixa: caixaId } : {}),
          forma_pagamento: 'dinheiro',
          data_vencimento: new Date().toISOString().split('T')[0],
          status: 'pago',
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao salvar'); }
      showToast('Despesa registrada com sucesso!', 'ok');
      setTimeout(() => navigate('/pagamentos'), 1200);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'err');
    } finally { setSaving(false); }
  };

  const handleSubmitSangria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseCurrency(sangriaValor) <= 0) { showToast('Valor deve ser maior que zero', 'err'); return; }
    if (souAdmin && !sangriaOrigem) { showToast('Selecione o caixa de origem', 'err'); return; }
    if (!sangriaDestino) { showToast('Selecione o caixa de destino', 'err'); return; }
    if (sangriaOrigem === sangriaDestino) { showToast('Origem e destino não podem ser iguais', 'err'); return; }

    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API}/pagamentos/sangria`, {
        method: 'POST',
        body: JSON.stringify({
          valor: parseCurrency(sangriaValor),
          ...(souAdmin ? { id_caixa_origem: sangriaOrigem } : {}),
          id_caixa_destino: sangriaDestino,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao realizar sangria'); }
      showToast('Sangria realizada com sucesso!', 'ok');
      setTimeout(() => navigate('/pagamentos'), 1200);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao realizar sangria', 'err');
    } finally { setSaving(false); }
  };

  const caixasDestino = caixasAbertos.filter(c => c.id_caixa !== sangriaOrigem);
  const caixaOrigemSaldo = caixasAbertos.find(c => c.id_caixa === sangriaOrigem)?.saldo_atual;

  const labelCaixa = (c: Caixa) =>
    `Caixa #${c.id_caixa} — ${c.funcionario_nome} (${new Date(c.data).toLocaleDateString("pt-BR")})`;

  if (loading) {
    return (
      <div className="pagamentos-wrapper">
        <Sidebar />
        <div className="pagamentos-page">
          <div className="empty-state">
            <div className="big-icon"><IconClock style={{ width: 32, height: 32 }} /></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pagamentos-wrapper">
      <Sidebar />
      <div className="pagamentos-page">
        <header className="p-topbar">
          <div className="p-topbar-title">
            {isEditing ? 'Editar Despesa' : tipo === 'sangria' ? 'Nova Sangria' : tipo === 'despesa' ? 'Nova Despesa' : 'Nova Movimentação'}
          </div>
          <div className="p-topbar-actions">
            <button className="btn btn-back" onClick={() => tipo && !isEditing ? setTipo(null) : navigate('/pagamentos')}>
              <IconArrowLeft /> {tipo && !isEditing ? 'Voltar' : 'Voltar'}
            </button>
          </div>
        </header>

        <div className="p-content">
          <div className="form-card">

            {/* ── ETAPA 1: escolha o tipo ── */}
            {!tipo && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
                <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>O que você quer registrar?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "20px 16px", fontSize: 15, flexDirection: "column", gap: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setTipo("sangria")}
                  >
                    <span style={{ fontSize: 28 }}>🏧</span>
                    Sangria
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "20px 16px", fontSize: 15, flexDirection: "column", gap: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e4e4e7" }}
                    onClick={() => setTipo("despesa")}
                  >
                    <span style={{ fontSize: 28 }}>💸</span>
                    Despesa
                  </button>
                </div>
              </div>
            )}

            {/* ── ETAPA 2A: Sangria ── */}
            {tipo === "sangria" && (
              <form onSubmit={handleSubmitSangria}>
                <div className="form-grid">

                  <div className="form-group full-width">
                    <label>Valor (R$) *</label>
                    <input
                      type="text"
                      value={sangriaValor}
                      onChange={(e) => setSangriaValor(formatCurrencyInput(e.target.value))}
                      inputMode="decimal"
                      placeholder="0,00"
                      required
                    />
                    {caixaOrigemSaldo !== undefined && (
                      <span style={{ fontSize: 12, color: "#667085", marginTop: 4, display: "block" }}>
                        Saldo disponível: <strong>R$ {Number(caixaOrigemSaldo).toFixed(2).replace('.', ',')}</strong>
                      </span>
                    )}
                  </div>

                  {/* Origem — admin escolhe, caixa usa o próprio */}
                  {souAdmin && (
                    <div className="form-group">
                      <label>Caixa de origem *</label>
                      {caixasAbertos.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#ef4444", padding: "9px 12px", background: "#fef2f2", borderRadius: 8, margin: 0 }}>
                          ⚠️ Nenhum caixa aberto.
                        </p>
                      ) : (
                        <select
                          value={sangriaOrigem || ""}
                          onChange={(e) => {
                            setSangriaOrigem(Number(e.target.value));
                            setSangriaDestino(null);
                          }}
                          required
                        >
                          {caixasAbertos.map(c => (
                            <option key={c.id_caixa} value={c.id_caixa}>{labelCaixa(c)}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Destino */}
                  <div className="form-group">
                    <label>Caixa de destino *</label>
                    {caixasDestino.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#ef4444", padding: "9px 12px", background: "#fef2f2", borderRadius: 8, margin: 0 }}>
                        ⚠️ Nenhum outro caixa aberto para receber a sangria.
                      </p>
                    ) : (
                      <select
                        value={sangriaDestino || ""}
                        onChange={(e) => setSangriaDestino(Number(e.target.value))}
                        required
                      >
                        <option value="">Selecione...</option>
                        {caixasDestino.map(c => (
                          <option key={c.id_caixa} value={c.id_caixa}>{labelCaixa(c)}</option>
                        ))}
                      </select>
                    )}
                  </div>

                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setTipo(null)}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || caixasAbertos.length < 2}
                  >
                    <IconSave /> {saving ? 'Salvando...' : 'Confirmar Sangria'}
                  </button>
                </div>
              </form>
            )}

            {/* ── ETAPA 2B: Despesa ── */}
            {tipo === "despesa" && (
              <form onSubmit={handleSubmitDespesa}>
                <div className="form-grid">

                  <div className="form-group full-width">
                    <label htmlFor="descricao">Descrição *</label>
                    <input
                      type="text"
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Ex: Conta de energia, Fornecedor..."
                      required
                    />
                  </div>

                  {!isEditing && (
                    <div className="form-group">
                      <label htmlFor="valor">Valor (R$) *</label>
                      <input
                        type="text"
                        id="valor"
                        value={valor}
                        onChange={(e) => setValor(formatCurrencyInput(e.target.value))}
                        inputMode="decimal"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  )}

                  {!isEditing && souAdmin && (
                    <div className="form-group">
                      <label>Caixa de origem *</label>
                      {caixasAbertos.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#ef4444", padding: "9px 12px", background: "#fef2f2", borderRadius: 8, margin: 0 }}>
                          ⚠️ Nenhum caixa aberto.
                        </p>
                      ) : (
                        <select
                          value={caixaId || ""}
                          onChange={(e) => setCaixaId(Number(e.target.value))}
                          required
                        >
                          {caixasAbertos.map(c => (
                            <option key={c.id_caixa} value={c.id_caixa}>{labelCaixa(c)}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {!isEditing && !souAdmin && caixasAbertos.length === 0 && (
                    <div className="form-group full-width">
                      <p style={{ fontSize: 13, color: "#ef4444", padding: "9px 12px", background: "#fef2f2", borderRadius: 8, margin: 0 }}>
                        ⚠️ Nenhum caixa aberto.
                      </p>
                    </div>
                  )}

                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => isEditing ? navigate('/pagamentos') : setTipo(null)}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || (!isEditing && caixasAbertos.length === 0)}
                  >
                    <IconSave /> {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      <div className={`toast${toast.visible ? " show" : ""}`}>
        <span className={`toast-dot ${toast.type}`} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
} 