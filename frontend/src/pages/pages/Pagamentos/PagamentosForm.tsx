import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconClock } from "../../components/ui/icons";
import "./PagamentosForm.css";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, parseCurrency } from "../../../utils/masks";

const API = `${API_URL}/api`;

interface Cliente {
  id_cliente: number;
  nome: string;
}

interface Venda {
  id_venda: number;
  valor_total: number;
  data_venda: string;
  cliente_nome: string;
}

interface PagamentoFormData {
  valor: string;
  data_pagamento: string;
  forma_pagamento: string;
  status: number;
  descricao: string;
  id_venda: number | null;
  id_cliente: number;
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
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast, show: showToast } = useToast();
  
  const [formData, setFormData] = useState<PagamentoFormData>({
    valor: "",
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'dinheiro',
    status: 1,
    descricao: '',
    id_venda: null,
    id_cliente: 0
  });

  // Buscar clientes - CORRIGIDO
useEffect(() => {
  async function fetchClientes() {
    try {
      const res = await fetchWithAuth(`${API}/clientes`);
      if (!res.ok) throw new Error('Erro ao carregar clientes');
      const data = await res.json();
      setClientes(data);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar lista de clientes', 'err');
    }
  }
  
  fetchClientes();
}, []);

// Buscar vendas - CORRIGIDO
useEffect(() => {
  async function fetchVendas() {
    try {
      const res = await fetchWithAuth(`${API}/vendas`);
      if (!res.ok) throw new Error('Erro ao carregar vendas');
      const data = await res.json();
      setVendas(data);
    } catch (err) {
      console.error(err);
    }
  }
  
  fetchVendas();
}, []);

  // Buscar dados se for edição
  useEffect(() => {
    async function fetchPagamento() {
      if (!isEditing) return;
      
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API}/pagamentos/${id}`);
        if (!res.ok) throw new Error('Erro ao carregar pagamento');
        const data = await res.json();
        
        setFormData({
          valor: formatCurrencyValue(Number(data.valor || 0)),
          data_pagamento: data.data_pagamento ? data.data_pagamento.split('T')[0] : '',
          forma_pagamento: data.forma_pagamento,
          status: data.status,
          descricao: data.descricao || '',
          id_venda: data.id_venda,
          id_cliente: data.id_cliente
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'valor') {
      setFormData(prev => ({ ...prev, [name]: formatCurrencyInput(value) }));
    } else if (name === 'id_cliente' || name === 'id_venda' || name === 'status') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.id_cliente || formData.id_cliente === 0) {
      showToast('Selecione um cliente', 'err');
      return;
    }
    
    if (parseCurrency(formData.valor) <= 0) {
      showToast('Valor do pagamento deve ser maior que zero', 'err');
      return;
    }
    
    if (!formData.forma_pagamento) {
      showToast('Selecione uma forma de pagamento', 'err');
      return;
    }
    
    setSaving(true);
    
    try {
      let url = `${API}/pagamentos`;
      let method = 'POST';
      
      if (isEditing) {
        url = `${API}/pagamentos/${id}`;
        method = 'PUT';
      }
      
      const payload = {
        ...formData,
        valor: parseCurrency(formData.valor),
      };

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }
      
      showToast(isEditing ? 'Pagamento atualizado com sucesso!' : 'Pagamento registrado com sucesso!', 'ok');
      
      setTimeout(() => {
        navigate('/pagamentos');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Erro ao salvar pagamento', 'err');
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
            Pagamentos <span>{isEditing ? 'Editar Pagamento' : 'Novo Pagamento'}</span>
          </div>
          <div className="p-topbar-actions">
            <button className="btn btn-back" onClick={() => navigate('/pagamentos')}>
              <IconArrowLeft /> Voltar
            </button>
          </div>
        </header>

        <div className="p-content">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Cliente */}
                <div className="form-group">
                  <label htmlFor="id_cliente">Cliente *</label>
                  <select
                    id="id_cliente"
                    name="id_cliente"
                    value={formData.id_cliente}
                    onChange={handleChange}
                    required
                  >
                    <option value={0}>Selecione um cliente...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data Pagamento */}
                <div className="form-group">
                  <label htmlFor="data_pagamento">Data do Pagamento *</label>
                  <input
                    type="date"
                    id="data_pagamento"
                    name="data_pagamento"
                    value={formData.data_pagamento}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Valor */}
                <div className="form-group">
                  <label htmlFor="valor">Valor (R$) *</label>
                  <input
                      type="text"
                    id="valor"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                      inputMode="decimal"
                    required
                  />
                </div>

                {/* Forma Pagamento */}
                <div className="form-group">
                  <label htmlFor="forma_pagamento">Forma de Pagamento *</label>
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

                {/* Status */}
                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value={1}>Pago</option>
                    <option value={0}>Pendente</option>
                  </select>
                </div>

                {/* Venda (opcional) */}
                <div className="form-group">
                  <label htmlFor="id_venda">Venda (opcional)</label>
                  <select
                    id="id_venda"
                    name="id_venda"
                    value={formData.id_venda || 0}
                    onChange={handleChange}
                  >
                    <option value={0}>Nenhuma venda associada</option>
                    {vendas.map(venda => (
                      <option key={venda.id_venda} value={venda.id_venda}>
                        #{venda.id_venda} - {venda.cliente_nome} - {formatCurrencyValue(Number(venda.valor_total || 0))}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div className="form-group full-width">
                  <label htmlFor="descricao">Descrição</label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Observações sobre o pagamento..."
                  />
                </div>
              </div>

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