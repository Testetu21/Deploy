import "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import "./FornecedorForm.css";
import API_URL from "../../utils/api";
import { formatPhone } from "../../utils/masks";

const API = `${API_URL}/api`;

export default function FornecedorForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (id) fetchFornecedor(); }, [id]);

  async function fetchFornecedor() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/fornecedores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Erro ao carregar fornecedor"); return; }
      const d = await res.json();
      setNome(d.nome || "");
      setTelefone(d.telefone || "");
      setEmail(d.email || "");
      setEndereco(d.endereco || "");
    } catch { alert("Erro ao carregar fornecedor"); }
  }

  async function salvar(e: any) {
    e.preventDefault();
    if (!nome) { alert("Nome é obrigatório"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        nome,
        telefone: telefone || null,
        email: email || null,
        endereco: endereco || null,
      };
      const res = await fetch(
        id ? `${API}/fornecedores/${id}` : `${API}/fornecedores`,
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("Salvo com sucesso!");
      navigate("/fornecedores");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">{id ? "Editar Fornecedor" : "Novo Fornecedor"}</div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/fornecedores")}>Voltar</button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvar}>
            <h3 className="form-card-title">Dados do Fornecedor</h3>

            <div className="form-grid">
              <div className="full">
                <label>Nome / Razão social *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Ferramentas LTDA" />
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

              <div>
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onInvalid={(e) => e.currentTarget.setCustomValidity("Informe um e-mail válido")}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                  placeholder="contato@empresa.com"
                />
              </div>


            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/fornecedores")}>Cancelar</button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Fornecedor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
