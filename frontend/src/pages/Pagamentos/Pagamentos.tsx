import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconCheck, IconClock, IconEdit, IconEye, IconMoney, IconPlus, IconSearch, IconTrash } from "../../components/ui/icons";
import "./Pagamentos.css";
import "../../styles/data-panel.css";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import API_URL from "../../utils/api";
import { formatCurrency, formatDate } from "../../utils/format";
import { formatCurrencyInput, formatCurrencyValue, parseCurrency } from "../../utils/masks";

const API = `${API_URL}/api`;

interface Pagamento {
  id_pagamento: number;
  id_venda: number | null;
  id_ordem_servico: number | null;
  id_cliente: number;
  cliente_nome: string;
  valor: number;
  forma_pagamento: string;
  parcelas: number;
  dia_pagamento: number | null;
  status: string;
  data_pagamento: string | null;
  data_vencimento: string;
  descricao: string;
}

interface Caixa {
  id_caixa: number;
  data: string;
  valor_abertura: number;
  funcionario_nome: string;
}

interface GrupoParcelas {
  id_venda: number;
  cliente_nome: string;
  descricao_base: string;
  total: number;
  pagas: number;
  canceladas: number;
  valor_total: number;
  dia_pagamento: number | null;
  parcelas: Pagamento[];
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "del"; visible: boolean }>({
    msg: "", type: "ok", visible: false,
  });
  function show(msg: string, type: "ok" | "err" | "del" = "ok") {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }
  return { toast, show };
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = { pago: "status-paid", pendente: "status-pending-blue", cancelado: "status-cancelled" };
  return map[status] || "status-pending-blue";
}

function getStatusText(status: string): string {
  const map: Record<string, string> = { pago: "Pago", pendente: "Pendente", cancelado: "Cancelado" };
  return map[status] || status;
}

function getFormaPagamentoText(forma: string): string {
  const map: Record<string, string> = {
    dinheiro: "Dinheiro", cartao_credito: "Cartão Crédito", cartao_debito: "Cartão Débito",
    pix: "PIX", boleto: "Boleto", transferencia: "Transferência",
  };
  return map[forma] || forma;
}

function getTipoBadge(p: Pagamento) {
  if (p.id_venda !== null) return { label: "Venda", classe: "status-info" };
  return { label: "Despesa", classe: "status-bad" };
}

function isAguardando(p: Pagamento) {
  return p.status === "pendente" && p.id_venda !== null && p.dia_pagamento === null;
}

function getCorPagamento(pagas: number, total: number, canceladas: number) {
  if (total === 0) return { label: "Sem pagamento", fracao: "-", cor: "neutro" };
  if (canceladas === total) return { label: "Cancelado", fracao: `0/${total}`, cor: "vermelho" };
  if (pagas === total) return { label: "Pago", fracao: `${pagas}/${total}`, cor: "verde" };
  if (pagas === 0) return { label: "Pendente", fracao: `${pagas}/${total}`, cor: "amarelo" };
  return { label: "Parcial", fracao: `${pagas}/${total}`, cor: "azul" };
}

function corParaClasse(cor: string) {
  const map: Record<string, string> = { verde: "status-ok", amarelo: "status-warn", azul: "status-info", vermelho: "status-bad", neutro: "status-neutral" };
  return map[cor] || "status-neutral";
}

