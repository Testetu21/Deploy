
import "./utils/toast";
import React from "react";

window.history.scrollRestoration = "manual";

let savedScroll = 0;

window.addEventListener("scroll", () => {
  savedScroll = window.scrollY;
});

window.addEventListener("beforeunload", () => {
  sessionStorage.setItem("scroll-position", String(savedScroll));
});

window.addEventListener("load", () => {
  const pos = sessionStorage.getItem("scroll-position");
  if(pos){
    window.scrollTo(0, Number(pos));
  }
});

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import ToastContainer from "./components/ui/Toast";

import { Login }        from "./pages/pages/login";
import { Home }         from "./pages/pages/home/home";
import { SignUp }       from "./pages/pages/sign-up";
import { Dashboard }    from "./pages/pages/dashboard";
import Produtos         from "./pages/pages/produtos/Produtos";
import ProdutoForm      from "./pages/pages/produtos/ProdutoForm";
import Clientes         from "./pages/pages/clientes/Clientes";
import ClienteForm      from "./pages/pages/clientes/ClienteForm";
import Loja             from "./pages/pages/loja/Loja";
import Fornecedores     from "./pages/pages/fornecedores/fornecedores";
import FornecedorForm   from "./pages/pages/fornecedores/FornecedorForm";
import Funcionarios     from "./pages/pages/funcionarios/funcionarios";
import FuncionarioForm  from "./pages/pages/funcionarios/FuncionarioForm";
import Vendas           from "./pages/pages/vendas/vendas";
import VendasForm       from "./pages/pages/vendas/VendasForm";
import VendasDetalhes   from "./pages/pages/vendas/VendasDetalhes";
import Ordem            from "./pages/pages/OrdemServico/OrdemServico";
import OrdemForm        from "./pages/pages/OrdemServico/OrdemServicoForm";
import OrdemServicoDetalhes from "./pages/pages/OrdemServico/OrdemServicoDetalhes";
import Orcamento        from "./pages/pages/orcamentos/Orcamento";
import OrcamentoForm    from "./pages/pages/orcamentos/OrcamentoForm";
import Caixa            from "./pages/pages/FluxoCaixa/FluxoCaixa";
import CaixaForm        from "./pages/pages/FluxoCaixa/FluxoCaixaForm";
import Pagamentos       from "./pages/pages/Pagamentos/Pagamentos";
import PagamentosForm   from "./pages/pages/Pagamentos/PagamentosForm";
import Movimentacoes    from "./pages/pages/movimentacoes/movimentacoes";
import Despesas         from "./pages/pages/despesas/Despesas";
import DespesasForm     from "./pages/pages/despesas/DespesasForm";
import Usuarios         from "./pages/pages/usuarios/Usuarios";
import Relatorios       from "./pages/pages/relatorios/Relatorios";
import Detalhes         from "./pages/pages/detalhes/Detalhes";

import "./index.css";

// ── NÍVEIS DE ACESSO ──────────────────────────────────────────────────────────
// 1=Admin  2=Gerente  3=Vendedor  4=Técnico  5=Caixa  6=Cliente
const ADMIN    = [1];
const GERENTE  = [1, 2];
const VENDEDOR = [1, 2, 3];
const TECNICO  = [1, 2, 4];
const CAIXA    = [1, 2, 5];

const root = document.getElementById("root");

