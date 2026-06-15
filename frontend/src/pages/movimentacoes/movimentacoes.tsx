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
  id_caixa?: number;
  tipo: "entrada" | "saida";
  valor: number;
  descricao?: string;
  data?: string;
  funcionario_nome?: string;
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

async function fetchWithAuth(url: string, signal?: AbortSignal) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    signal,
  });
}

function mesmoDia(dataMovimento?: string, dataFiltro?: string) {
  if (!dataFiltro) return true;
  if (!dataMovimento) return false;
  const normalizada = String(dataMovimento).slice(0, 10);
  return normalizada === dataFiltro;
}

function calcularTotais(movs: Movimentacao[]) {
  const totais = movs.reduce((acc, m) => {
    const valor = Number(m.valor || 0);
    if (m.tipo === "entrada") acc.entradas += valor;
    else acc.saidas += valor;
    return acc;
  }, { entradas: 0, saidas: 0 });

  return { ...totais, saldo: totais.entradas - totais.saidas };
}

export default function Movimentacoes() {
  const navigate = useNavigate();
  const podeVerCaixas = isAdmin();

  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [caixaSelecionado, setCaixaSelecionado] = useState<string>("todos");
  const [dataSelecionada, setDataSelecionada] = useState("");

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  useEffect(() => {
    if (!podeVerCaixas) return;

    const controller = new AbortController();

    async function loadCaixas() {
      try {
        const res = await fetchWithAuth(`${API}/caixa`, controller.signal);
        if (!res.ok) return;
        const data: Caixa[] = await res.json();
        setCaixas(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }

    loadCaixas();
    return () => controller.abort();
  }, [podeVerCaixas]);

  useEffect(() => {
    const controller = new AbortController();

    async function carregarMovimentacoesDoCaixa(idCaixa: number) {
      const res = await fetchWithAuth(`${API}/movimentacoes/caixa/${idCaixa}`, controller.signal);
      if (!res.ok) return [] as Movimentacao[];
      const data = await res.json();
      const movs: Movimentacao[] = data.movimentacoes ?? [];
      const caixa = caixas.find(c => c.id_caixa === idCaixa);
      return movs.map(m => ({
        ...m,
        id_caixa: m.id_caixa ?? idCaixa,
        funcionario_nome: m.funcionario_nome ?? caixa?.funcionario_nome,
      }));
    }

    async function load() {
      try {
        setLoading(true);

        if (podeVerCaixas) {
          if (caixaSelecionado !== "todos") {
            const movs = await carregarMovimentacoesDoCaixa(Number(caixaSelecionado));
            setMovimentacoes(movs);
            return;
          }

          if (caixas.length === 0) {
            setMovimentacoes([]);
            return;
          }

          const listas = await Promise.all(
            caixas.map(c => carregarMovimentacoesDoCaixa(c.id_caixa))
          );
          const todas = listas.flat().sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
          setMovimentacoes(todas);
          return;
        }

        const res = await fetchWithAuth(`${API}/movimentacoes`, controller.signal);
        if (!res.ok) {
          if (res.status === 401) { navigate("/login"); return; }
          throw new Error("Falha ao carregar movimentações");
        }
        const data = await res.json();
        setMovimentacoes(data.movimentacoes ?? []);
      } catch (e: any) {
        if (!controller.signal.aborted) setMovimentacoes([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [navigate, podeVerCaixas, caixas, caixaSelecionado]);

  const filtradas = useMemo(() => movimentacoes.filter((m) => {
    const texto = `${m.descricao || ""} ${m.funcionario_nome || ""} ${m.id_caixa ? `caixa ${m.id_caixa}` : ""}`.toLowerCase();
    const matchSearch = texto.includes(search.toLowerCase());
    const matchTipo = filterTipo === "todos" || m.tipo === filterTipo;
    const matchData = mesmoDia(m.data, dataSelecionada);
    return matchSearch && matchTipo && matchData;
  }), [movimentacoes, search, filterTipo, dataSelecionada]);

  const totais = useMemo(() => calcularTotais(filtradas), [filtradas]);

  const caixaAtual = caixas.find(c => String(c.id_caixa) === caixaSelecionado);
  const dataFormatada = dataSelecionada
    ? new Date(`${dataSelecionada}T00:00:00`).toLocaleDateString("pt-BR")
    : "todos os dias";

  function limparFiltros() {
    setSearch("");
    setFilterTipo("todos");
    setDataSelecionada("");
    setCaixaSelecionado("todos");
  }

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
            <button className="btn btn-back" onClick={limparFiltros} type="button">
              Limpar filtros
            </button>
          </div>
        </header>

        <section className="mov-hero">
          <div className="mov-hero-copy">
            <p className="mov-kicker">Resumo financeiro</p>
            <h2>
              {podeVerCaixas && caixaAtual
                ? `Caixa #${caixaAtual.id_caixa} — ${caixaAtual.funcionario_nome}`
                : podeVerCaixas
                ? "Todos os caixas"
                : "Fluxo de caixa em uma única tela"}
            </h2>
            <p>{dataSelecionada ? `Mostrando movimentações de ${dataFormatada}.` : "Mostrando todas as movimentações carregadas."} Use os filtros para localizar registros com mais rapidez.</p>
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
          <div className="mov-filters mov-main-filters">
            <div className="mov-select-group">
              <label htmlFor="mov-data">Dia</label>
              <input
                id="mov-data"
                className="mov-date-input"
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>

            {podeVerCaixas && (
              <div className="mov-select-group">
                <label htmlFor="mov-caixa">Caixa / funcionário</label>
                <select id="mov-caixa" value={caixaSelecionado} onChange={(e) => setCaixaSelecionado(e.target.value)}>
                  <option value="todos">Todos os caixas</option>
                  {caixas.map(c => (
                    <option key={c.id_caixa} value={c.id_caixa}>
                      Caixa #{c.id_caixa} — {c.funcionario_nome} — {new Date(c.data).toLocaleDateString("pt-BR")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className="mov-search">
              <IconSearch />
              <input
                type="text"
                placeholder="Buscar por descrição, caixa ou funcionário"
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
                <p>Nenhuma movimentação encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="dp-table-wrap">
                <table className="dp-table dp-table-actions">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      {podeVerCaixas && <th>Caixa</th>}
                      <th>Valor</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((m) => (
                      <tr key={`${m.id_caixa || "mov"}-${m.id_movimentacao}`}>
                        <td>
                          <span className={`badge ${m.tipo}`}>
                            {m.tipo === "entrada" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td>{m.descricao || "-"}</td>
                        {podeVerCaixas && (
                          <td>
                            {m.id_caixa ? `Caixa #${m.id_caixa}` : "-"}
                            {m.funcionario_nome ? <small className="mov-caixa-info">{m.funcionario_nome}</small> : null}
                          </td>
                        )}
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
