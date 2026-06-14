import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconAlert, IconClock, IconEye, IconMoney, IconSearch } from "../../components/ui/icons";
import "./movimentacoes.css";
import "../../styles/data-panel.css";
import API_URL from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { isAdmin } from "../../utils/auth";

const API = `${API_URL}/api`;

interface Movimentacao {
  id_movimentacao: number;
  tipo: "entrada" | "saida";
  valor: number;
  descricao?: string;
  data?: string;
}

interface Caixa {
  id_caixa: number;
  data: string;
  funcionario_nome: string;
  saldo_atual: number;
  total_entradas: number;
  total_saidas: number;
  valor_fechamento: number | null;
}

function getToken() {
  return localStorage.getItem("token") || "";
}

async function fetchWithAuth(url: string) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
}

export default function Movimentacoes() {
  const navigate = useNavigate();
  const souAdmin = isAdmin();

  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [caixaSelecionado, setCaixaSelecionado] = useState<number | null>(null);

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [totais, setTotais] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  // Carrega lista de caixas (admin)
  useEffect(() => {
    if (!souAdmin) return;
    async function loadCaixas() {
      try {
        const res = await fetchWithAuth(`${API}/caixa`);
        if (!res.ok) return;
        const data: Caixa[] = await res.json();
        setCaixas(data);
      } catch { /* ignore */ }
    }
    loadCaixas();
  }, [souAdmin]);

  // Carrega movimentações
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);

        let url = `${API}/movimentacoes`;
        if (souAdmin && caixaSelecionado) {
          url = `${API}/movimentacoes/caixa/${caixaSelecionado}`;
        } else if (souAdmin && !caixaSelecionado) {
          url = `${API}/movimentacoes/hoje`;
        }

        const res = await fetch(url, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 401) { navigate("/login"); return; }
          throw new Error("Falha ao carregar");
        }

        const data = await res.json();
        const movs = data.movimentacoes ?? (Array.isArray(data) ? data : []);
        setMovimentacoes(movs);
        setTotais(data.totais ?? { entradas: 0, saidas: 0, saldo: 0 });
      } catch (e: any) {
        if (!controller.signal.aborted) setMovimentacoes([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [navigate, souAdmin, caixaSelecionado]);

  const filtradas = useMemo(() => movimentacoes.filter((m) => {
    const matchSearch = (m.descricao || "").toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "todos" || m.tipo === filterTipo;
    return matchSearch && matchTipo;
  }), [movimentacoes, search, filterTipo]);

  const caixaAtual = caixas.find(c => c.id_caixa === caixaSelecionado);

  return (
    <div className="mov-wrapper">
      <Sidebar />
      <div className="mov-page">

        <header className="mov-topbar">
          <div className="mov-title-block">
            <span className="mov-chip">Financeiro</span>
            <h1>Movimentações</h1>
            <p>Visão organizada de entradas, saídas e saldo.</p>
          </div>
          <div className="mov-topbar-actions">
            <button className="btn btn-back" onClick={() => { setSearch(""); setFilterTipo("todos"); }} type="button">
              Limpar filtros
            </button>
          </div>
        </header>

        {/* Seletor de caixa — só pro admin */}
        {souAdmin && (
          <section style={{ padding: "0 24px 0", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {caixas.map(c => (
                <button
                  key={c.id_caixa}
                  onClick={() => setCaixaSelecionado(caixaSelecionado === c.id_caixa ? null : c.id_caixa)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "2px solid",
                    borderColor: caixaSelecionado === c.id_caixa ? "#6366f1" : "#e4e4e7",
                    background: caixaSelecionado === c.id_caixa ? "#eef2ff" : "#fff",
                    color: caixaSelecionado === c.id_caixa ? "#6366f1" : "#667085",
                    fontWeight: caixaSelecionado === c.id_caixa ? 700 : 400,
                    cursor: "pointer",
                    fontSize: 13,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    Caixa #{c.id_caixa} — {c.funcionario_nome}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: caixaSelecionado === c.id_caixa ? "#6366f1" : "#aaa" }}>
                    {new Date(c.data).toLocaleDateString("pt-BR")}
                    {c.valor_fechamento === null ? " · Aberto" : " · Fechado"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mov-hero">
          <div className="mov-hero-copy">
            <p className="mov-kicker">Resumo financeiro</p>
            <h2>
              {souAdmin && caixaAtual
                ? `Caixa #${caixaAtual.id_caixa} — ${caixaAtual.funcionario_nome}`
                : souAdmin
                ? "Todas as movimentações de hoje"
                : "Fluxo de caixa em uma única tela"}
            </h2>
            <p>Use os filtros para localizar registros com mais rapidez.</p>
          </div>

          <div className="mov-stats">
            <article className="mov-card entrada">
              <span className="mov-card-icon"><IconMoney /></span>
              <div>
                <p>Entradas</p>
                <strong>{formatCurrency(totais.entradas)}</strong>
              </div>
            </article>
            <article className="mov-card saida">
              <span className="mov-card-icon"><IconAlert /></span>
              <div>
                <p>Saídas</p>
                <strong>{formatCurrency(totais.saidas)}</strong>
              </div>
            </article>
            <article className="mov-card saldo">
              <span className="mov-card-icon"><IconClock /></span>
              <div>
                <p>Saldo</p>
                <strong>{formatCurrency(totais.saldo)}</strong>
              </div>
            </article>
          </div>
        </section>

        <section className="mov-panel">
          <div className="mov-filters">
            <label className="mov-search">
              <IconSearch />
              <input
                type="text"
                placeholder="Buscar por descrição"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="mov-select-group">
              <label htmlFor="mov-tipo">Tipo</label>
              <select id="mov-tipo" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div className="mov-summary-pill">
              {filtradas.length} registro{filtradas.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="data-panel">
            {loading ? (
              <div className="dp-loading">
                <div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div>
                <p>Carregando movimentações...</p>
              </div>
            ) : filtradas.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><IconMoney style={{ width: 32, height: 32 }} /></div>
                <p>Nenhuma movimentação encontrada.</p>
              </div>
            ) : (
              <div className="dp-table-wrap">
                <table className="dp-table dp-table-actions">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((m) => (
                      <tr key={m.id_movimentacao}>
                        <td>
                          <span className={`badge ${m.tipo}`}>
                            {m.tipo === "entrada" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td>{m.descricao || "-"}</td>
                        <td className={m.tipo === "entrada" ? "positive" : "negative"}>
                          {m.tipo === "entrada" ? "+" : "-"}{formatCurrency(m.valor)}
                        </td>
                        <td>{formatDateTime(m.data)}</td>
                        <td>
                          <div className="dp-row-actions">
                            <button className="dp-btn-icon dp-view" title="Ver detalhes"
                              onClick={() => navigate("/detalhes", { state: { title: "Movimentação", data: m } })}>
                              <IconEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}