createRoot(root!).render(
  <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <ToastContainer />
    <Routes>

      {/* ── PÚBLICAS ── */}
      <Route path="/"        element={<Login />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/loja"    element={<Loja />} />

      {/* ── GERAL — qualquer funcionário logado ── */}
      <Route path="/home"      element={<PrivateRoute element={<Home />} />} />

      {/* ── DASHBOARD — admin e gerente ── */}
      <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />}   niveis={GERENTE} />} />

      {/* ── CLIENTES — vendedor pode tudo menos excluir (bloqueio no backend) ── */}
      <Route path="/clientes"            element={<PrivateRoute element={<Clientes />}    niveis={VENDEDOR} />} />
      <Route path="/clientes/novo"       element={<PrivateRoute element={<ClienteForm />} niveis={VENDEDOR} />} />
      <Route path="/clientes/editar/:id" element={<PrivateRoute element={<ClienteForm />} niveis={VENDEDOR} />} />

      {/* ── VENDAS — vendedor pode ver e criar, editar só gerente+ ── */}
      <Route path="/vendas"              element={<PrivateRoute element={<Vendas />}         niveis={VENDEDOR} />} />
      <Route path="/vendas/novo"         element={<PrivateRoute element={<VendasForm />}     niveis={VENDEDOR} />} />
      <Route path="/vendas/editar/:id"   element={<PrivateRoute element={<VendasForm />}     niveis={GERENTE} />} />
      <Route path="/vendas/:id"          element={<PrivateRoute element={<VendasDetalhes />} niveis={VENDEDOR} />} />

      {/* ── PRODUTOS — vendedor só visualiza (sem novo/editar) ── */}
      <Route path="/produtos"            element={<PrivateRoute element={<Produtos />}    niveis={VENDEDOR} />} />
      <Route path="/produtos/novo"       element={<PrivateRoute element={<ProdutoForm />} niveis={GERENTE} />} />
      <Route path="/produtos/editar/:id" element={<PrivateRoute element={<ProdutoForm />} niveis={GERENTE} />} />

      {/* ── FORNECEDORES — só gerente+ ── */}
      <Route path="/fornecedores"            element={<PrivateRoute element={<Fornecedores />}    niveis={GERENTE} />} />
      <Route path="/fornecedores/novo"       element={<PrivateRoute element={<FornecedorForm />} niveis={GERENTE} />} />
      <Route path="/fornecedores/editar/:id" element={<PrivateRoute element={<FornecedorForm />} niveis={GERENTE} />} />

      {/* ── FUNCIONÁRIOS — só admin ── */}
      <Route path="/funcionarios"            element={<PrivateRoute element={<Funcionarios />}    niveis={ADMIN} />} />
      <Route path="/funcionarios/novo"       element={<PrivateRoute element={<FuncionarioForm />} niveis={ADMIN} />} />
      <Route path="/funcionarios/editar/:id" element={<PrivateRoute element={<FuncionarioForm />} niveis={ADMIN} />} />

      {/* ── ORDEM DE SERVIÇO — técnico pode ver e criar ── */}
      <Route path="/ordem"            element={<PrivateRoute element={<Ordem />}    niveis={TECNICO} />} />
      <Route path="/ordem/novo"       element={<PrivateRoute element={<OrdemForm />} niveis={TECNICO} />} />
      <Route path="/ordem/editar/:id" element={<PrivateRoute element={<OrdemForm />} niveis={TECNICO} />} />
      <Route path="/ordem/:id/detalhes" element={<PrivateRoute element={<OrdemServicoDetalhes />} niveis={TECNICO} />} />
    
      {/* ── ORÇAMENTOS — técnico pode listar e criar, editar só gerente+ ── */}
      <Route path="/orcamentos"            element={<PrivateRoute element={<Orcamento />}    niveis={TECNICO} />} />
      <Route path="/orcamentos/novo"       element={<PrivateRoute element={<OrcamentoForm />} niveis={TECNICO} />} />
      <Route path="/orcamentos/editar/:id" element={<PrivateRoute element={<OrcamentoForm />} niveis={GERENTE} />} />
      {/*FINANCEIRO*/}

      {/* ── CAIXA — caixa e gerente+ ── */}
      <Route path="/caixa"               element={<PrivateRoute element={<Caixa />}        niveis={CAIXA} />} />
      <Route path="/caixa/novo"          element={<PrivateRoute element={<CaixaForm />}     niveis={CAIXA} />} />
      <Route path="/caixa/editar/:id"    element={<PrivateRoute element={<CaixaForm />}     niveis={CAIXA} />} />

      {/* ── PAGAMENTOS — caixa e gerente+ ── */}
      <Route path="/pagamentos"          element={<PrivateRoute element={<Pagamentos />}    niveis={CAIXA} />} />
      <Route path="/pagamentos/novo"     element={<PrivateRoute element={<PagamentosForm />} niveis={CAIXA} />} />
      <Route path="/pagamentos/editar/:id" element={<PrivateRoute element={<PagamentosForm />} niveis={CAIXA} />} />

      {/* ── DESPESAS — gerente+ ── */}
      <Route path="/despesas"            element={<PrivateRoute element={<Despesas />}      niveis={CAIXA} />} />
      <Route path="/despesas/novo"       element={<PrivateRoute element={<DespesasForm />}  niveis={CAIXA} />} />
      <Route path="/despesas/editar/:id" element={<PrivateRoute element={<DespesasForm />}  niveis={CAIXA} />} />

      {/* ── MOVIMENTAÇÕES — gerente+ ── */}
      <Route path="/movimentacoes"       element={<PrivateRoute element={<Movimentacoes />} niveis={CAIXA} />} />

      {/* ── DETALHES — visão rápida ── */}
      <Route path="/detalhes"            element={<PrivateRoute element={<Detalhes />} />} />

      {/* ── USUÁRIOS — só admin ── */}
      <Route path="/usuarios" element={<PrivateRoute element={<Usuarios />} niveis={ADMIN} />} />

      {/* ── RELATÓRIOS — só admin ── */}
      <Route path="/relatorios" element={<PrivateRoute element={<Relatorios />} niveis={ADMIN} />} />

    </Routes>
  </BrowserRouter>
);