import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import {
  IconBox,
  IconCheck,
  IconClock,
  IconAlert,
} from "../../components/ui/icons";
import { Button } from "../../components/ui/button";
import { getUser } from "../../utils/auth";
import "./home.css";

interface DashboardStats {
  totalOrdens: number;
  ordensPendentes: number;
  ordensEmProgresso: number;
  ordensFinalizadas: number;
  totalVendas: number;
  totalClientes: number;
}


const IconMoneyAction  = () => <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconChartAction  = () => <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconUsersAction  = () => <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
export function Home() {
  const navigate = useNavigate();
  const user = getUser();
  const usuarioRaw = sessionStorage.getItem("usuario");
  let usuarioSession: { nome?: string; usuario?: string } | null = null;
  try {
    usuarioSession = usuarioRaw ? JSON.parse(usuarioRaw) : null;
  } catch {
    usuarioSession = null;
  }

  const nomeUsuario = usuarioSession?.nome || usuarioSession?.usuario || "Usuário";
  const primeiroNome = nomeUsuario.split(" ")[0] || "Usuário";
  const roleUsuario =
    user?.nivel === 1 ? "Administrador" :
    user?.nivel === 2 ? "Gerente" :
    user?.nivel === 3 ? "Vendedor" :
    user?.nivel === 4 ? "Técnico" :
    user?.nivel === 5 ? "Caixa" :
    "Usuário";

  const stats: DashboardStats = {
    totalOrdens: 24,
    ordensPendentes: 8,
    ordensEmProgresso: 5,
    ordensFinalizadas: 11,
    totalVendas: 156,
    totalClientes: 42,
  };

  const userLevel = (user as any)?.nivel_acesso || user?.nivel || 0;
  const isTecnico = userLevel === 4;
  const isVendedor = userLevel === 3;
  const isGerente = userLevel === 2 || userLevel === 1;
  const hoje = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  const primaryAction = isTecnico
    ? { label: "Nova ordem", route: "/ordem/novo" }
    : isVendedor
      ? { label: "Nova venda", route: "/vendas/novo" }
      : { label: "Ir para clientes", route: "/clientes" };

  const secondaryAction = isGerente
    ? { label: "Abrir dashboard", route: "/dashboard" }
    : { label: "Ver ordens", route: "/ordem" };

  return (
    <div className="home-wrapper">
      <Sidebar />
      <div className="home-page page-shell">
        <div className="p-topbar">
          <div className="p-topbar-title">
            <span className="badge">Operação</span>
            Painel principal
          </div>
          <div className="p-topbar-actions">
            <Button variant="secondary" onClick={() => navigate(secondaryAction.route)}>
              {secondaryAction.label}
            </Button>
            <Button variant="primary" onClick={() => navigate(primaryAction.route)}>
              {primaryAction.label}
            </Button>
          </div>
        </div>

        <div className="p-content">
          <section className="home-hero">
            <div className="hero-card">
              <span className="hero-kicker">Bem-vindo, {primeiroNome}</span>
              <h1 className="hero-title">
                Organize o atendimento, acompanhe resultados e reduza retrabalho.
              </h1>
              <p className="hero-copy">
                Este painel foi pensado para uso rápido no dia a dia: prioridades visíveis,
                ações diretas e leitura clara dos números mais importantes.
              </p>
              <div className="hero-actions">
                <Button variant="primary" onClick={() => navigate(primaryAction.route)}>
                  {primaryAction.label}
                </Button>
                <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                  Ver indicadores
                </Button>
              </div>
            </div>

            <aside className="hero-panel">
              <div className="hero-panel-header">
                <div>
                  <p className="hero-panel-title">Resumo de hoje</p>
                  <p className="hero-panel-subtitle">{hoje}</p>
                </div>
                <span className="pill">{roleUsuario}</span>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <span className="label">Ordens abertas</span>
                  <strong>{stats.totalOrdens - stats.ordensFinalizadas}</strong>
                </div>
                <div className="info-card">
                  <span className="label">Clientes cadastrados</span>
                  <strong>{stats.totalClientes}</strong>
                </div>
                <div className="info-card">
                  <span className="label">Vendas registradas</span>
                  <strong>{stats.totalVendas}</strong>
                </div>
                <div className="info-card">
                  <span className="label">Finalizadas</span>
                  <strong>{stats.ordensFinalizadas}</strong>
                </div>
              </div>
            </aside>
          </section>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon si-yellow">
                <IconBox />
              </div>
              <div className="stat-info">
                <p>Total de Ordens</p>
                <strong>{stats.totalOrdens}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon si-blue">
                <IconClock />
              </div>
              <div className="stat-info">
                <p>Pendentes</p>
                <strong>{stats.ordensPendentes}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon si-purple">
                <IconAlert />
              </div>
              <div className="stat-info">
                <p>Em Progresso</p>
                <strong>{stats.ordensEmProgresso}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon si-green">
                <IconCheck />
              </div>
              <div className="stat-info">
                <p>Finalizadas</p>
                <strong>{stats.ordensFinalizadas}</strong>
              </div>
            </div>
          </div>

          <section className="surface-grid two-columns">
            <div className="surface-card">
              <div className="surface-card-header">
                <div>
                  <p className="section-kicker">Fluxo de trabalho</p>
                  <h3 className="surface-title">Ações rápidas</h3>
                  <p className="surface-subtitle">Atalhos mais usados para reduzir cliques.</p>
                </div>
              </div>
              <div className="surface-card-body">
                <div className="action-grid">
                  {isTecnico && (
                    <button
                      type="button"
                      className="action-card"
                      onClick={() => navigate("/ordem/novo")}
                    >
                      <div className="action-icon">📋</div>
                      <h4>Nova Ordem</h4>
                      <p>Criar ordem de serviço</p>
                    </button>
                  )}

                  {isVendedor && (
                    <button
                      type="button"
                      className="action-card"
                      onClick={() => navigate("/vendas/novo")}
                    >
                      <div className="action-icon"><IconMoneyAction /></div>
                      <h4>Nova Venda</h4>
                      <p>Registrar venda</p>
                    </button>
                  )}

                  {isGerente && (
                    <>
                      <button
                        type="button"
                        className="action-card"
                        onClick={() => navigate("/dashboard")}
                      >
                        <div className="action-icon"><IconChartAction /></div>
                        <h4>Dashboard</h4>
                        <p>Ver análises completas</p>
                      </button>
                      <button
                        type="button"
                        className="action-card"
                        onClick={() => navigate("/clientes")}
                      >
                        <div className="action-icon"><IconUsersAction /></div>
                        <h4>Clientes</h4>
                        <p>Gerenciar clientes</p>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="surface-card">
              <div className="surface-card-header">
                <div>
                  <p className="section-kicker">Acompanhar</p>
                  <h3 className="surface-title">Atividade recente</h3>
                  <p className="surface-subtitle">Movimentos mais importantes para retomar rápido.</p>
                </div>
                <span className="pill">Atualizado agora</span>
              </div>
              <div className="surface-card-body">
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon" style={{ background: "#ddf0ff" }}>
                      <IconBox />
                    </div>
                    <div className="activity-content">
                      <h4>Ordem #1001 criada</h4>
                      <p>Cliente: João Silva</p>
                      <span className="activity-time">Há 2 horas</span>
                    </div>
                    <div className="activity-badge">Nova</div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon" style={{ background: "#d4f5e5" }}>
                      <IconCheck />
                    </div>
                    <div className="activity-content">
                      <h4>Ordem #998 concluída</h4>
                      <p>Técnico: Carlos</p>
                      <span className="activity-time">Há 1 dia</span>
                    </div>
                    <div className="activity-badge" style={{ background: "#d4f5e5", color: "#116b3a" }}>
                      Concluída
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
