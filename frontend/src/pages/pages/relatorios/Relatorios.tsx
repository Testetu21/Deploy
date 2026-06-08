import "../../utils/toast";
﻿import { useEffect, useRef, useState } from "react";
import { Sidebar } from "../../components/sidebar";
import "../../styles/data-panel.css";
import "./Relatorios.css";
import API_URL from "../../utils/api";

const API = `${API_URL}/api`;

type ReportKey =
  | "vendas-periodo"
  | "estoques-criticos"
  | "ordens-servico"
  | "fluxo-caixa-diario"
  | "comissoes-vendedor"
  | "clientes-inadiplentes"
  | "garantias-processadas"
  | "produtos-maior-margem"
  | "historico-precos-compra"
  | "performance-tecnica"
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
  { key: "vendas-periodo",          label: "Vendas por período",          description: "Análise de receitas e volumes de vendas em intervalos selecionados." },
  { key: "estoques-criticos",       label: "Estoques críticos",           description: "Produtos com estoque baixo que precisam de reposição rápida."        },
  { key: "ordens-servico",          label: "Ordens de serviço",           description: "Resumo das ordens de serviço em aberto, em andamento e concluídas."  },
  { key: "fluxo-caixa-diario",      label: "Fluxo de caixa diário",       description: "Entradas e saídas de caixa dia a dia para análise financeira."       },
  { key: "comissoes-vendedor",      label: "Comissões por vendedor",      description: "Resumo de comissões calculadas para cada vendedor."                   },
  { key: "clientes-inadiplentes",   label: "Clientes inadimplentes",      description: "Lista de clientes com pagamentos em atraso ou pendências."           },
  { key: "garantias-processadas",   label: "Garantias processadas",       description: "Garantias registradas nas ordens de serviço concluídas."             },
  { key: "produtos-maior-margem",   label: "Produtos com maior margem",   description: "Produtos com maior margem de lucro baseada nos preços cadastrados."  },
  { key: "historico-precos-compra", label: "Histórico de preços de compra", description: "Preços de compra atuais aplicados aos produtos do estoque."        },
  { key: "performance-tecnica",     label: "Performance técnica",         description: "Desempenho dos técnicos com base nas ordens de serviço concluídas."  },
  { key: "devolucao-trocas",        label: "Devoluções e trocas",         description: "Vendas canceladas registradas como devoluções no sistema."           },
  { key: "previsao-demanda",        label: "Previsão de demanda",         description: "Estimativa de demanda com base nas vendas dos últimos 30 dias."      },
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

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconBarChart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconFileText = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

