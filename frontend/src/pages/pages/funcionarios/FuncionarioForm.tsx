import "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import "./FuncionarioForm.css";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, parseCurrency } from "../../../utils/masks";

const API = `${API_URL}/api`;

const CARGOS = [
  { value: "1", label: "Admin" },
  { value: "2", label: "Gerente" },
  { value: "3", label: "Vendedor" },
  { value: "4", label: "Técnico" },
  { value: "5", label: "Caixa" },
];

export default function FuncionarioForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("3");
  const [salario, setSalario] = useState("");
  const [percentualComissao, setPercentualComissao] = useState("0");
  const [ativo, setAtivo] = useState("1");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => { if (id) fetchFuncionario(); }, [id]);

  async function fetchFuncionario() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/funcionarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Erro ao carregar funcionário"); return; }
      const d = await res.json();
      setNome(d.nome || "");
      setCargo(String(d.cargo ?? "3"));
      setSalario(formatCurrencyValue(Number(d.salario ?? 0)));
      setPercentualComissao(String(d.percentual_comissao ?? "0"));
      setAtivo(String(d.ativo ?? "1"));
      setUsuario(d.usuario || "");
    } catch { alert("Erro ao carregar funcionário"); }
  }

  async function salvar(e: any) {
    e.preventDefault();
    if (!nome || parseCurrency(salario) <= 0) { alert("Nome e salário são obrigatórios"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload: any = {
        nome,
        cargo: Number(cargo),
        salario: parseCurrency(salario),
        percentual_comissao: Number(percentualComissao || 0),
        ativo: Number(ativo),
        usuario: usuario || null,
      };
      if (senha) payload.senha = senha;

      const res = await fetch(
        id ? `${API}/funcionarios/${id}` : `${API}/funcionarios`,
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("Salvo com sucesso!");
      navigate("/funcionarios");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">{id ? "Editar Funcionário" : "Novo Funcionário"}</div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/funcionarios")}>Voltar</button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvar}>
            <h3 className="form-card-title">Dados do Funcionário</h3>

            <div className="form-grid">
              <div className="full">
                <label>Nome *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              </div>

              <div>
                <label>Cargo *</label>
                <select value={cargo} onChange={e => setCargo(e.target.value)}>
                  {CARGOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label>Status</label>
                <select value={ativo} onChange={e => setAtivo(e.target.value)}>
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </select>
              </div>

              <div>
                <label>Salário *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={salario}
                  onChange={e => setSalario(formatCurrencyInput(e.target.value))}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label>Comissão (%)</label>
                <input type="number" step="0.01" value={percentualComissao} onChange={e => setPercentualComissao(e.target.value)} placeholder="0,00" />
              </div>

              <div>
                <label>Usuário (login)</label>
                <input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="usuario" />
              </div>

              <div>
                <label>{id ? "Nova senha (opcional)" : "Senha"}</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••" />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/funcionarios")}>Cancelar</button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Funcionário"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
