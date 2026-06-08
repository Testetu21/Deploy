import { useEffect, useState } from "react";
import { Sidebar } from "../../components/sidebar";
import "../../styles/data-panel.css";
import "./Relatorios.css";

const API = "http://localhost:3001/api";

type ReportKey =
  | "vendas-periodo"
  | "estoques-criticos"
  | "ordens-servico"
  | "garantias-processadas"
  | "comissoes-vendedor"
  | "produtos-maior-margem"
  | "clientes-inadiplentes"
  | "historico-precos-compra"
  | "performance-tecnica"
  | "fluxo-caixa-diario"
  | "devolucao-trocas"
  | "previsao-demanda";

interface ReportDefinition {
  key: ReportKey;
  label: string;
  description: string;
}

interface ReportPayload {
  summary: string;
  headers: string[];
  rows: string[][];
}

const reports: ReportDefinition[] = [
  { key: "vendas-periodo", label: "Vendas por período", description: "Análise de receitas e volumes de vendas em intervalos selecionados." },
  { key: "estoques-criticos", label: "Estoques críticos", description: "Produtos com estoque baixo que precisam de reposição rápida." },
  { key: "ordens-servico", label: "Ordens de serviço", description: "Resumo das ordens de serviço em aberto, em progresso e concluídas." },
  { key: "garantias-processadas", label: "Garantias processadas", description: "Histórico de garantias registradas e processadas no sistema." },
  { key: "comissoes-vendedor", label: "Comissões por vendedor", description: "Resumo de comissões calculadas para cada vendedor." },
  { key: "produtos-maior-margem", label: "Produtos com maior margem", description: "Produtos mais lucrativos com maior margem de lucro." },
  { key: "clientes-inadiplentes", label: "Clientes inadimplentes", description: "Lista de clientes com pagamentos atrasados ou pendências financeiras." },
  { key: "historico-precos-compra", label: "Histórico de preços de compra", description: "Acompanhe os preços de compra reais cadastrados no sistema." },
  { key: "performance-tecnica", label: "Performance técnica", description: "Indicadores de desempenho da equipe técnica." },
  { key: "fluxo-caixa-diario", label: "Fluxo de caixa diário", description: "Entradas e saídas de caixa dia a dia para análise financeira." },
  { key: "devolucao-trocas", label: "Devolução e trocas", description: "Movimentações de devolução e troca registradas como vendas canceladas." },
  { key: "previsao-demanda", label: "Previsão de demanda", description: "Estimativa de necessidade futura de produtos para compras e estoque." },
];

const initialPayload: ReportPayload = {
  summary: "Carregando dados do relatório...",
  headers: [],
  rows: [],
};

function fetchWithAuth(url: string, options: RequestInit = {}) {
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

export default function Relatorios() {
  const [activeReport, setActiveReport] = useState<ReportKey>(reports[0].key);
  const [reportData, setReportData] = useState<ReportPayload>(initialPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeReportDefinition = reports.find((report) => report.key === activeReport)!;

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    setReportData(initialPayload);

    const defaultStart = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const query = activeReport === "vendas-periodo" ? `?data_inicio=${encodeURIComponent(defaultStart)}&data_fim=${encodeURIComponent(today)}` : "";

    fetchWithAuth(`${API}/relatorios/${activeReport}${query}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Erro ao carregar relatório: ${response.statusText}`);
        return response.json();
      })
      .then((data) => {
        if (ignore) return;
        if (!data || !Array.isArray(data.headers) || !Array.isArray(data.rows)) {
          throw new Error("Resposta inválida do servidor");
        }
        setReportData({
          summary: data.summary || "Relatório carregado com sucesso.",
          headers: data.headers,
          rows: data.rows,
        });
      })
      .catch((err) => {
        if (ignore) return;
        console.error(err);
        setError(err.message || "Falha ao carregar o relatório.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeReport]);

  return (
    <div className="relatorios-page">
      <Sidebar />
      <main className="relatorios-main">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Relatórios</h1>
            <p className="page-description">Selecione um relatório para visualizar detalhes e indicadores principais.</p>
          </div>
        </div>

        <div className="reports-layout">
          <aside className="reports-menu">
            <div className="reports-menu-title">Relatórios disponíveis</div>
            <div className="reports-menu-list">
              {reports.map((report) => (
                <button
                  key={report.key}
                  type="button"
                  className={`report-item ${report.key === activeReport ? "active" : ""}`}
                  onClick={() => setActiveReport(report.key)}
                >
                  <span>{report.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="reports-content">
            <div className="data-panel">
              <div className="dp-header">
                <div className="dp-header-left">
                  <h2 className="dp-title">{activeReportDefinition.label}</h2>
                  <p className="dp-subtitle">{activeReportDefinition.description}</p>
                </div>
              </div>

              <div className="dp-content">
                {error && (
                  <div className="report-summary-card" style={{ background: '#fdecea', color: '#b91c1c' }}>
                    <p>Erro: {error}</p>
                  </div>
                )}

                <div className="report-summary-card">
                  <p>{reportData.summary}</p>
                </div>

                <div className="dp-table-wrap">
                  {loading ? (
                    <p style={{ color: '#6b7280' }}>Carregando relatório...</p>
                  ) : reportData.rows.length ? (
                    <table className="dp-table">
                      <thead>
                        <tr>
                          {reportData.headers.map((header) => (
                            <th key={header}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#6b7280' }}>Nenhum dado disponível para este relatório.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
