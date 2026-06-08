import { Sidebar } from "../../components/sidebar";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { IconAlert, IconBox, IconCart, IconCard, IconMoney, IconTool, IconUsers } from "../../components/ui/icons";
import "./dashboard.css";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`; // ✅ Adicionado /api

function fmt(valor: number) {
  return "R$ " + valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtData(dataStr: string) {
  const d = new Date(dataStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ✅ Função auxiliar para fetch com token
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

interface AtividadeRecente {
  id_venda: number;
  data_venda: string;
  valor_total: number;
  nome_cliente: string;
  produtos: string;
  total_itens: number;
}

interface DashboardData {
  vendas_dia: number;
  qtd_vendas_dia: number;
  ordens_abertas: number;
  total_clientes: number;
  total_estoque: number;
  atividade_recente: AtividadeRecente[];
}

export function Dashboard() {
  const navigate = useNavigate();
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se tem token
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // ✅ Usando fetchWithAuth
    fetchWithAuth(`${API}/dashboard`)
      .then(r => {
        if (r.status === 401) {
          // Token inválido ou expirado
          localStorage.removeItem("token");
          navigate("/");
          throw new Error("Sessão expirada");
        }
        if (!r.ok) throw new Error("Erro ao carregar dados");
        return r.json();
      })
      .then(data => { 
        setDados(data); 
        setCarregando(false); 
      })
      .catch((err) => { 
        console.error(err);
        setErro(err.message);
        setCarregando(false); 
      });
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    navigate("/");
  }

  // ✅ Função para buscar nome do usuário logado
  const getUsuarioLogado = () => {
    const usuarioStr = sessionStorage.getItem("usuario");
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        return usuario.usuario || "Usuário";
      } catch {
        return "Usuário";
      }
    }
    return "Usuário";
  };

  return (
    <div className="dashboard-wrapper dashboard-container">
      <Sidebar />

      <main className="dashboard-page dashboard-content">

        {/* ── Top bar ── */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span className="topbar-greeting">ToolMaster</span>
              <span className="topbar-sep">/</span>
              <span className="topbar-title">Dashboard</span>
            </div>
          </div>
          <div className="topbar-right">
            <button onClick={handleLogout} className="btn-logout" title="Sair">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
            <div className="topbar-avatar">
              {getUsuarioLogado().charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="dashboard-body">

          {/* Mensagem de erro */}
          {erro && (
            <div className="dashboard-alert">
              <IconAlert className="dashboard-alert-icon" /> {erro}
            </div>
          )}

          {/* KPI Cards */}
          <p className="section-title">Resumo do dia</p>
          <div className="cards">

            <div className="card" style={{"--card-accent":"#FFD100","--icon-bg":"#FFF9E6"} as React.CSSProperties}>
              <div className="card-header">
                <div className="card-icon"><IconMoney /></div>
                <h3>Vendas do Dia</h3>
              </div>
              {carregando ? <p style={{color:"#9ca3af",fontSize:20}}>...</p> : (
                <>
                  <p>{dados ? fmt(dados.vendas_dia) : "R$ 0,00"}</p>
                </>
              )}
            </div>

            <div className="card" style={{"--card-accent":"#3B82F6","--icon-bg":"#EFF6FF"} as React.CSSProperties}>
              <div className="card-header">
                <div className="card-icon"><IconTool /></div>
                <h3>Ordens de Serviço</h3>
              </div>
              {carregando ? <p style={{color:"#9ca3af",fontSize:20}}>...</p> : (
                <>
                  <p>{dados?.ordens_abertas ?? 0}</p>
                </>
              )}
            </div>

            <div className="card" style={{"--card-accent":"#10B981","--icon-bg":"#ECFDF5"} as React.CSSProperties}>
              <div className="card-header">
                <div className="card-icon"><IconUsers /></div>
                <h3>Clientes</h3>
              </div>
              {carregando ? <p style={{color:"#9ca3af",fontSize:20}}>...</p> : (
                <>
                  <p>{dados?.total_clientes ?? 0}</p>
                </>
              )}
            </div>

            <div className="card" style={{"--card-accent":"#8B5CF6","--icon-bg":"#F5F3FF"} as React.CSSProperties}>
              <div className="card-header">
                <div className="card-icon"><IconBox /></div>
                <h3>Produtos em Estoque</h3>
              </div>
              {carregando ? <p style={{color:"#9ca3af",fontSize:20}}>...</p> : (
                <>
                  <p>{dados?.total_estoque ?? 0}</p>
                </>
              )}
            </div>

          </div>

          {/* ── Main panels ── */}
          <p className="section-title" style={{marginTop:28}}>Atividade recente</p>
          <div className="dashboard-grid">

            {/* Recent sales */}
            <div className="panel">
              <div className="panel-header">
                <h2>Vendas Recentes</h2>
                {dados && dados.atividade_recente && dados.atividade_recente.length > 0 && (
                  <span className="panel-badge">
                    {dados.atividade_recente.length} registro{dados.atividade_recente.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="panel-body">
                {carregando && (
                  <div className="order-item" style={{justifyContent:"center",color:"#9ca3af"}}>
                    Carregando...
                  </div>
                )}
                {!carregando && (!dados || !dados.atividade_recente || dados.atividade_recente.length === 0) && (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"32px 0",color:"#9ca3af"}}>
                    <span style={{fontSize:36}}><IconCart style={{ width: 36, height: 36 }} /></span>
                    <span style={{fontSize:14}}>Nenhuma venda registrada ainda.</span>
                  </div>
                )}
                {!carregando && dados && dados.atividade_recente && dados.atividade_recente.map((v) => (
                  <div className="order-item" key={v.id_venda}>
                    <div className="order-avatar"><IconTool /></div>
                    <div className="order-info">
                      <div className="order-name">{v.nome_cliente ?? "Cliente"}</div>
                      <div className="order-desc" style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {v.produtos ?? "—"} · {fmtData(v.data_venda)}
                      </div>
                    </div>
                    <div className="order-right">
                      <div className="order-value">{fmt(v.valor_total)}</div>
                      <span className="order-status status-done">Concluída</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick access */}
            <div className="panel">
              <div className="panel-header">
                <h2>Acesso Rápido</h2>
              </div>
              <div className="quick-access">
                {[
                  { icon:<IconUsers />, label:"Novo Cliente",        sub:"Cadastrar cliente",    to:"/clientes/novo" },
                  { icon:<IconTool />, label:"Nova Ordem",          sub:"Criar O.S.",            to:"/ordem/novo" },
                  { icon:<IconBox />, label:"Gerenciar Produtos",  sub:"Estoque e preços",      to:"/produtos" },
                  { icon:<IconCard />, label:"Fluxo de Caixa",      sub:"Receitas e despesas",   to:"/caixa" },
                  { icon:<IconUsers />, label:"Funcionários",        sub:"Gerenciar acessos",     to:"/funcionarios" },
                ].map((q, i) => (
                  <Link to={q.to} className="quick-btn" key={i}>
                    <div className="quick-btn-icon">{q.icon}</div>
                    <div>
                      <div className="quick-btn-label">{q.label}</div>
                      <div className="quick-btn-sub">{q.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* ── Logout section ── */}
          <div className="logout-section">
            <div className="logout-section-info">
              <h4>Encerrar sessão</h4>
              <p>Certifique-se de salvar seu trabalho antes de sair do sistema.</p>
            </div>
            <button onClick={handleLogout} className="btn-logout-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair da conta
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}