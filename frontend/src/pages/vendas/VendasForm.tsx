import "../../utils/toast";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { getUser } from "../../utils/auth";
import "./VendasForm.css";
import { formatCurrency } from "../../utils/format";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, formatNumberInput, parseCurrency } from "../../utils/masks";

const API = `${API_URL}/api`;

type Item = { id_produto: string; quantidade: string; valor_unitario: string };

interface ReciboData {
  id_venda: number;
  codigo_venda: string;
  cliente: string;
  itens: { nome: string; quantidade: number; valor_unitario: number; subtotal: number }[];
  valor_total: number;
}

export default function VendasForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getUser();
  const isEditing = !!id;
  const isAdminOuGerente = user?.nivel === 1 || user?.nivel === 2;

  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  const [idCliente, setIdCliente] = useState("");
  const [idVendedor, setIdVendedor] = useState(
    user?.id_funcionario ? String(user.id_funcionario) : ""
  );
  const [itens, setItens] = useState<Item[]>([
    { id_produto: "", quantidade: "1", valor_unitario: "" },
  ]);

  // pagamento vinculado
  const [idPagamento, setIdPagamento] = useState<number | null>(null);
  const [statusPagamento, setStatusPagamento] = useState("pendente");

  const [loading, setLoading] = useState(false);

  const [reciboData, setReciboData] = useState<ReciboData | null>(null);

  const enviandoRef = useRef(false);

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
      const res = await fetch(`${API}/funcionarios/vendedores`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setVendedores([]); return; }
      const data = await res.json();
      setVendedores(Array.isArray(data) ? data : []);
    } catch {
      setVendedores([]);
    }
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

      if (Array.isArray(d.itens) && d.itens.length) {
        setItens(d.itens.map((i: any) => ({
          id_produto: String(i.id_produto),
          quantidade: String(i.quantidade),
          valor_unitario: formatCurrencyValue(Number(i.valor_unitario || 0)),
        })));
      }

      // carrega o pagamento vinculado
      if (Array.isArray(d.pagamentos) && d.pagamentos.length) {
        const pag = d.pagamentos[0];
        setIdPagamento(pag.id_pagamento);
        setStatusPagamento(pag.status || "pendente");
      }
    } catch { alert("Erro ao carregar venda"); }
  }

  function atualizarItem(idx: number, campo: keyof Item, valor: string) {
    setItens((prev) => prev.map((it, i) => {
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
    setItens((prev) => [...prev, { id_produto: "", quantidade: "1", valor_unitario: "" }]);
  }

  function removerItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  const valorTotal = itens.reduce((s, it) => {
    return s + Number(it.quantidade || 0) * parseCurrency(it.valor_unitario || "");
  }, 0);

  function imprimirRecibo() {
    if (!reciboData) return;
    const win = window.open("", "_blank", "width=380,height=600");
    if (!win) return;

    const linhas = reciboData.itens.map(it => `
      <tr>
        <td style="padding:4px 0;">${it.nome}</td>
        <td style="text-align:center;padding:4px 0;">${it.quantidade}</td>
        <td style="text-align:right;padding:4px 0;">${formatCurrency(it.subtotal)}</td>
      </tr>
    `).join("");

    win.document.write(`
      <html>
        <head>
          <title>Venda #${reciboData.id_venda}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 16px; color: #111; }
            h2, h3 { text-align: center; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; border-bottom: 1px dashed #999; font-size: 11px; padding-bottom: 4px; }
            .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 1px dashed #999; padding-top: 6px; }
            .codigo { text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 4px; margin: 16px 0; padding: 10px; border: 2px dashed #333; }
            .info { text-align: center; font-size: 11px; color: #555; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h2>Comprovante de Venda</h2>
          <div class="info">Venda #${reciboData.id_venda} — Cliente: ${reciboData.cliente}</div>
          <table>
            <thead>
              <tr><th>Item</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Subtotal</th></tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
          <div class="total">Total: ${formatCurrency(reciboData.valor_total)}</div>
          <div class="codigo">${reciboData.codigo_venda}</div>
          <div class="info">Apresente este código no caixa para pagamento</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  async function salvar(e: any) {
    e.preventDefault();
    if (enviandoRef.current) return;

    if (!idVendedor) { alert("Vendedor é obrigatório"); return; }
    const itensValidos = itens.filter((i) => i.id_produto && Number(i.quantidade) > 0);
    if (!itensValidos.length) { alert("Adicione ao menos um item"); return; }

    enviandoRef.current = true;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const payload = {
        ...(idCliente ? { id_cliente: Number(idCliente) } : {}),
        id_vendedor: Number(idVendedor),
        valor_total: valorTotal,
        itens: itensValidos.map((i) => ({
          id_produto: Number(i.id_produto),
          quantidade: Number(i.quantidade),
          valor_unitario: parseCurrency(i.valor_unitario),
        })),
      };

      const res = await fetch(id ? `${API}/vendas/${id}` : `${API}/vendas`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json();
        alert(e.error || "Erro ao salvar");
        return;
      }

      // se está editando e tem pagamento vinculado, atualiza o status do pagamento
      if (isEditing && idPagamento && isAdminOuGerente) {
  await fetch(`${API}/pagamentos/${idPagamento}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: statusPagamento }),
  });
}

      const data = await res.json();

      if (data.codigo_venda) {
        setReciboData({
          id_venda: data.id_venda,
          codigo_venda: data.codigo_venda,
          cliente: data.cliente,
          itens: itensValidos.map((i) => {
            const p = produtos.find((pr: any) => String(pr.id_produto) === i.id_produto);
            const qtd = Number(i.quantidade);
            const valorUnit = parseCurrency(i.valor_unitario);
            return {
              nome: p?.nome || `Produto #${i.id_produto}`,
              quantidade: qtd,
              valor_unitario: valorUnit,
              subtotal: qtd * valorUnit,
            };
          }),
          valor_total: valorTotal,
        });
      } else {
        alert("Venda salva com sucesso!");
        navigate("/vendas");
      }
    } catch { alert("Erro ao salvar"); }
    finally {
      setLoading(false);
      enviandoRef.current = false;
    }
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">
            {isEditing ? "Editar Venda" : "Nova Venda"}
          </div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/vendas")}>
              Voltar
            </button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvar}>
            <h3 className="form-card-title">Dados da Venda</h3>

            <div className="form-grid">
              <div>
                <label>Cliente</label>
                <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
                  <option value="">Consumidor final (sem cadastro)</option>
                  {clientes.map((c: any) => (
                    <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Vendedor *</label>
                {user?.nivel === 3 ? (
                  <input type="text" value={user.nome || "Você"} disabled />
                ) : (
                  <select value={idVendedor} onChange={(e) => setIdVendedor(e.target.value)}>
                    <option value="">Selecione</option>
                    {vendedores.map((v: any) => (
                      <option key={v.id_funcionario} value={v.id_funcionario}>{v.nome}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status do pagamento — só na edição para admin/gerente */}
              {isEditing && isAdminOuGerente && idPagamento && (
                <div>
                  <label>Status do pagamento</label>
                  <select value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)}>
                    <option value="pendente">Pendente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              )}
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
                        <select value={it.id_produto} onChange={(e) => atualizarItem(idx, "id_produto", e.target.value)}>
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
                          onChange={(e) => atualizarItem(idx, "quantidade", formatNumberInput(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={it.valor_unitario}
                          onChange={(e) => atualizarItem(idx, "valor_unitario", formatCurrencyInput(e.target.value))}
                        />
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatCurrency(sub)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ height: 36, padding: "0 12px" }}
                          onClick={() => removerItem(idx)}
                          disabled={itens.length === 1}
                        >×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={adicionarItem}>
                + Adicionar item
              </button>
            </div>

            <div className="total-line">
              <span>Total:</span>
              <span>{formatCurrency(valorTotal)}</span>
            </div>

            {reciboData && (
              <div className="confirm-overlay open">
                <div className="confirm-box" style={{ textAlign: "center", maxWidth: 400 }}>
                  <h3>Venda registrada!</h3>
                  <p style={{ color: "#667085", fontSize: 14, marginBottom: 12 }}>
                    Venda #{reciboData.id_venda} — Cliente: {reciboData.cliente}
                  </p>

                  <div style={{ textAlign: "left", fontSize: 13, marginBottom: 12, maxHeight: 160, overflowY: "auto" }}>
                    {reciboData.itens.map((it, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <span>{it.quantidade}x {it.nome}</span>
                        <strong>{formatCurrency(it.subtotal)}</strong>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                    Total: {formatCurrency(reciboData.valor_total)}
                  </div>

                  <p style={{ color: "#667085", fontSize: 14, marginBottom: 8 }}>
                    Entregue este código ao cliente para apresentar no caixa:
                  </p>
                  <div style={{
                    fontSize: 36, fontWeight: 800, letterSpacing: 6,
                    color: "#6366f1", background: "#eef2ff",
                    borderRadius: 12, padding: "20px 32px", marginBottom: 24,
                    fontFamily: "monospace"
                  }}>
                    {reciboData.codigo_venda}
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button type="button" className="btn btn-ghost" onClick={imprimirRecibo}>
                      Imprimir recibo
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/vendas")}>
                      Concluir
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/vendas")}>
                Cancelar
              </button>
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