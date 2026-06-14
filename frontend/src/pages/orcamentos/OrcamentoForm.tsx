import "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import "./OrcamentoForm.css";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, parseCurrency } from "../../utils/masks";
import { getUser } from "../../utils/auth";
  
const API = `${API_URL}/api`;

export default function OrcamentoForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = getUser();
  const nivel = Number(user?.nivel ?? (user as any)?.nivel_acesso ?? 0);
  const isTecnico = nivel === 4;

  const [clientes, setClientes] = useState<any[]>([]);

  const [idCliente, setIdCliente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [validade, setValidade] = useState("");

  // 🔥 AGORA STRING
  const [status, setStatus] = useState("pendente");
  const [tipo, setTipo] = useState("normal");

  const [loading, setLoading] = useState(false);

  // =========================
  // LOAD
  // =========================
  useEffect(() => {
    fetchClientes();

    if (id) {
      fetchOrcamento();
    } else {
      setData(new Date().toISOString().split("T")[0]);
    }
  }, [id]);

  async function fetchClientes() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Erro ao carregar clientes", e); }
  }

  async function fetchOrcamento() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/orcamentos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    setIdCliente(String(data.id_cliente));
    setDescricao(data.descricao || "");
    setValor(formatCurrencyValue(Number(data.valor_total || 0)));
    setData(data.data ? data.data.split("T")[0] : "");
    setValidade(data.validade ? data.validade.split("T")[0] : "");

    // 🔥 GARANTE QUE VEM COMO STRING
    setStatus(data.status || "pendente");
    setTipo(data.tipo || "normal");
  }

  // =========================
  // SAVE
  // =========================
  async function salvar(e: any) {
    e.preventDefault();

    if (!descricao || parseCurrency(valor) <= 0 || !validade) {
  alert("Preencha descrição, valor e validade");
  return;
}

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const payload = {
        id_cliente: Number(idCliente),
        descricao,
        valor_total: parseCurrency(valor),
        data,
        validade,
        ...(id ? { status } : {}),
      };

      const url = id
        ? `${API}/orcamentos/${id}`
        : `${API}/orcamentos`;

      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao salvar");
        return;
      }

      alert("Orçamento salvo com sucesso!");
      navigate("/orcamentos");

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="funcionarios-wrapper">
      <Sidebar />

      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">
            {id ? "Editar Orçamento" : "Novo Orçamento"}
          </div>

          <div className="p-topbar-actions">
            <button
              type="button"
              className="btn btn-back"
              onClick={() => navigate("/orcamentos")}
            >
              Voltar
            </button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvar}>
            <h3 className="form-card-title">Dados do Orçamento</h3>

            {/* CLIENTE */}
            <label>Cliente</label>
            <select
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
            >
              <option value="">Consumidor final (sem cadastro)</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nome}
                </option>
              ))}
            </select>

            {/* STATUS — só na edição */}
            {id && (
              <>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pendente">Pendente</option>
                  <option value="aceito">Aceito</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </>
            )}

            {/* DESCRIÇÃO */}
            <label>Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            {/* VALOR */}
            <label>Valor</label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(formatCurrencyInput(e.target.value))}
              inputMode="decimal"
              placeholder="R$ 0,00"
            />

            {/* VALIDADE */}
            <label>Validade</label>
            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
            />

            {/* BOTÕES */}
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("/orcamentos")}
              >
                Cancelar
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}