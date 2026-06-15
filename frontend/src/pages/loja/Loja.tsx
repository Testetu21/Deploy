import "../../utils/toast";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IconTrash } from "../../components/ui/icons";
import "../loja/Loja.css";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`;
const PEXELS_KEY = "BSrkrC9lc5Dhliaw5oIYXEYfpWyD767FlGl9nYFKhomFmtSIL2Ypz2GT";

type Tipo = 1 | 2 | 3;
const TIPOS: Record<Tipo, string> = { 1: "Ferramentas", 2: "Peças", 3: "Acessórios" };
const TIPO_ICONS: Record<Tipo, React.ReactNode> = {
  1: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,color:"#6B7280"}}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  2: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,color:"#6B7280"}}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M14.12 9.88a3 3 0 0 1 0 4.24M9.88 9.88a3 3 0 0 0 0 4.24"/></svg>,
  3: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,color:"#6B7280"}}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
};

interface Produto {
  id: number;
  nome: string;
  tipo: Tipo;
  preco_venda: number;
  quantidade_estoque: number;
  garantia: number;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

const CARRINHO_STORAGE_KEY = "loja:carrinho-salvo";

function fmt(v: number) {
  return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MOCK_PRODUTOS: Produto[] = [
  { id: 1, nome: "Furadeira de Impacto 750W", tipo: 1, preco_venda: 289.9, quantidade_estoque: 15, garantia: 12 },
  { id: 2, nome: "Serra Circular 1400W", tipo: 1, preco_venda: 479.9, quantidade_estoque: 8, garantia: 24 },
  { id: 3, nome: "Chave de Fenda Set Pro", tipo: 3, preco_venda: 89.9, quantidade_estoque: 42, garantia: 6 },
  { id: 4, nome: "Kit Brocas Aço Rápido", tipo: 2, preco_venda: 64.9, quantidade_estoque: 30, garantia: 0 },
  { id: 5, nome: "Nível a Laser 30m", tipo: 3, preco_venda: 199.9, quantidade_estoque: 11, garantia: 12 },
  { id: 6, nome: "Parafuso Sextavado M8 (cx100)", tipo: 2, preco_venda: 34.9, quantidade_estoque: 200, garantia: 0 },
  { id: 7, nome: "Esmerilhadeira Angular 4.5\"", tipo: 1, preco_venda: 319.9, quantidade_estoque: 4, garantia: 24 },
  { id: 8, nome: "Fita Métrica 5m Profissional", tipo: 3, preco_venda: 29.9, quantidade_estoque: 60, garantia: 6 },
];

// ─── PRODUTO CARD ───
function ProdutoCard({
  p,
  idx,
  urgente,
  noCarrinho,
  onAdicionar,
  onAlterar,
  onIrCarrinho,
}: {
  p: Produto;
  idx: number;
  urgente: boolean;
  noCarrinho: number;
  onAdicionar: () => void;
  onAlterar: (delta: number, maxQuantidade?: number) => void;
  onIrCarrinho: () => void;
}) {
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(p.nome)}&per_page=1`,
      { headers: { Authorization: PEXELS_KEY } }
    )
      .then((r) => r.json())
      .then((data) => setImgSrc(data.photos?.[0]?.src?.medium ?? ""))
      .catch(() => setImgSrc(""));
  }, [p.nome]);

  return (
    <div className="lj-card" style={{ animationDelay: `${idx * 55}ms` }}>
      {urgente && <div className="lj-ribbon">Últimas unidades!</div>}

      <div className="lj-card-visual">
        {imgSrc ? (
          <img src={imgSrc} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="lj-card-emoji">{TIPO_ICONS[p.tipo]}</span>
        )}
        {p.garantia > 0 && (
          <span className="lj-garantia-tag">
            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {p.garantia}m garantia
          </span>
        )}
      </div>

      <div className="lj-card-body">
        <span className="lj-card-tipo">{TIPOS[p.tipo]}</span>
        <h3 className="lj-card-nome">{p.nome}</h3>
        <div className="lj-card-estoque">
          <span className={`lj-dot ${urgente ? "r" : "g"}`} />
          {p.quantidade_estoque} em estoque
        </div>
        <div className="lj-card-bottom">
          <span className="lj-card-preco">{fmt(p.preco_venda)}</span>
          {noCarrinho > 0 ? (
            <div className="lj-qty-wrap">
              <div className="lj-qty">
                <button onClick={() => onAlterar(-1)} type="button">−</button>
                <span>{noCarrinho}</span>
                <button
                  onClick={() => onAlterar(1, p.quantidade_estoque)}
                  type="button"
                  disabled={noCarrinho >= p.quantidade_estoque}
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
              {noCarrinho >= p.quantidade_estoque && (
                <span className="lj-stock-limit">Estoque máximo atingido</span>
              )}
            </div>
          ) : (
            <button className="lj-add" onClick={onAdicionar} type="button">
              Adicionar
            </button>
          )}
        </div>

        <button className="lj-go-cart" type="button" onClick={onIrCarrinho}>
          Comprar
        </button>
      </div>
    </div>
  );
}

