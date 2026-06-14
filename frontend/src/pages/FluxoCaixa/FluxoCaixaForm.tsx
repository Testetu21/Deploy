import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import "./FluxoCaixaForm.css";
import API_URL from "../../utils/api";
import { formatCurrencyInput, formatCurrencyValue, parseCurrency } from "../../utils/masks";
import { formatCurrency } from "../../utils/format";

const API = `${API_URL}/api`;

export default function FluxoCaixaForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [valorAbertura, setValorAbertura] = useState("");
  const [valorFechamento, setValorFechamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saldoAtual, setSaldoAtual] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(!!id);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (id) fetchCaixa();
  }, [id]);

  async function fetchCaixa() {
    try {
      setLoadingDados(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/caixa/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setErro("Erro ao carregar caixa"); return; }
      const d = await res.json();
      setValorAbertura(formatCurrencyValue(Number(d.valor_abertura ?? 0)));
      setSaldoAtual(Number(d.saldo_atual ?? 0));
      setObservacoes(d.observacoes || "");
      setValorFechamento(formatCurrencyValue(Number(d.saldo_atual ?? 0)));
    } catch {
      setErro("Erro ao carregar caixa");
    } finally {
      setLoadingDados(false);
    }
  }

  async function salvarCaixa(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!id) {
      if (parseCurrency(valorAbertura) < 0) {
        setErro("Valor de abertura não pode ser negativo");
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/caixa`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            valor_abertura: parseCurrency(valorAbertura),
            observacoes: observacoes || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setErro(err.error || "Erro ao abrir caixa");
          return;
        }
        navigate("/caixa");
      } catch {
        setErro("Erro ao conectar com o servidor");
      } finally {
        setLoading(false);
      }
    } else {
      const valorFech = parseCurrency(valorFechamento);
      if (saldoAtual !== null && Math.abs(valorFech - saldoAtual) > 0.01) {
        setErro(`Valor de fechamento deve ser igual ao saldo atual (${formatCurrency(saldoAtual)})`);
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/caixa/${id}/fechar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            valor_fechamento: valorFech,
            observacoes: observacoes || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setErro(err.error || "Erro ao fechar caixa");
          return;
        }
        navigate("/caixa");
      } catch {
        setErro("Erro ao conectar com o servidor");
      } finally {
        setLoading(false);
      }
    }
  }

  if (loadingDados) {
    return (
      <div className="funcionarios-wrapper">
        <Sidebar />
        <div className="funcionarios-page">
          <div style={{ padding: 40, textAlign: "center", color: "#667085" }}>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="funcionarios-wrapper">
      <Sidebar />
      <div className="funcionarios-page">
        <header className="p-topbar">
          <div className="p-topbar-title">{id ? "Fechar Caixa" : "Abrir Caixa"}</div>
          <div className="p-topbar-actions">
            <button type="button" className="btn btn-back" onClick={() => navigate("/caixa")}>
              Voltar
            </button>
          </div>
        </header>

        <div className="p-content">
          <form className="form-card" onSubmit={salvarCaixa}>
            <h3 className="form-card-title">{id ? "Fechamento de Caixa" : "Abertura de Caixa"}</h3>

            <div className="form-grid">

              {/* Abertura — só na criação */}
              {!id && (
                <div className="full">
                  <label>Valor de abertura *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorAbertura}
                    onChange={e => setValorAbertura(formatCurrencyInput(e.target.value))}
                    placeholder="R$ 0,00"
                  />
                </div>
              )}

              {/* Edição — fechamento */}
              {id && (
                <>
                  <div className="full">
                    <label>Valor de abertura</label>
                    <input
                      type="text"
                      value={valorAbertura}
                      readOnly
                      style={{ background: "#f4f4f5", color: "#667085", cursor: "not-allowed" }}
                    />
                  </div>

                  {saldoAtual !== null && (
                    <div className="full">
                      <label>Saldo atual</label>
                      <input
                        type="text"
                        value={formatCurrency(saldoAtual)}
                        readOnly
                        style={{ background: "#f0fdf4", color: "#16a34a", fontWeight: 600, cursor: "not-allowed" }}
                      />
                      <p style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
                        O valor de fechamento deve ser igual ao saldo atual.
                      </p>
                    </div>
                  )}

                  <div className="full">
                    <label>Valor de fechamento *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={valorFechamento}
                      onChange={e => setValorFechamento(formatCurrencyInput(e.target.value))}
                      placeholder="R$ 0,00"
                    />
                    {saldoAtual !== null && parseCurrency(valorFechamento) > 0 && (
                      <p style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: Math.abs(parseCurrency(valorFechamento) - saldoAtual) < 0.01
                          ? "#16a34a"
                          : "#ef4444"
                      }}>
                        {Math.abs(parseCurrency(valorFechamento) - saldoAtual) < 0.01
                          ? "✓ Valor confere com o saldo"
                          : `Diferença de ${formatCurrency(Math.abs(parseCurrency(valorFechamento) - saldoAtual))}`}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="full">
                <label>Observações</label>
                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Anotações sobre o caixa..."
                />
              </div>

            </div>

            {erro && (
              <p style={{ color: "#ef4444", fontSize: 13, margin: "8px 0 0" }}>
                ⚠️ {erro}
              </p>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/caixa")}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : id ? "Fechar caixa" : "Abrir caixa"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}