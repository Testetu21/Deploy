import "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { getUser } from "../../utils/auth";
import "./VendasForm.css";
import { formatCurrency } from "../../utils/format";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, formatNumberInput, parseCurrency } from "../../../utils/masks";

const API = `${API_URL}/api`;

type Item = { id_produto: string; quantidade: string; valor_unitario: string };

export default function VendasForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getUser();

  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  const [idCliente, setIdCliente] = useState("");
  const [idVendedor, setIdVendedor] = useState(user?.id_funcionario ? String(user.id_funcionario) : "");
  const [status, setStatus] = useState("1");
  const [itens, setItens] = useState<Item[]>([{ id_produto: "", quantidade: "1", valor_unitario: "" }]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
    fetchVendedores();
    fetchProdutos();
    if (id) fetchVenda();
  }, [id]);

  async function fetchClientes() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/clientes`, { headers: { Authorization: `Bearer ${token}` } });
      setClientes(await res.json());
    } catch { alert("Erro ao carregar clientes"); }
  }
  async function fetchVendedores() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/funcionarios?cargo=3`, { headers: { Authorization: `Bearer ${token}` } });
      setVendedores(await res.json());
    } catch { /* ignore */ }
  }
  async function fetchProdutos() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/produtos`, { headers: { Authorization: `Bearer ${token}` } });
      setProdutos(await res.json());
    } catch { alert("Erro ao carregar produtos"); }
  }

  async function fetchVenda() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/vendas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { alert("Erro ao carregar venda"); return; }
      const d = await res.json();
      setIdCliente(String(d.id_cliente || ""));
      setIdVendedor(String(d.id_vendedor || ""));
      setStatus(String(d.status ?? "1"));
      if (Array.isArray(d.itens) && d.itens.length) {
        setItens(d.itens.map((i: any) => ({
          id_produto: String(i.id_produto),
          quantidade: String(i.quantidade),
          valor_unitario: String(i.valor_unitario),
        })));
      }
    } catch { alert("Erro ao carregar venda"); }
  }

  function atualizarItem(idx: number, campo: keyof Item, valor: string) {
    setItens(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const novo = { ...it, [campo]: valor };
      if (campo === "id_produto") {
        const p = produtos.find((p: any) => String(p.id_produto) === valor);
        if (p) novo.valor_unitario = formatCurrencyValue(Number(p.preco_venda || 0));
      }
      return novo;
    }));
  }
  function adicionarItem() {
    setItens(prev => [...prev, { id_produto: "", quantidade: "1", valor_unitario: "" }]);
  }
  function removerItem(idx: number) {
    setItens(prev => prev.filter((_, i) => i !== idx));
  }

  const valorTotal = itens.reduce((s, it) => {
    const q = Number(it.quantidade || 0);
    const v = parseCurrency(it.valor_unitario || "");
    return s + q * v;
  }, 0);

  async function salvar(e: any) {
    e.preventDefault();
    if (!idCliente || !idVendedor) { alert("Cliente e vendedor são obrigatórios"); return; }
    const itensValidos = itens.filter(i => i.id_produto && Number(i.quantidade) > 0);
    if (!itensValidos.length) { alert("Adicione ao menos um item"); return; }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        id_cliente: Number(idCliente),
        id_vendedor: Number(idVendedor),
        valor_total: valorTotal,
        status: Number(status),
        itens: itensValidos.map(i => ({
          id_produto: Number(i.id_produto),
          quantidade: Number(i.quantidade),
          valor_unitario: parseCurrency(i.valor_unitario),
        })),
      };
      const res = await fetch(
        id ? `${API}/vendas/${id}` : `${API}/vendas`,
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) { const e = await res.json(); alert(e.error || "Erro ao salvar"); return; }
      alert("Venda salva com sucesso!");
      navigate("/vendas");
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">{id ? "Editar Venda" : "Nova Venda"}</div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/vendas")}>Voltar</button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvar}>
            <h3 className="form-card-title">Dados da Venda</h3>

            <div className="form-grid">
              <div>
                <label>Cliente *</label>
                <select value={idCliente} onChange={e => setIdCliente(e.target.value)}>
                  <option value="">Selecione</option>
                  {clientes.map((c: any) => (
                    <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Vendedor *</label>
                <select value={idVendedor} onChange={e => setIdVendedor(e.target.value)}>
                  <option value="">Selecione</option>
                  {vendedores.map((v: any) => (
                    <option key={v.id_funcionario} value={v.id_funcionario}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="1">Concluída</option>
                  <option value="0">Cancelada</option>
                </select>
              </div>
            </div>

            <h3 className="form-section-title">Itens</h3>

            <table className="itens-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Produto</th>
                  <th>Qtd</th>
                  <th>Valor unit.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it, idx) => {
                  const sub = Number(it.quantidade || 0) * parseCurrency(it.valor_unitario || "");
                  return (
                    <tr key={idx}>
                      <td>
                        <select value={it.id_produto} onChange={e => atualizarItem(idx, "id_produto", e.target.value)}>
                          <option value="">Selecione</option>
                          {produtos.map((p: any) => (
                            <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={it.quantidade}
                          onChange={e => atualizarItem(idx, "quantidade", formatNumberInput(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={it.valor_unitario}
                          onChange={e => atualizarItem(idx, "valor_unitario", formatCurrencyInput(e.target.value))}
                        />
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatCurrency(sub)}</td>
                      <td>
                        <button type="button" className="btn btn-ghost" style={{ height: 36, padding: "0 12px" }}
                          onClick={() => removerItem(idx)} disabled={itens.length === 1}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={adicionarItem}>+ Adicionar item</button>
            </div>

            <div className="total-line">
              <span>Total:</span>
              <span>{formatCurrency(valorTotal)}</span>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/vendas")}>Cancelar</button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Venda"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