// ─── LOJA ───
export default function Loja() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [pedidoFeito, setPedidoFeito] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<ItemCarrinho | null>(null);
  const [confirmarSairAberto, setConfirmarSairAberto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err"; visible: boolean }>({
    msg: "",
    type: "ok",
    visible: false,
  });
  const [scrolled, setScrolled] = useState(false);
  const produtosRef = useRef<HTMLElement>(null);
  const buscaInputRef = useRef<HTMLInputElement>(null);

  const usuarioRaw = sessionStorage.getItem("usuario");
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  async function carregarProdutos() {
    const response = await fetch(`${API}/loja/produtos`);
    const data = await response.json();
    const mapped = data
      .filter((p: any) => p.quantidade_estoque > 0)
      .map((p: any) => ({
        id: p.id_produto,
        nome: p.nome,
        tipo: p.tipo as Tipo,
        preco_venda: p.preco_venda / 100,
        quantidade_estoque: p.quantidade_estoque,
        garantia: p.garantia,
      }));

    setProdutos(mapped);
  }

  function mostrarToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type, visible: true });
    window.setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }

  function salvarCarrinho(carrinhoAtual: ItemCarrinho[]) {
    const carrinhoSerializado = carrinhoAtual.map(item => ({
      produto: item.produto,
      quantidade: item.quantidade,
    }));
    localStorage.setItem(CARRINHO_STORAGE_KEY, JSON.stringify(carrinhoSerializado));
  }

  function carregarCarrinhoSalvo(produtosDisponiveis: Produto[]) {
    const carrinhoSalvo = localStorage.getItem(CARRINHO_STORAGE_KEY);
    if (!carrinhoSalvo) return;

    try {
      const itensSalvos: ItemCarrinho[] = JSON.parse(carrinhoSalvo);
      if (!Array.isArray(itensSalvos)) return;

      const carrinhoReconstruido = itensSalvos
        .map((item) => {
          const produtoAtual = produtosDisponiveis.find(produto => produto.id === item.produto?.id);
          if (!produtoAtual) return null;
          return {
            produto: produtoAtual,
            quantidade: Math.min(Math.max(1, Number(item.quantidade ?? 1)), produtoAtual.quantidade_estoque),
          };
        })
        .filter((item): item is ItemCarrinho => item !== null && item.quantidade > 0);

      if (carrinhoReconstruido.length > 0) {
        setCarrinho(carrinhoReconstruido);
      }
    } catch {
      localStorage.removeItem(CARRINHO_STORAGE_KEY);
    }
  }

  useEffect(() => {
    if (!usuario) { navigate("/"); return; }
    carregarProdutos()
      .then(() => setLoading(false))
      .catch(() => { setProdutos(MOCK_PRODUTOS); setLoading(false); });

    const onScroll = () => setScrolled(window.scrollY > 60);
    const refreshProdutos = () => carregarProdutos().catch(() => undefined);
    window.addEventListener("scroll", onScroll);
    const intervalId = window.setInterval(refreshProdutos, 15000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshProdutos();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (produtos.length === 0) return;
    carregarCarrinhoSalvo(produtos);
  }, [produtos]);

  useEffect(() => {
    salvarCarrinho(carrinho);
  }, [carrinho]);

  useEffect(() => {
    if (buscaAberta) setTimeout(() => buscaInputRef.current?.focus(), 50);
  }, [buscaAberta]);

  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho(prev => {
      const existe = prev.find(i => i.produto.id === produto.id);
      if (existe) {
        if (existe.quantidade >= produto.quantidade_estoque) return prev;
        return prev.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  }

  function abrirConfirmacaoRemocao(item: ItemCarrinho) {
    setItemParaExcluir(item);
  }

  function confirmarRemocao() {
    if (!itemParaExcluir) return;
    const id = itemParaExcluir.produto.id;
    setCarrinho(prev => prev.filter(i => i.produto.id !== id));
    setItemParaExcluir(null);
  }

  function cancelarRemocao() {
    setItemParaExcluir(null);
  }

  function alterarQtd(id: number, delta: number, maxQuantidade?: number) {
    setCarrinho(prev =>
      prev.map(i => {
        if (i.produto.id !== id) return i;
        const proximaQtd = i.quantidade + delta;
        const quantidadeLimitada = typeof maxQuantidade === "number"
          ? Math.min(Math.max(1, proximaQtd), maxQuantidade)
          : Math.max(1, proximaQtd);
        return { ...i, quantidade: quantidadeLimitada };
      })
    );
  }

  async function finalizarPedido() {
    try {
      const response = await fetch(`${API}/loja/comprar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itens: carrinho.map(i => ({
            id_produto: i.produto.id,
            quantidade: i.quantidade,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Não foi possível concluir a compra");
      }
    } catch (e) {
      console.warn("Erro ao salvar compra:", e);
      mostrarToast(e instanceof Error ? e.message : "Não foi possível concluir a compra", "err");
      return;
    }

    setCarrinho([]);
    setCarrinhoAberto(false);
    setPedidoFeito(true);
    carregarProdutos().catch(() => undefined);
    mostrarToast("Compra realizada com sucesso!", "ok");
    setTimeout(() => setPedidoFeito(false), 5000);
  }

  function sair() {
    setConfirmarSairAberto(true);
  }

  function confirmarSaida() {
    salvarCarrinho(carrinho);
    sessionStorage.removeItem("usuario");
    setConfirmarSairAberto(false);
    navigate("/");
  }

  function cancelarSaida() {
    setConfirmarSairAberto(false);
  }

  function scrollTo(id: string) {
    const alvo = document.getElementById(id);
    if (!alvo) return;

    const inicio = window.scrollY;
    const destino = alvo.getBoundingClientRect().top + window.scrollY;
    const distancia = destino - inicio;
    const duracao = Math.min(700, Math.max(320, Math.abs(distancia) * 0.35));
    const tempoInicio = performance.now();

    const easeOutCubic = (valor: number) => 1 - Math.pow(1 - valor, 3);

    const animar = (tempoAtual: number) => {
      const progresso = Math.min((tempoAtual - tempoInicio) / duracao, 1);
      const suavizado = easeOutCubic(progresso);
      window.scrollTo(0, inicio + distancia * suavizado);

      if (progresso < 1) {
        window.requestAnimationFrame(animar);
      }
    };

    window.requestAnimationFrame(animar);
    setMenuAberto(false);
  }

  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const subtotal = carrinho.reduce((s, i) => s + i.produto.preco_venda * i.quantidade, 0);
  const frete = subtotal > 199 ? 0 : subtotal > 0 ? 19.9 : 0;

  const produtosFiltrados = produtos.filter(p => {
    const okBusca = (p.nome || "").toLowerCase().includes(busca.toLowerCase());
    const okTipo = filtroTipo === "all" || String(p.tipo) === filtroTipo;
    return okBusca && okTipo;
  });

  const qtdNoCarrinho = (id: number) => carrinho.find(i => i.produto.id === id)?.quantidade ?? 0;

  return (
    <div className="lj">

      {/* ─── HEADER ─── */}
      <header className={`lj-header ${scrolled ? "solid" : ""}`}>
        <div className="lj-header-inner">

          <a className="lj-logo" href="#inicio" onClick={e => { e.preventDefault(); scrollTo("inicio"); }}>
            <div className="lj-logo-mark">T</div>
            <span>Tool-Master</span>
          </a>

          <nav className={`lj-nav ${menuAberto ? "open" : ""}`}>
            <a onClick={() => scrollTo("inicio")}>Início</a>
            <a onClick={() => scrollTo("sobre")}>Sobre</a>
            <a onClick={() => scrollTo("produtos")}>Produtos</a>
            <a onClick={() => scrollTo("contato")}>Contato</a>
            {menuAberto && (
              <button className="lj-nav-close" onClick={() => setMenuAberto(false)}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Fechar Menu
              </button>
            )}
          </nav>

          <div className="lj-header-right">
            <button className="lj-hbtn" onClick={() => setBuscaAberta(v => !v)} title="Buscar">
              <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>

            <button className="lj-hbtn lj-cart-btn" onClick={() => setCarrinhoAberto(true)} title="Carrinho">
              <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {totalItens > 0 && <span className="lj-cart-badge">{totalItens}</span>}
            </button>

            <button className="lj-sair" onClick={sair}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sair
            </button>

            <button className="lj-hamburger" onClick={() => setMenuAberto(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 7h12" />
                <path d="M6 12h8" />
                <path d="M6 17h12" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`lj-searchbar ${buscaAberta ? "open" : ""}`}>
          <div className="lj-searchbar-inner">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={buscaInputRef}
              type="text"
              placeholder="Pesquisar produtos..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") setBuscaAberta(false);
                if (e.key === "Enter") { scrollTo("produtos"); setBuscaAberta(false); }
              }}
            />
            {busca && <button onClick={() => setBusca("")}>✕</button>}
          </div>
        </div>
      </header>

      {menuAberto && <div className="lj-mob-overlay" onClick={() => setMenuAberto(false)} />}

      {/* ─── CARRINHO SIDEBAR ─── */}
      <div className={`lj-cart-overlay ${carrinhoAberto ? "open" : ""}`} onClick={() => setCarrinhoAberto(false)}>
        <aside className="lj-cart-panel" onClick={e => e.stopPropagation()}>
          <div className="lj-cart-top">
            <h3>Seu Carrinho</h3>
            <button onClick={() => setCarrinhoAberto(false)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="lj-cart-body">
            {carrinho.length === 0 ? (
              <div className="lj-cart-empty">
                <svg width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" opacity="0.25"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <p>Seu carrinho está vazio</p>
              </div>
            ) : (
              carrinho.map(item => (
                <div key={item.produto.id} className="lj-ci">
                  <div className="lj-ci-icon">{TIPO_ICONS[item.produto.tipo]}</div>
                  <div className="lj-ci-info">
                    <span className="lj-ci-nome">{item.produto.nome}</span>
                    <span className="lj-ci-unit">{fmt(item.produto.preco_venda)}</span>
                    <div className="lj-ci-qty">
                      <button onClick={() => alterarQtd(item.produto.id, -1, item.produto.quantidade_estoque)} type="button">−</button>
                      <span>{item.quantidade}</span>
                      <button
                        onClick={() => alterarQtd(item.produto.id, 1, item.produto.quantidade_estoque)}
                        type="button"
                        disabled={item.quantidade >= item.produto.quantidade_estoque}
                        aria-label="Aumentar quantidade no carrinho"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="lj-ci-right">
                    <span className="lj-ci-total">{fmt(item.produto.preco_venda * item.quantidade)}</span>
                    <button
                      className="lj-ci-trash"
                      onClick={() => abrirConfirmacaoRemocao(item)}
                      type="button"
                      aria-label="Remover produto do carrinho"
                      title="Remover produto"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {carrinho.length > 0 && (
            <div className="lj-cart-foot">
              <div className="lj-cart-rows">
                <div className="lj-cr"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="lj-cr"><span>Frete</span><span className={frete === 0 ? "gratis" : ""}>{frete === 0 ? "Grátis 🎉" : fmt(frete)}</span></div>
                <div className="lj-cr total"><span>Total</span><span>{fmt(subtotal + frete)}</span></div>
              </div>
              {subtotal < 199 && (
                <p className="lj-frete-hint">Faltam {fmt(199 - subtotal)} para frete grátis!</p>
              )}
              <button className="lj-finalizar" onClick={finalizarPedido}>Finalizar Compra</button>
            </div>
          )}
        </aside>
      </div>

      {/* ─── HERO ─── */}
      <section className="lj-hero" id="inicio">
        <div className="lj-hero-content">
          <p className="lj-hero-tag">Qualidade profissional</p>
          <h1>Ferramentas para <br /><span>quem trabalha de verdade</span></h1>
          <p className="lj-hero-sub">As melhores marcas, garantia real e entrega para todo o Brasil.</p>
          <button className="lj-hero-btn" onClick={() => scrollTo("produtos")}>
            Ver produtos
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
        <button className="lj-scroll-arrow" onClick={() => scrollTo("sobre")}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        </button>
      </section>

      {/* ─── SOBRE ─── */}
      <section className="lj-sobre" id="sobre">
        <div className="lj-sobre-visual">
          <div className="lj-sobre-glyph">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FFD100" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{width:120,height:120}}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
        </div>
        <div className="lj-sobre-texto">
          <h2>Sobre Nós</h2>
          <p>A ToolMaster nasceu da paixão por ferramentas de qualidade e pelo trabalho bem feito. Desde nossa fundação, trazemos os melhores equipamentos com garantia real para profissionais e entusiastas.</p>
          <p>Nossa missão é oferecer ferramentas duráveis que combinam performance, segurança e o melhor custo-benefício do mercado.</p>
          <button className="lj-sobre-btn" onClick={() => scrollTo("produtos")}>Conheça nossos produtos</button>
        </div>
      </section>

      {/* ─── PRODUTOS ─── */}
      <section className="lj-produtos" id="produtos" ref={produtosRef}>
        <div className="lj-produtos-header">
          <h2>Nossos Produtos</h2>
          <p>Confira as melhores ferramentas do mercado</p>
        </div>

        <div className="lj-filtros">
          {[
            { key: "all", label: "Todos" },
            { key: "1", label: "Ferramentas" },
            { key: "2", label: "Peças" },
            { key: "3", label: "Acessórios" },
          ].map(f => (
            <button
              key={f.key}
              className={`lj-fbtn ${filtroTipo === f.key ? "ativo" : ""}`}
              onClick={() => setFiltroTipo(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="lj-grid">
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="lj-card lj-card--sk">
              <div className="sk-visual" />
              <div className="sk-body">
                <div className="sk-line lg" /><div className="sk-line sm" /><div className="sk-line btn" />
              </div>
            </div>
          ))}

          {!loading && produtosFiltrados.length === 0 && (
            <div className="lj-vazio">
              <p>Nenhum produto encontrado.</p>
              <button onClick={() => { setBusca(""); setFiltroTipo("all"); }}>Limpar filtros</button>
            </div>
          )}

          {!loading && produtosFiltrados.filter(p => p.quantidade_estoque > 0).map((p, idx) => (
            <ProdutoCard
              key={p.id}
              p={p}
              idx={idx}
              urgente={p.quantidade_estoque <= 5}
              noCarrinho={qtdNoCarrinho(p.id)}
              onAdicionar={() => adicionarAoCarrinho(p)}
              onAlterar={(delta, maxQuantidade) => alterarQtd(p.id, delta, maxQuantidade)}
              onIrCarrinho={() => setCarrinhoAberto(true)}
            />
          ))}
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="lj-news">
        <div className="lj-news-inner">
          <h2>Assine nossa Newsletter</h2>
          <p>Receba novidades, promoções e descontos exclusivos</p>
          <form className="lj-news-form" onSubmit={e => { e.preventDefault(); alert("Inscrito com sucesso!"); }}>
            <input
              type="email"
              placeholder="Seu melhor e-mail *"
              required
              onInvalid={(e) => e.currentTarget.setCustomValidity("Informe um e-mail válido")}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
            <button type="submit">Assinar</button>
          </form>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lj-footer" id="contato">
        <div className="lj-footer-grid">
          <div className="lj-fc">
            <h3>Tool-Master</h3>
            <p>Ferramentas profissionais para quem leva o trabalho a sério.</p>
            <div className="lj-socials">
              <a href="#" aria-label="Instagram">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" aria-label="WhatsApp">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>
          <div className="lj-fc">
            <h3>Links Úteis</h3>
            <ul>
              <li><a onClick={() => scrollTo("inicio")}>Início</a></li>
              <li><a onClick={() => scrollTo("sobre")}>Sobre</a></li>
              <li><a onClick={() => scrollTo("produtos")}>Produtos</a></li>
              <li><a onClick={() => scrollTo("contato")}>Contato</a></li>
            </ul>
          </div>
          <div className="lj-fc">
            <h3>Suporte</h3>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Política de Privacidade</a></li>
              <li><a href="#">Termos de Serviço</a></li>
              <li><a href="#">Trocas e Devoluções</a></li>
            </ul>
          </div>
          <div className="lj-fc">
            <h3>Contato</h3>
            <ul>
              <li>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                (85) 9 9999-9999
              </li>
              <li>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                contato@toolmaster.com.br
              </li>
            </ul>
          </div>
        </div>
        <div className="lj-copyright">
          <p>© 2025 ToolMaster. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* ─── TOAST ─── */}
      {(pedidoFeito || toast.visible) && (
        <div className={`lj-toast ${toast.visible ? toast.type : ""}`}>
          <div className="lj-toast-ok">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <strong>{toast.visible ? toast.msg : "Pedido realizado com sucesso!"}</strong>
            <span>{toast.visible ? "Verifique o carrinho e a vitrine atualizada." : "Em breve entraremos em contato."}</span>
          </div>
        </div>
      )}

      {itemParaExcluir && (
        <div className="lj-confirm-overlay" onClick={cancelarRemocao}>
          <div className="lj-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="lj-confirm-kicker">Confirmação necessária</span>
            <h3>Remover produto do carrinho?</h3>
            <p>
              Você está prestes a excluir <strong>{itemParaExcluir.produto.nome}</strong> do carrinho.
              Esta ação remove o item imediatamente.
            </p>
            <div className="lj-confirm-actions">
              <button type="button" className="lj-confirm-cancel" onClick={cancelarRemocao}>
                Cancelar
              </button>
              <button type="button" className="lj-confirm-danger" onClick={confirmarRemocao}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarSairAberto && (
        <div className="lj-confirm-overlay" onClick={cancelarSaida}>
          <div className="lj-confirm-modal lj-confirm-modal--logout" onClick={(e) => e.stopPropagation()}>
            <span className="lj-confirm-kicker">Encerrar sessão</span>
            <h3>Deseja sair da conta?</h3>
            <p>
              Seu carrinho será salvo com os itens e quantidades atuais para você continuar depois sem perder o que montou.
            </p>
            <div className="lj-confirm-actions">
              <button type="button" className="lj-confirm-cancel" onClick={cancelarSaida}>
                Continuar logado
              </button>
              <button type="button" className="lj-confirm-danger" onClick={confirmarSaida}>
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}