export default function Relatorios() {
  const [activeReport, setActiveReport] = useState<ReportKey | null>(null);
  const [reportData, setReportData]     = useState<ReportPayload>(initialPayload);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeReportDef = reports.find((r) => r.key === activeReport) ?? null;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!activeReport) return;
    let ignore = false;
    setLoading(true);
    setError(null);
    setReportData(initialPayload);

    const defaultStart = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const today        = new Date().toISOString().slice(0, 10);
    const query        = activeReport === "vendas-periodo"
      ? `?data_inicio=${encodeURIComponent(defaultStart)}&data_fim=${encodeURIComponent(today)}`
      : "";

    fetchWithAuth(`${API}/relatorios/${activeReport}${query}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ao carregar relatório: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        if (!data || !Array.isArray(data.headers) || !Array.isArray(data.rows))
          throw new Error("Resposta inválida do servidor");
        setReportData({
          summary: data.summary || "Relatório carregado com sucesso.",
          headers: data.headers,
          rows: data.rows,
        });
      })
      .catch((err) => { if (!ignore) setError(err.message || "Falha ao carregar o relatório."); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [activeReport]);

  function handleSelect(key: ReportKey) {
    setActiveReport(key);
    setDropdownOpen(false);
  }

  function exportarPDF() {
    if (!activeReportDef) {
      alert("Selecione um relatório antes de exportar.");
      return;
    }

    const janela = window.open("", "_blank");

    if (!janela) {
      alert("Não foi possível abrir a janela de impressão.");
      return;
    }

    const linhas = reportData.rows
      .map((row) => `
        <tr>
          ${row.map((cell) => `<td>${cell}</td>`).join("")}
        </tr>
      `)
      .join("");

    const cabecalho = reportData.headers
      .map((header) => `<th>${header}</th>`)
      .join("");

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>${activeReportDef.label}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }

            h1 {
              font-size: 22px;
              margin-bottom: 4px;
            }

            .subtitle {
              color: #6b7280;
              margin-bottom: 20px;
            }

            .summary {
              background: #f3f4f6;
              border: 1px solid #e5e7eb;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              font-size: 12px;
              text-align: left;
            }

            th {
              background: #f9fafb;
            }

            .footer {
              margin-top: 24px;
              font-size: 11px;
              color: #6b7280;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${activeReportDef.label}</h1>
          <p class="subtitle">${activeReportDef.description}</p>

          <div class="summary">
            ${reportData.summary}
          </div>

          <table>
            <thead>
              <tr>${cabecalho}</tr>
            </thead>
            <tbody>
              ${linhas || `<tr><td colspan="${reportData.headers.length || 1}">Nenhum dado disponível.</td></tr>`}
            </tbody>
          </table>

          <div class="footer">
            Relatório gerado em ${new Date().toLocaleString("pt-BR")}
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    janela.document.close();
  }

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

        <div className="relatorios-body">

          {/* ── Selector ── */}
          <div className="rel-selector-wrap" ref={dropdownRef}>
            <button
              className={`rel-selector-btn ${dropdownOpen ? "open" : ""}`}
              onClick={() => setDropdownOpen((o) => !o)}
              type="button"
            >
              <span className="rel-selector-left">
                <span className="rel-selector-bar-icon"><IconBarChart /></span>
                <span className={activeReportDef ? "rel-selector-label" : "rel-selector-placeholder"}>
                  {activeReportDef ? activeReportDef.label : "Selecione um relatório"}
                </span>
              </span>
              <span className={`rel-selector-chevron ${dropdownOpen ? "rotated" : ""}`}>
                <IconChevronDown />
              </span>
            </button>

            {dropdownOpen && (
              <div className="rel-dropdown">
                {reports.map((report) => (
                  <button
                    key={report.key}
                    type="button"
                    className={`rel-dropdown-item ${report.key === activeReport ? "active" : ""}`}
                    onClick={() => handleSelect(report.key)}
                  >
                    <span className="rel-dropdown-dot" />
                    <span className="rel-dropdown-label">{report.label}</span>
                    {report.key === activeReport && (
                      <span className="rel-check"><IconCheck /></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Painel ── */}
          {activeReport && activeReportDef && (
            <div className="data-panel rel-panel">
              <div className="dp-header">
                <div className="dp-header-left">
                  <h2 className="dp-title">{activeReportDef.label}</h2>
                  <p className="dp-subtitle">{activeReportDef.description}</p>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={exportarPDF}
                  disabled={loading || !reportData.rows.length}
                >
                  Exportar PDF
                </button>
              </div>

              <div className="dp-content">
                {error && (
                  <div className="report-summary-card" style={{ background: "#fdecea", color: "#b91c1c" }}>
                    <p>Erro: {error}</p>
                  </div>
                )}
                <div className="report-summary-card">
                  <p>{reportData.summary}</p>
                </div>
                <div className="dp-table-wrap">
                  {loading ? (
                    <div className="rel-loading">
                      <div className="rel-spinner" />
                      <p>Carregando relatório...</p>
                    </div>
                  ) : reportData.rows.length ? (
                    <table className="dp-table">
                      <thead>
                        <tr>{reportData.headers.map((h) => <th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {reportData.rows.map((row, ri) => (
                          <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="rel-empty">
                      <p>Nenhum dado disponível para este relatório.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Estado inicial ── */}
          {!activeReport && (
            <div className="rel-empty-state">
              <div className="rel-empty-state-icon"><IconFileText /></div>
              <h3>Nenhum relatório selecionado</h3>
              <p>Use o seletor acima para escolher um relatório e visualizar os dados.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}