import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconClock } from "../../components/ui/icons";
import "./PagamentosForm.css";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, parseCurrency } from "../../../utils/masks";

const API = `${API_URL}/api`;

interface PagamentoFormData {
  valor: string;
  data_vencimento: string;
  forma_pagamento: string;
  status: string;
  descricao: string;
}

const IconArrowLeft = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconSave = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
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

export default function PagamentosForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusOriginal, setStatusOriginal] = useState<string>('pendente');
  const { toast, show: showToast } = useToast();

  const [formData, setFormData] = useState<PagamentoFormData>({
    valor: "",
    data_vencimento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'dinheiro',
    status: 'pendente',
    descricao: '',
  });

  // ── Carregar dados se for edição ────────────────────────────────────────────
  useEffect(() => {
    async function fetchPagamento() {
      if (!isEditing) return;

      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API}/pagamentos/${id}`);
        if (!res.ok) throw new Error('Erro ao carregar pagamento');
        const data = await res.json();

        setStatusOriginal(data.status);
        setFormData({
          valor: formatCurrencyValue(Number(data.valor || 0)),
          data_vencimento: data.data_vencimento ? data.data_vencimento.split('T')[0] : '',
          forma_pagamento: data.forma_pagamento,
          status: data.status,
          descricao: data.descricao || '',
        });
      } catch (err) {
        console.error(err);
        showToast('Erro ao carregar pagamento', 'err');
        navigate('/pagamentos');
      } finally {
        setLoading(false);
      }
    }

    fetchPagamento();
  }, [id, isEditing, navigate]);

  const jaPago = isEditing && statusOriginal === 'pago';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'valor') {
      setFormData(prev => ({ ...prev, [name]: formatCurrencyInput(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── EDIÇÃO DE PAGAMENTO JÁ PAGO: só envia status ──
    if (jaPago) {
      setSaving(true);
      try {
        const res = await fetchWithAuth(`${API}/pagamentos/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: formData.status }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao salvar');
        }

        showToast('Status atualizado com sucesso!', 'ok');
        setTimeout(() => navigate('/pagamentos'), 1200);
      } catch (err) {
        console.error(err);
        showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'err');
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── CRIAÇÃO OU EDIÇÃO NORMAL ──
    if (parseCurrency(formData.valor) <= 0) {
      showToast('Valor deve ser maior que zero', 'err');
      return;
    }
    if (!formData.descricao.trim()) {
      showToast('Descrição é obrigatória', 'err');
      return;
    }
    if (!formData.data_vencimento) {
      showToast('Data é obrigatória', 'err');
      return;
    }
    if (!formData.forma_pagamento) {
      showToast('Selecione uma forma de pagamento', 'err');
      return;
    }

    setSaving(true);

    try {
      const url    = isEditing ? `${API}/pagamentos/${id}` : `${API}/pagamentos`;
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        valor: parseCurrency(formData.valor),
        forma_pagamento: formData.forma_pagamento,
        descricao: formData.descricao,
        data_vencimento: formData.data_vencimento,
        status: formData.status,
      };

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      showToast(isEditing ? 'Pagamento atualizado com sucesso!' : 'Retirada registrada com sucesso!', 'ok');

      setTimeout(() => navigate('/pagamentos'), 1200);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pagamentos-wrapper">
        <Sidebar />
        <div className="pagamentos-page">
          <div className="empty-state">
            <div className="big-icon"><IconClock style={{ width: 32, height: 32 }} /></div>
            <p>Carregando pagamento...</p>
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
            Pagamentos <span>{isEditing ? 'Editar Retirada' : 'Nova Retirada'}</span>
          </div>
          <div className="p-topbar-actions">
            <button className="btn btn-back" onClick={() => navigate('/pagamentos')}>
              <IconArrowLeft /> Voltar
            </button>
          </div>
        </header>

        <div className="p-content">
          <div className="form-card">

            {jaPago && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
                fontSize: 13,
                color: '#92400e'
              }}>
                ⚠️ Este pagamento já foi confirmado. Você só pode alterar o <strong>status</strong>.
                Mudar para "Pendente" ou "Cancelado" vai estornar o valor no caixa.
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {jaPago ? (
                /* ── FORM REDUZIDO: SÓ STATUS ── */
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Descrição</label>
                    <input type="text" value={formData.descricao} disabled />
                  </div>
                  <div className="form-group">
                    <label>Valor</label>
                    <input type="text" value={formData.valor} disabled />
                  </div>
                  <div className="form-group">
                    <label>Forma de pagamento</label>
                    <input type="text" value={formData.forma_pagamento} disabled />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* ── FORM PADRÃO (criação ou edição não-paga) ── */
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="descricao">Descrição *</label>
                    <input
                      type="text"
                      id="descricao"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      placeholder="Ex: Conta de energia, Motoboy, Fornecedor..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="valor">Valor (R$) *</label>
                    <input
                      type="text"
                      id="valor"
                      name="valor"
                      value={formData.valor}
                      onChange={handleChange}
                      inputMode="decimal"
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="data_vencimento">Data *</label>
                    <input
                      type="date"
                      id="data_vencimento"
                      name="data_vencimento"
                      value={formData.data_vencimento}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="forma_pagamento">Forma de pagamento *</label>
                    <select
                      id="forma_pagamento"
                      name="forma_pagamento"
                      value={formData.forma_pagamento}
                      onChange={handleChange}
                      required
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="boleto">Boleto</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago (sai do caixa agora)</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/pagamentos')}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <IconSave /> {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
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