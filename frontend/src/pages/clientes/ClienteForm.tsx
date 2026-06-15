import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import "./ClienteForm.css";
import API_URL from "../../utils/api";
import "../../utils/toast";
import { formatCpfCnpj, formatNumberInput, formatPhone, isValidBrazilianPhone } from "../../utils/masks";

const API = `${API_URL}/api`;

export default function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [ativo, setAtivo] = useState("1");

  const [loading, setLoading] = useState(false);

  useEffect(() => { if (id) fetchCliente(); }, [id]);

  async function fetchCliente() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Erro ao carregar cliente"); return; }
      const d = await res.json();
      setNome(d.nome || "");
      setCpfCnpj(d.cpf_cnpj || "");
      setTelefone(d.telefone || "");
      setEmail(d.email || "");
      setEndereco(d.endereço || d.endereco || "");
      setUsuario(d.usuario || "");
      setAtivo(String(d.ativo ?? "1"));
    } catch { alert("Erro ao carregar cliente"); }
  }

  async function salvar(e: any) {
    e.preventDefault();
    if (!nome) { alert("Nome é obrigatório"); return; }
    if (!id && !usuario) { alert("Usuário é obrigatório"); return; }
    if (!id && !senha) { alert("Senha é obrigatória"); return; }
    if (telefone && !isValidBrazilianPhone(telefone)) {
      alert("Informe um telefone válido com DDD. Exemplo: (85) 99999-9999 ou (85) 3333-4444");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload: any = {
        nome,
        cpf_cnpj: cpfCnpj ? formatNumberInput(cpfCnpj, 14) : null,
        telefone: telefone ? formatNumberInput(telefone, 11) : null,
        email: email || null,
        endereço: endereco || null,
        usuario: usuario || null,
        ativo: Number(ativo),
        nivel_acesso: 6,
      };
      if (senha) payload.senha = senha;

      const res = await fetch(
        id ? `${API}/clientes/${id}` : `${API}/clientes`,
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("Salvo com sucesso!");
      navigate("/clientes");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">{id ? "Editar Cliente" : "Novo Cliente"}</div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/clientes")}>Voltar</button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvar}>
            <h3 className="form-card-title">Dados do Cliente</h3>

            <div className="form-grid">
              <div className="full">
                <label>Nome *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              </div>

              <div>
                <label>CPF / CNPJ</label>
                <input
                  value={cpfCnpj}
                  onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label>Telefone</label>
                <input
                  value={telefone}
                  onChange={e => setTelefone(formatPhone(e.target.value))}
                  placeholder="(85) 99999-9999"
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>

              <div className="full">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onInvalid={(e) => e.currentTarget.setCustomValidity("Informe um e-mail válido")}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label>{id ? "Usuário" : "Usuário *"}</label>
                <input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Login do cliente" required={!id} />
              </div>

              <div>
                <label>{id ? "Nova senha (opcional)" : "Senha *"}</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••" required={!id} />
              </div>

              {id && (
                <div>
                  <label>Status</label>
                  <select value={ativo} onChange={e => setAtivo(e.target.value)}>
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/clientes")}>Cancelar</button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Cliente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
