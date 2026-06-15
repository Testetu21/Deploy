import "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import "./ProdutoForm.css";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, formatNumberInput, parseCurrency } from "../../utils/masks";

const API = `${API_URL}/api`;

export default function ProdutoForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [fornecedores, setFornecedores] = useState<any[]>([]);

  const [nome, setNome] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [quantidadeEstoque, setQuantidadeEstoque] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [garantia, setGarantia] = useState("");
  const [idFornecedor, setIdFornecedor] = useState("");
  const [tipo, setTipo] = useState("1");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFornecedores();
    if (id) fetchProduto();
  }, [id]);

  async function fetchFornecedores() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/fornecedores`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setFornecedores([]); return; }
    const data = await res.json();
    setFornecedores(Array.isArray(data) ? data : []);
  } catch { setFornecedores([]); }
}

  async function fetchProduto() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/produtos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Erro ao carregar produto"); return; }
      const d = await res.json();
      setNome(d.nome || "");
      setPrecoCusto(formatCurrencyValue(Number(d.preco_custo ?? 0)));
      setPrecoVenda(formatCurrencyValue(Number(d.preco_venda ?? 0)));
      setQuantidadeEstoque(String(d.quantidade_estoque ?? ""));
      setEstoqueMinimo(String(d.estoque_minimo ?? ""));
      setGarantia(String(d.garantia ?? ""));
      setIdFornecedor(String(d.id_fornecedor ?? ""));
      setTipo(String(d.tipo ?? "1"));
    } catch { alert("Erro ao carregar produto"); }
  }

  async function salvar(e: any) {
    e.preventDefault();
    if (!nome || parseCurrency(precoVenda) <= 0 || parseCurrency(precoCusto) <= 0 || !idFornecedor) {
      alert("Nome, preço de custo, preço de venda e fornecedor são obrigatórios");
      return;
    }
    if (parseCurrency(precoVenda) <= parseCurrency(precoCusto)) {
      alert("Preço de venda deve ser maior que o de custo");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        nome,
        preco_custo: parseCurrency(precoCusto),
        preco_venda: parseCurrency(precoVenda),
        quantidade_estoque: Number(quantidadeEstoque || 0),
        estoque_minimo: Number(estoqueMinimo || 0),
        garantia: Number(garantia || 0),
        id_fornecedor: Number(idFornecedor),
        tipo: Number(tipo || 1),
      };
      const res = await fetch(
        id ? `${API}/produtos/${id}` : `${API}/produtos`,
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("Salvo com sucesso!");
      navigate("/produtos");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">{id ? "Editar Produto" : "Novo Produto"}</div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/produtos")}>Voltar</button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvar}>
            <h3 className="form-card-title">Dados do Produto</h3>

            <div className="form-grid">
              <div className="full">
                <label>Nome *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Furadeira Elétrica" />
              </div>

              <div>
                <label>Preço de custo *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precoCusto}
                  onChange={e => setPrecoCusto(formatCurrencyInput(e.target.value))}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label>Preço de venda *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precoVenda}
                  onChange={e => setPrecoVenda(formatCurrencyInput(e.target.value))}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label>Quantidade em estoque</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantidadeEstoque}
                  onChange={e => setQuantidadeEstoque(formatNumberInput(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <label>Estoque mínimo</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={estoqueMinimo}
                  onChange={e => setEstoqueMinimo(formatNumberInput(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <label>Garantia (meses)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={garantia}
                  onChange={e => setGarantia(formatNumberInput(e.target.value))}
                  placeholder="12"
                />
              </div>

              <div>
                <label>Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)}>
                  <option value="1">Ferramenta</option>
                  <option value="2">Peça</option>
                  <option value="3">Acessório</option>
                </select>
              </div>

              <div className="full">
                <label>Fornecedor *</label>
                <select value={idFornecedor} onChange={e => setIdFornecedor(e.target.value)}>
                  <option value="">Selecione</option>
                  {fornecedores.map((f: any) => (
                    <option key={f.id_fornecedor} value={f.id_fornecedor}>{f.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/produtos")}>Cancelar</button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Produto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
