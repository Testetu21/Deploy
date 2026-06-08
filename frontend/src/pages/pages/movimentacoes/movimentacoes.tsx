                    import { useEffect, useMemo, useState } from "react";
                    import { useNavigate } from "react-router-dom";
                    import { Sidebar } from "../../components/sidebar";
                    import { IconAlert, IconClock, IconEye, IconMoney, IconSearch } from "../../components/ui/icons";
                    import "./movimentacoes.css";
import "../../styles/data-panel.css";
import API_URL from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/format";

                    const API = `${API_URL}/api`;

                    interface Movimentacao {
                      id_movimentacao: number;
                      tipo: "entrada" | "saida";
                      valor: number;
                      descricao?: string;
                      data?: string;
                    }


                    function getToken() {
                      return localStorage.getItem("token") || "";
                    }

                    export default function Movimentacoes() {
                      const navigate = useNavigate();
                      const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
                      const [loading, setLoading] = useState(true);
                      const [search, setSearch] = useState("");
                      const [filterTipo, setFilterTipo] = useState("todos");

                      function resetFilters() {
                        setSearch("");
                        setFilterTipo("todos");
                      }

                      useEffect(() => {
                        const controller = new AbortController();

                        async function loadMovimentacoes() {
                          try {
                            setLoading(true);

                            const response = await fetch(`${API}/movimentacoes`, {
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${getToken()}`,
                              },
                              signal: controller.signal,
                            });

                            if (!response.ok) {
                              if (response.status === 401) {
                                navigate("/login");
                                return;
                              }

                              throw new Error("Falha ao carregar movimentações");
                            }

                            const data = await response.json();
                            setMovimentacoes(Array.isArray(data) ? data : []);
                          } catch (error) {
                            if (!controller.signal.aborted) {
                              console.error(error);
                              setMovimentacoes([]);
                            }
                          } finally {
                            if (!controller.signal.aborted) {
                              setLoading(false);
                            }
                          }
                        }

                        loadMovimentacoes();

                        return () => controller.abort();
                      }, [navigate]);

                      const filteredMovimentacoes = useMemo(() => {
                        return movimentacoes.filter((movimentacao) => {
                          const descricao = (movimentacao.descricao || "").toLowerCase();
                          const matchSearch = descricao.includes(search.toLowerCase());
                          const matchTipo = filterTipo === "todos" || movimentacao.tipo === filterTipo;

                          return matchSearch && matchTipo;
                        });
                      }, [movimentacoes, search, filterTipo]);

                      const resumo = useMemo(() => {
                        const entradas = movimentacoes
                          .filter((movimentacao) => movimentacao.tipo === "entrada")
                          .reduce((acc, movimentacao) => acc + Number(movimentacao.valor || 0), 0);

                        const saidas = movimentacoes
                          .filter((movimentacao) => movimentacao.tipo === "saida")
                          .reduce((acc, movimentacao) => acc + Number(movimentacao.valor || 0), 0);

                        return {
                          entradas,
                          saidas,
                          saldo: entradas - saidas,
                          total: movimentacoes.length,
                        };
                      }, [movimentacoes]);

                      return (
                        <div className="mov-wrapper">
                          <Sidebar />

                          <div className="mov-page">
                            <header className="mov-topbar">
                              <div className="mov-title-block">
                                <span className="mov-chip">Financeiro</span>
                                <h1>Movimentações</h1>
                                <p>Visão organizada de entradas, saídas e saldo, com leitura rápida e limpa.</p>
                              </div>

                              <div className="mov-topbar-actions">
                                <button className="btn btn-back" onClick={resetFilters} type="button">
                                  Limpar filtros
                                </button>
                              </div>
                            </header>

                            <section className="mov-hero">
                              <div className="mov-hero-copy">
                                <p className="mov-kicker">Resumo financeiro</p>
                                <h2>Fluxo de caixa em uma única tela</h2>
                                <p>
                                  Use os filtros para localizar registros com mais rapidez e acompanhar o movimento do caixa sem ruído visual.
                                </p>
                              </div>

                              <div className="mov-stats">
                                <article className="mov-card entrada">
                                  <span className="mov-card-icon">
                                    <IconMoney />
                                  </span>
                                  <div>
                                    <p>Entradas</p>
                                    <strong>{formatCurrency(resumo.entradas)}</strong>
                                  </div>
                                </article>

                                <article className="mov-card saida">
                                  <span className="mov-card-icon">
                                    <IconAlert />
                                  </span>
                                  <div>
                                    <p>Saídas</p>
                                    <strong>{formatCurrency(resumo.saidas)}</strong>
                                  </div>
                                </article>

                                <article className="mov-card saldo">
                                  <span className="mov-card-icon">
                                    <IconClock />
                                  </span>
                                  <div>
                                    <p>Saldo</p>
                                    <strong>{formatCurrency(resumo.saldo)}</strong>
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
                                    onChange={(event) => setSearch(event.target.value)}
                                  />
                                </label>

                                <div className="mov-select-group">
                                  <label htmlFor="mov-tipo">Tipo</label>
                                  <select
                                    id="mov-tipo"
                                    value={filterTipo}
                                    onChange={(event) => setFilterTipo(event.target.value)}
                                  >
                                    <option value="todos">Todos</option>
                                    <option value="entrada">Entrada</option>
                                    <option value="saida">Saída</option>
                                  </select>
                                </div>

                                <div className="mov-summary-pill">
                                  {resumo.total} registro{resumo.total === 1 ? "" : "s"}
                                </div>
                              </div>

                              <div className="data-panel">
                                {loading ? (
                                  <div className="dp-loading">
                                    <div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div>
                                    <p>Carregando movimentações...</p>
                                  </div>
                                ) : filteredMovimentacoes.length === 0 ? (
                                  <div className="dp-empty">
                                    <div className="dp-empty-icon"><IconMoney style={{ width: 32, height: 32 }} /></div>
                                    <p>Nenhuma movimentação encontrada.<br />Ajuste a busca ou os filtros para localizar um registro.</p>
                                  </div>
                                ) : (
                                  <div className="mov-table-wrap">
                                    <div className="dp-table-wrap"><table className="dp-table dp-table-actions">
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
                                        {filteredMovimentacoes.map((movimentacao) => (
                                          <tr key={movimentacao.id_movimentacao}>
                                            <td>
                                              <span className={`badge ${movimentacao.tipo}`}>
                                                {movimentacao.tipo === "entrada" ? "Entrada" : "Saída"}
                                              </span>
                                            </td>
                                            <td>{movimentacao.descricao || "-"}</td>
                                            <td className={movimentacao.tipo === "entrada" ? "positive" : "negative"}>
                                              {movimentacao.tipo === "entrada" ? "+" : "-"}
                                              {formatCurrency(movimentacao.valor)}
                                            </td>
                                            <td>{formatDateTime(movimentacao.data)}</td>
                                            <td>
                                              <div className="dp-row-actions">
                                                <button
                                                  className="dp-btn-icon dp-view"
                                                  title="Ver detalhes"
                                                  onClick={() => navigate("/detalhes", { state: { title: "Movimentação", data: movimentacao } })}
                                                >
                                                  <IconEye />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table></div>
                                  </div>
                                )}
                              </div>
                            </section>
                          </div>
                        </div>
                      );
                    }