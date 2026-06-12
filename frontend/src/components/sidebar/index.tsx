import React, { useEffect, useRef, useState } from "react";
import "./sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUser } from "../../utils/auth";
import ConfirmDialog from "../ui/ConfirmDialog";

// ── ÍCONES ────────────────────────────────────────────────────────────────────
const IconDashboard    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IconClientes     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconVendas       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconOrcamentos   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconOrdens       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const IconProdutos     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const IconFornec       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
const IconFuncion      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCaixa        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconPagamento    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconUsuarios     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>;
const IconLoja         = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconMovimentacao = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 7 23 1 17 1"/><polyline points="1 17 1 23 7 23"/><line x1="23" y1="1" x2="16" y2="8"/><line x1="1" y1="23" x2="8" y2="16"/></svg>;
const IconDespesa      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconRelatorios  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconLogout       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

// Setas para abrir/fechar (vindo da direita)
const IconChevronLeft  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconChevronRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

// ── MAPEAMENTO DE NÍVEL → NOME ────────────────────────────────────────────────
const NIVEL_NOME: Record<number, string> = {
  1: "Administrador",
  2: "Gerente",
  3: "Vendedor",
  4: "Técnico",
  5: "Caixa",
  6: "Cliente",
};

// ── DEFINIÇÃO DO MENU COM NÍVEIS PERMITIDOS ───────────────────────────────────
const navGroups = [
  {
    title: null,
    items: [
      { to: "/dashboard", icon: <IconDashboard />, label: "Dashboard", niveis: [1, 2] },
    ],
  },
  {
    title: "Vendas",
    items: [
      { to: "/clientes",   icon: <IconClientes />,   label: "Clientes",   niveis: [1, 2, 3] },
      { to: "/vendas",     icon: <IconVendas />,     label: "Vendas",     niveis: [1, 2, 3] },
      { to: "/orcamentos", icon: <IconOrcamentos />, label: "Orçamentos", niveis: [1, 2, 4] },
    ],
  },
  {
    title: "Serviços",
    items: [
      { to: "/ordem", icon: <IconOrdens />, label: "Ordens de Serviço", niveis: [1, 2, 4] },
    ],
  },
  {
    title: "Gestão",
    items: [
      { to: "/produtos",     icon: <IconProdutos />, label: "Produtos",      niveis: [1, 2, 3] },
      { to: "/fornecedores", icon: <IconFornec />,   label: "Fornecedores",  niveis: [1, 2] },
      { to: "/funcionarios", icon: <IconFuncion />,  label: "Funcionários",  niveis: [1] },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { to: "/caixa",         icon: <IconCaixa />,        label: "Fluxo de Caixa",  niveis: [1, 2, 5] },
      { to: "/movimentacoes", icon: <IconMovimentacao />, label: "Movimentações",   niveis: [1, 2] },
      { to: "/pagamentos",    icon: <IconPagamento />,    label: "Pagamentos",      niveis: [1, 2, 5] },
    ],
  },
  {
    title: "Sistema",
    items: [
      { to: "/usuarios", icon: <IconUsuarios />, label: "Usuários", niveis: [1] },
      { to: "/relatorios", icon: <IconRelatorios />, label: "Relatórios", niveis: [1] },
      { to: "/loja",     icon: <IconLoja />,     label: "Vitrine"       },
    ],
  },
];

export function Sidebar() {
  // Fechado por padrão em qualquer tamanho de tela
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [navScroll, setNavScroll] = useState(0);
  const location = useLocation();
  const locationState = location.state as { from?: string } | null;
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement | null>(null);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);

  const user = getUser();
  const nivel = user?.nivel ?? 0;

  const usuarioRaw = sessionStorage.getItem("usuario");
  let usuarioSession: any = null;
  try { usuarioSession = usuarioRaw ? JSON.parse(usuarioRaw) : null; } catch { }

  const nomeUsuario = usuarioSession?.nome || usuarioSession?.usuario || "Usuário";
  const roleUsuario = NIVEL_NOME[nivel] ?? "Usuário";
  const avatar = nomeUsuario.trim().charAt(0).toUpperCase() || "U";

  function doLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    setConfirmLogout(false);
    navigate("/");
  }

  const close = () => setOpen(false);
  const toggle = () => setOpen(o => !o);

  const effectivePath =
    location.pathname === "/detalhes" && locationState?.from
      ? locationState.from
      : location.pathname;

  const isActivePath = (to: string, pathname: string) =>
    pathname === to || pathname.startsWith(`${to}/`);

  useEffect(() => {
    if (!open) return;
    const nav = navRef.current;
    if (nav) {
      nav.scrollTop = navScroll;
    }
    if (activeLinkRef.current) {
      activeLinkRef.current.scrollIntoView({ block: "center" });
    }
  }, [open]);

  return (
    <>
      {/* Botão seta — sempre visível, fixo à direita */}
      <button
        className={`sidebar-toggle ${open ? "open" : ""}`}
        onClick={toggle}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
      >
        {open ? <IconChevronLeft /> : <IconChevronRight />}
      </button>

      <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={close} />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">T</div>
          <div className="sidebar-logo-text">ToolMaster</div>
        </div>

        {/* Nav */}
        <nav
          className="sidebar-nav"
          ref={navRef}
          onScroll={(e) => setNavScroll((e.currentTarget as HTMLElement).scrollTop)}
        >
          {navGroups.map((group, gi) => {
            const itensFiltrados = group.items.filter(item =>
              !item.niveis || item.niveis.includes(nivel)
            );

            if (!itensFiltrados.length) return null;

            return (
              <div key={gi} className="sidebar-group">
                {group.title && (
                  <p className="sidebar-group-title">{group.title}</p>
                )}
                {itensFiltrados.map((item) => {
                  const active = isActivePath(item.to, effectivePath);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={close}
                      ref={active ? activeLinkRef : undefined}
                      className={`sidebar-link ${active ? "active" : ""}`}
                    >
                      <span className="sidebar-link-icon">{item.icon}</span>
                      <span className="sidebar-link-label">{item.label}</span>
                      {active && <span className="sidebar-link-dot" />}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{avatar}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{nomeUsuario}</div>
              <div className="sidebar-user-role">{roleUsuario}</div>
            </div>
          </div>
          <button onClick={() => setConfirmLogout(true)} className="sidebar-logout" title="Sair">
            <IconLogout />
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmLogout}
        title="Sair da sua conta?"
        message="Você precisará entrar novamente para acessar o sistema."
        confirmLabel="Sair"
        cancelLabel="Continuar"
        variant="warning"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