function ModalDetalhesParcelas({ grupo, onClose }: { grupo: GrupoParcelas; onClose: () => void }) {
  return (
    <div className="confirm-overlay open" onClick={onClose}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3>Detalhes do parcelamento</h3>
        <p style={{ fontSize: 13, color: "#667085", marginBottom: 4 }}>{grupo.cliente_nome} — Venda #{grupo.id_venda}</p>
        <p style={{ fontSize: 13, color: "#667085", marginBottom: 20 }}>
          {grupo.total}x no Cartão de Crédito · Dia {grupo.dia_pagamento} de cada mês · <strong>{formatCurrency(grupo.valor_total)}</strong> total
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "#667085", fontWeight: 600 }}>Parcela</th>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "#667085", fontWeight: 600 }}>Vencimento</th>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "#667085", fontWeight: 600 }}>Valor</th>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "#667085", fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "#667085", fontWeight: 600 }}>Pago em</th>
            </tr>
          </thead>
          <tbody>
            {grupo.parcelas.map((p, idx) => (
              <tr key={p.id_pagamento} style={{ borderBottom: "1px solid #f4f4f5" }}>
                <td style={{ padding: "8px 8px", fontWeight: 500 }}>{idx + 1}/{grupo.total}</td>
                <td style={{ padding: "8px 8px", color: "#667085" }}>{formatDate(p.data_vencimento)}</td>
                <td style={{ padding: "8px 8px", fontFamily: "monospace" }}>{formatCurrency(p.valor)}</td>
                <td style={{ padding: "8px 8px" }}><span className={`status-badge ${getStatusBadge(p.status)}`}>{getStatusText(p.status)}</span></td>
                <td style={{ padding: "8px 8px", color: "#667085" }}>{p.data_pagamento ? formatDate(p.data_pagamento) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="confirm-actions" style={{ marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default function Pagamentos() {
  const navigate = useNavigate();
  const { toast, show: showToast } = useToast();

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [grupoDetalhes, setGrupoDetalhes] = useState<GrupoParcelas | null>(null);

  // Modal baixa
  const [baixaId, setBaixaId] = useState<number | null>(null);
  const [baixaEtapa, setBaixaEtapa] = useState(1);
  const [baixaForma, setBaixaForma] = useState("dinheiro");
  const [baixaCaixa, setBaixaCaixa] = useState<number | null>(null);
  const [baixaParcelas, setBaixaParcelas] = useState(1);
  const [baixaDia, setBaixaDia] = useState(1);
  const [caixasAbertos, setCaixasAbertos] = useState<Caixa[]>([]);
  const [salvandoBaixa, setSalvandoBaixa] = useState(false);
  const [aplicarDesconto, setAplicarDesconto] = useState(false);
  const [baixaDesconto, setBaixaDesconto] = useState(0);
  const [pagamentoMisto, setPagamentoMisto] = useState(false);
  const [partesMisto, setPartesMisto] = useState([{ forma: "dinheiro", valor: "" }, { forma: "pix", valor: "" }]);

  // Código de validação
  const [codigoBaixa, setCodigoBaixa] = useState("");
  const [codigoConfirmado, setCodigoConfirmado] = useState(false);
  const [codigoErro, setCodigoErro] = useState("");

  const pagamentoBaixa = pagamentos.find((p) => p.id_pagamento === baixaId);
  const valor = pagamentoBaixa?.valor || 0;
  const maxParcelas = valor < 200 ? 0 : Math.min(10, Math.floor((valor - 100) / 200) * 2 + 2);
  const descontoMaximo = getDescontoMaximo(valor);
  const valorComDesconto = aplicarDesconto ? Math.round(valor * (1 - baixaDesconto / 100) * 100) / 100 : valor;

  function getDescontoMaximo(valorTotal: number) {
    if (valorTotal >= 2000) return 20;
    if (valorTotal >= 1000) return 10;
    return 0;
  }

  async function fetchCaixasAbertos() {
    try {
      const res = await fetchWithAuth(`${API}/caixa/aberto`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.id_caixa) { setCaixasAbertos([data]); setBaixaCaixa(data.id_caixa); }
      else { setCaixasAbertos([]); setBaixaCaixa(null); }
    } catch { setCaixasAbertos([]); }
  }

  async function abrirModalBaixa(id_pagamento: number) {
    // verifica se tem caixa aberto ANTES de abrir o modal
    try {
      const res = await fetchWithAuth(`${API}/caixa/aberto`);
      const data = res.ok ? await res.json() : null;

      if (!data || !data.id_caixa) {
        showToast("Abra o caixa antes de dar baixa em um pagamento.", "err");
        return;
      }

      setCaixasAbertos([data]);
      setBaixaCaixa(data.id_caixa);
    } catch {
      showToast("Erro ao verificar o caixa. Tente novamente.", "err");
      return;
    }

    setBaixaId(id_pagamento);
    setBaixaForma("dinheiro");
    setBaixaParcelas(1);
    setBaixaDia(1);
    setAplicarDesconto(false);
    setBaixaDesconto(0);
    setPagamentoMisto(false);
    setPartesMisto([{ forma: "dinheiro", valor: "" }, { forma: "pix", valor: "" }]);

    // calcula se essa venda tem desconto disponível, para já iniciar na etapa certa
    const pag = pagamentos.find(p => p.id_pagamento === id_pagamento);
    const descMax = getDescontoMaximo(pag?.valor || 0);
    const temDesc = pag?.id_venda !== null && descMax > 0;
    setBaixaEtapa(temDesc ? 1 : 2);

    setCodigoBaixa("");
    setCodigoConfirmado(false);
    setCodigoErro("");
  }

  function fecharModalBaixa() {
    setBaixaId(null);
    setBaixaForma("dinheiro");
    setBaixaCaixa(null);
    setBaixaParcelas(1);
    setBaixaDia(1);
    setAplicarDesconto(false);
    setBaixaDesconto(0);
    setCaixasAbertos([]);
    setPagamentoMisto(false);
    setPartesMisto([{ forma: "dinheiro", valor: "" }, { forma: "pix", valor: "" }]);
    setBaixaEtapa(1);
    setCodigoBaixa("");
    setCodigoConfirmado(false);
    setCodigoErro("");
  }

  async function confirmarBaixa() {
    if (!baixaId) return;
    if (!baixaCaixa) { showToast("Nenhum caixa aberto. Abra o caixa primeiro.", "err"); return; }
    if (baixaForma === "cartao_credito" && maxParcelas === 0) { showToast("Valor mínimo para parcelamento é R$ 200,00", "err"); return; }

    setSalvandoBaixa(true);
    try {
      if (baixaForma === "cartao_credito") {
        const res = await fetchWithAuth(`${API}/pagamentos/${baixaId}/parcelar`, {
          method: "POST",
          body: JSON.stringify({ parcelas: baixaParcelas, dia_pagamento: baixaDia }),
        });
        if (!res.ok) { const error = await res.json(); throw new Error(error.error || "Erro ao parcelar"); }
        showToast(`${baixaParcelas} parcela(s) gerada(s)! Baixa automática todo dia ${baixaDia}.`, "ok");
      } else {
        const body: any = { status: "pago", forma_pagamento: baixaForma, desconto_percentual: aplicarDesconto ? baixaDesconto : 0 };
        if (pagamentoMisto) {
          const somaPartes = partesMisto.reduce((s, p) => s + parseCurrency(p.valor), 0);
          const diff = Math.abs(somaPartes - valorComDesconto);
          if (diff > 0.01) { showToast(`Soma das partes não bate com o total`, "err"); setSalvandoBaixa(false); return; }
          body.pagamento_misto = partesMisto.map(p => ({ forma: p.forma, valor: parseCurrency(p.valor) }));
        }
        const res = await fetchWithAuth(`${API}/pagamentos/${baixaId}`, { method: "PUT", body: JSON.stringify(body) });
        if (!res.ok) { const error = await res.json(); throw new Error(error.error || "Erro ao baixar pagamento"); }
        showToast("Pagamento baixado com sucesso!", "ok");
      }
      fecharModalBaixa();
      fetchPagamentos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao processar", "err");
    } finally {
      setSalvandoBaixa(false);
    }
  }

  async function fetchPagamentos() {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/pagamentos`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPagamentos(Array.isArray(data) ? data.map((p: any) => ({
        id_pagamento: p.id_pagamento,
        id_venda: p.id_venda ?? null,
        id_ordem_servico: p.id_ordem_servico ?? null,
        id_cliente: p.id_cliente,
        cliente_nome: p.cliente_nome || "—",
        valor: Number(p.valor) || 0,
        forma_pagamento: p.forma_pagamento || "",
        parcelas: Number(p.parcelas) || 1,
        dia_pagamento: p.dia_pagamento ?? null,
        status: (p.status || "pendente").toString().toLowerCase(),
        data_pagamento: p.data_pagamento || null,
        data_vencimento: p.data_vencimento || "",
        descricao: p.descricao || "",
      })) : []);
    } catch {
      showToast("Erro ao carregar pagamentos", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPagamentos(); }, []);

  const stats = useMemo(() => {
    const pendentes = pagamentos.filter((p) => p.status === "pendente");
    const pagos = pagamentos.filter((p) => p.status === "pago");
    return {
      total: pagamentos.length,
      totalValor: pagamentos.reduce((s, p) => s + p.valor, 0),
      pendentes: pendentes.length,
      pagos: pagos.length,
      totalPendente: pendentes.reduce((s, p) => s + p.valor, 0),
      totalPago: pagos.reduce((s, p) => s + p.valor, 0),
    };
  }, [pagamentos]);

  const { listaSimples, gruposParcelas } = useMemo(() => {
    const parcelasCredito = pagamentos.filter((p) => p.dia_pagamento !== null && p.dia_pagamento !== undefined && p.id_venda !== null);
    const mapaGrupos = new Map<number, GrupoParcelas>();
    for (const p of parcelasCredito) {
      const vid = p.id_venda!;
      if (!mapaGrupos.has(vid)) {
        mapaGrupos.set(vid, { id_venda: vid, cliente_nome: p.cliente_nome, descricao_base: p.descricao.replace(/ - Parcela \d+\/\d+$/, ""), total: 0, pagas: 0, canceladas: 0, valor_total: 0, dia_pagamento: p.dia_pagamento, parcelas: [] });
      }
      const g = mapaGrupos.get(vid)!;
      g.total++; g.valor_total += p.valor;
      if (p.status === "pago") g.pagas++;
      if (p.status === "cancelado") g.canceladas++;
      g.parcelas.push(p);
    }
    mapaGrupos.forEach((g) => { g.parcelas.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)); });
    const idsAgrupados = new Set(parcelasCredito.map((p) => p.id_pagamento));
    return { listaSimples: pagamentos.filter((p) => !idsAgrupados.has(p.id_pagamento)), gruposParcelas: Array.from(mapaGrupos.values()) };
  }, [pagamentos]);

  const listaFiltrada = useMemo(() => {
    const s = search.toLowerCase();
    const simplesFiltrados = listaSimples.filter((p) => {
      const matchSearch = p.cliente_nome?.toLowerCase().includes(s) || String(p.id_pagamento).includes(s) || p.descricao?.toLowerCase().includes(s);
      const matchStatus = filterStatus === "todos" || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
    const gruposFiltrados = gruposParcelas.filter((g) => {
      const matchSearch = g.cliente_nome?.toLowerCase().includes(s) || String(g.id_venda).includes(s) || g.descricao_base?.toLowerCase().includes(s);
      const statusGrupo = g.pagas === g.total ? "pago" : g.canceladas === g.total ? "cancelado" : "pendente";
      const matchStatus = filterStatus === "todos" || filterStatus === statusGrupo;
      return matchSearch && matchStatus;
    });
    return { simplesFiltrados, gruposFiltrados };
  }, [listaSimples, gruposParcelas, search, filterStatus]);

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API}/pagamentos/${confirmId}`, { method: "DELETE" });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error); }
      setConfirmId(null);
      showToast("Pagamento excluído com sucesso!", "del");
      await fetchPagamentos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao remover", "err");
    } finally {
      setDeleting(false);
    }
  }

  const confirmPagamento = pagamentos.find((p) => p.id_pagamento === confirmId);

  return (
    <div className="pagamentos-wrapper">
      <Sidebar />
      <div className="pagamentos-page">

        <header className="p-topbar">
          <div className="p-topbar-title">Pagamentos</div>
          <div className="p-topbar-actions">
            <button className="btn btn-primary" onClick={() => navigate("/pagamentos/novo")}>
              <IconPlus /> Novo Pagamento
            </button>
          </div>
        </header>

        <div className="p-content">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon si-blue"><IconMoney /></div>
              <div className="stat-info"><p>Total em Pagamentos</p><strong>{formatCurrency(stats.totalValor)}</strong><small>{stats.total} registros</small></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-yellow"><IconClock /></div>
              <div className="stat-info"><p>Pendentes</p><strong>{formatCurrency(stats.totalPendente)}</strong><small>{stats.pendentes} pendentes</small></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-green"><IconCheck /></div>
              <div className="stat-info"><p>Pagos</p><strong>{formatCurrency(stats.totalPago)}</strong><small>{stats.pagos} pagos</small></div>
            </div>
          </div>

          <div className="data-panel">
            <div className="dp-header">
              <h3>Lista de Pagamentos</h3>
              <div className="dp-header-right">
                <div className="filter-group">
                  <select className="dp-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="todos">Todos os status</option>
                    <option value="pendente">Pendentes</option>
                    <option value="pago">Pagos</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                  <div className="dp-search">
                    <IconSearch />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente, ID..." />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dp-loading"><div className="dp-empty-icon"><IconClock style={{ width: 32, height: 32 }} /></div><p>Carregando pagamentos...</p></div>
            ) : (listaFiltrada.simplesFiltrados.length === 0 && listaFiltrada.gruposFiltrados.length === 0) ? (
              <div className="dp-empty"><div className="dp-empty-icon"><IconMoney style={{ width: 32, height: 32 }} /></div><p>Nenhum pagamento encontrado.<br />Clique em <strong>Novo Pagamento</strong> para registrar.</p></div>
            ) : (
              <div className="dp-table-wrap">
                <table className="dp-table dp-table-actions">
                  <thead>
                    <tr>
                      <th>Cliente</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Forma</th><th>Parcelas</th><th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaFiltrada.gruposFiltrados.map((g) => {
                      const badge = getCorPagamento(g.pagas, g.total, g.canceladas);
                      return (
                        <tr key={`grupo-${g.id_venda}`}>
                          <td className="dp-cell-muted">{g.cliente_nome}</td>
                          <td className="dp-cell-muted" style={{ fontSize: 12 }}>{g.descricao_base}</td>
                          <td><span className="status-badge status-info">Venda</span></td>
                          <td className="dp-cell-mono"><strong>{formatCurrency(g.valor_total)}</strong></td>
                          <td className="dp-cell-muted">Cartão Crédito</td>
                          <td className="dp-cell-muted">Dia {g.dia_pagamento}/mês</td>
                          <td><span className={`status-badge ${corParaClasse(badge.cor)}`}>{badge.fracao} · {badge.label}</span></td>
                          <td>
                            <div className="dp-row-actions">
                              <button className="dp-btn-icon dp-view" title="Ver parcelas" onClick={() => setGrupoDetalhes(g)}><IconEye /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {listaFiltrada.simplesFiltrados.map((p) => (
                      <tr key={p.id_pagamento}>
                        <td className="dp-cell-muted">{p.cliente_nome}</td>
                        <td className="dp-cell-muted" style={{ fontSize: 12 }}>{p.descricao}</td>
                        <td><span className={`status-badge ${getTipoBadge(p).classe}`}>{getTipoBadge(p).label}</span></td>
                        <td className="dp-cell-mono">{formatCurrency(p.valor)}</td>
                        <td className="dp-cell-muted">{getFormaPagamentoText(p.forma_pagamento)}</td>
                        <td className="dp-cell-muted">{formatDate(p.data_vencimento)}</td>
                        <td>
                          {isAguardando(p)
                            ? <span className="status-badge status-info">Aguardando pagamento</span>
                            : <span className={`status-badge ${getStatusBadge(p.status)}`}>{getStatusText(p.status)}</span>}
                        </td>
                        <td>
                          <div className="dp-row-actions">
                            <button className="dp-btn-icon dp-view" title="Ver detalhes" onClick={() => navigate("/detalhes", { state: { title: "Pagamento", data: p } })}><IconEye /></button>
                            {p.status === "pendente" && (
                              <button className="icon-btn success" title="Dar baixa" onClick={() => abrirModalBaixa(p.id_pagamento)}><IconCheck /></button>
                            )}
                            {p.status !== "pago" && (
                              <>
                                <button className="dp-btn-icon dp-edit" title="Editar" onClick={() => navigate(`/pagamentos/editar/${p.id_pagamento}`)}><IconEdit /></button>
                                <button className="dp-btn-icon dp-del" title="Remover" onClick={() => setConfirmId(p.id_pagamento)}><IconTrash /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {grupoDetalhes && <ModalDetalhesParcelas grupo={grupoDetalhes} onClose={() => setGrupoDetalhes(null)} />}

      {/* ── MODAL DAR BAIXA ── */}
      {baixaId !== null && (() => {
        const temDesconto = pagamentoBaixa?.id_venda !== null && descontoMaximo > 0 && baixaForma !== "cartao_credito";
        const primeiraEtapa = temDesconto ? 1 : 2;

        return (
          <div className="confirm-overlay open" onClick={fecharModalBaixa}>
            <div className="confirm-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>

              <h3>Dar baixa no pagamento</h3>
              <p style={{ fontSize: 13, color: "#667085", marginBottom: 4 }}>
                {pagamentoBaixa?.descricao} — <strong>{formatCurrency(pagamentoBaixa?.valor || 0)}</strong>
              </p>

              {/* Validação do código — só para pagamentos de venda */}
              {pagamentoBaixa?.id_venda && !codigoConfirmado ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                  <p style={{ fontSize: 13, color: "#667085" }}>Digite o código que o cliente apresentou:</p>
                  <input
                    type="text"
                    value={codigoBaixa}
                    onChange={e => { setCodigoBaixa(e.target.value.toUpperCase()); setCodigoErro(""); }}
                    placeholder="VND-XXXXXX"
                    style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 22, fontFamily: "monospace", letterSpacing: 6, textAlign: "center" }}
                  />
                  {codigoErro && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{codigoErro}</p>}
                  <div className="confirm-actions">
                    <button className="btn btn-ghost" onClick={fecharModalBaixa}>Cancelar</button>
                    <button className="btn btn-primary" onClick={async () => {
                      if (!codigoBaixa.trim()) { setCodigoErro("Digite o código"); return; }
                      try {
                        const res = await fetchWithAuth(`${API}/pagamentos/codigo/${codigoBaixa.trim()}`);
                        if (!res.ok) { setCodigoErro("Código inválido ou pagamento já processado"); return; }
                        const data = await res.json();
                        if (data.id_pagamento !== baixaId) { setCodigoErro("Código não corresponde a este pagamento"); return; }
                        setCodigoConfirmado(true);
                      } catch { setCodigoErro("Erro ao validar código"); }
                    }}>
                      Validar código
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Indicador de etapas */}
                  {(() => {
                    const etapas = temDesconto ? ["Desconto", "Pagamento"] : ["Pagamento"];
                    const etapaAtual = temDesconto ? baixaEtapa : baixaEtapa - 1;
                    return (
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, marginTop: 12 }}>
                        {etapas.map((label, idx) => {
                          const num = idx + 1;
                          const ativa = num === etapaAtual;
                          const concluida = num < etapaAtual;
                          return (
                            <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: concluida ? "#16a34a" : ativa ? "#6366f1" : "#f4f4f5", color: concluida || ativa ? "#fff" : "#aaa" }}>
                                  {concluida ? "✓" : num}
                                </div>
                                <span style={{ fontSize: 11, color: ativa ? "#6366f1" : concluida ? "#16a34a" : "#aaa", marginTop: 4, fontWeight: ativa ? 600 : 400 }}>{label}</span>
                              </div>
                              {idx < etapas.length - 1 && <div style={{ height: 2, width: 32, background: concluida ? "#16a34a" : "#e4e4e7", marginBottom: 18 }} />}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* ETAPA 1: Desconto */}
                  {baixaEtapa === 1 && temDesconto && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                        <input type="checkbox" checked={aplicarDesconto} onChange={(e) => { setAplicarDesconto(e.target.checked); setBaixaDesconto(e.target.checked ? descontoMaximo : 0); }} />
                        Aplicar desconto (até {descontoMaximo}%)
                      </label>
                      {aplicarDesconto && (
                        <div>
                          <input type="number" min={0} max={descontoMaximo} value={baixaDesconto} onChange={(e) => setBaixaDesconto(Math.min(descontoMaximo, Math.max(0, Number(e.target.value))))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14 }} />
                          <p style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>Valor com desconto: <strong>{formatCurrency(valorComDesconto)}</strong> (de {formatCurrency(valor)})</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ETAPA 2: Pagamento */}
                  {baixaEtapa === 2 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                      {aplicarDesconto && <p style={{ fontSize: 12, background: "#f0fdf4", color: "#16a34a", padding: "8px 12px", borderRadius: 8, margin: 0 }}>Desconto de {baixaDesconto}% aplicado — total: <strong>{formatCurrency(valorComDesconto)}</strong></p>}

                      {!pagamentoMisto && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: "#667085", display: "block", marginBottom: 6 }}>Forma de pagamento</label>
                          <select value={baixaForma} onChange={(e) => { setBaixaForma(e.target.value); setBaixaParcelas(1); setBaixaDia(1); setPagamentoMisto(false); }} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14 }}>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="pix">PIX</option>
                            <option value="cartao_debito">Cartão de Débito</option>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="boleto">Boleto</option>
                          </select>
                        </div>
                      )}

                      {baixaForma === "cartao_credito" && (
                        <>
                          {maxParcelas === 0 ? (
                            <p style={{ fontSize: 13, color: "#ef4444", padding: "9px 12px", background: "#fef2f2", borderRadius: 8 }}>⚠️ Valor mínimo para parcelamento é R$ 200,00.</p>
                          ) : (
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: "#667085", display: "block", marginBottom: 6 }}>Número de parcelas</label>
                              <select value={baixaParcelas} onChange={(e) => setBaixaParcelas(Number(e.target.value))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14 }}>
                                {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                                  <option key={n} value={n}>{n}x de {formatCurrency(valorComDesconto / n)}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "#667085", display: "block", marginBottom: 6 }}>Dia do mês para pagamento</label>
                            <input type="number" min={1} max={31} value={baixaDia} onChange={(e) => setBaixaDia(Number(e.target.value))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14 }} />
                            <p style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>Baixa automática todo dia {baixaDia}.{baixaDia > 28 && " Meses curtos usam o último dia disponível."}</p>
                          </div>
                        </>
                      )}

                      {baixaForma !== "cartao_credito" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                            <input type="checkbox" checked={pagamentoMisto} onChange={(e) => { setPagamentoMisto(e.target.checked); if (e.target.checked) setPartesMisto([{ forma: baixaForma, valor: formatCurrencyValue(valorComDesconto) }, { forma: "pix", valor: "" }]); }} />
                            Dividir em mais de uma forma
                          </label>
                          {pagamentoMisto && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {partesMisto.map((parte, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <select value={parte.forma} onChange={(e) => { const novo = [...partesMisto]; novo[idx] = { ...novo[idx], forma: e.target.value }; setPartesMisto(novo); }} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }}>
                                    <option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="cartao_debito">Cartão de Débito</option><option value="boleto">Boleto</option>
                                  </select>
                                  <input type="text" inputMode="decimal" value={parte.valor} onChange={(e) => { const novo = [...partesMisto]; novo[idx] = { ...novo[idx], valor: formatCurrencyInput(e.target.value) }; setPartesMisto(novo); }} placeholder="0,00" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} />
                                  {partesMisto.length > 2 && <button type="button" onClick={() => setPartesMisto(partesMisto.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, padding: "0 4px" }}>×</button>}
                                </div>
                              ))}
                              {(() => {
                                const soma = partesMisto.reduce((s, p) => s + parseCurrency(p.valor), 0);
                                const diff = valorComDesconto - soma;
                                return <p style={{ fontSize: 12, color: Math.abs(diff) < 0.01 ? "#16a34a" : "#ef4444", margin: 0 }}>{Math.abs(diff) < 0.01 ? "✓ Valores conferem" : diff > 0 ? `Faltam ${formatCurrency(diff)}` : `Excesso de ${formatCurrency(-diff)}`}</p>;
                              })()}
                              <button type="button" onClick={() => setPartesMisto([...partesMisto, { forma: "dinheiro", valor: "" }])} style={{ fontSize: 13, color: "#6366f1", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>+ Adicionar forma</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="confirm-actions">
                    <button className="btn btn-ghost" onClick={() => { if (baixaEtapa === primeiraEtapa) fecharModalBaixa(); else setBaixaEtapa(baixaEtapa - 1); }}>
                      {baixaEtapa === primeiraEtapa ? "Cancelar" : "← Voltar"}
                    </button>
                    {baixaEtapa < 2 ? (
                      <button className="btn btn-primary" onClick={() => setBaixaEtapa(baixaEtapa + 1)}>
                        Próximo →
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={confirmarBaixa}
                        disabled={
                          salvandoBaixa ||
                          (baixaForma === "cartao_credito" ? maxParcelas === 0 : caixasAbertos.length === 0)
                        }
                      >
                        {salvandoBaixa ? "Processando..." : "Confirmar baixa"}
                      </button>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
        );
      })()}

      <ConfirmDialog
        open={confirmId !== null}
        title="Remover pagamento?"
        message={<>Pagamento de <strong>{confirmPagamento ? formatCurrency(confirmPagamento.valor) : ""}</strong> referente a <strong>{confirmPagamento?.descricao}</strong> será removido.</>}
        confirmLabel={deleting ? "Removendo..." : "Sim, remover"}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmId(null); setDeleting(false); }}
      />

      <div className={`toast${toast.visible ? " show" : ""}`}>
        <span className={`toast-dot ${toast.type}`} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}