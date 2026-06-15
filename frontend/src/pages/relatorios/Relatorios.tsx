import { useEffect, useRef, useState } from "react";
import { Sidebar } from "../../components/sidebar";
import "../../styles/data-panel.css";
import "./Relatorios.css";
import API_URL from "../../utils/api";
import { showToast } from "../../utils/toast";

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

function normalizarTextoPDF(valor: unknown): string {
  return String(valor ?? "-")
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[•]/g, "-")
    .replace(/[€]/g, "EUR")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[^\u0020-\u00FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escaparPDF(texto: string): string {
  return normalizarTextoPDF(texto)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function textoParaBytesLatin1(texto: string): Uint8Array {
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i += 1) {
    bytes[i] = texto.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function quebrarLinha(texto: string, maxCaracteres: number): string[] {
  const palavras = normalizarTextoPDF(texto).split(" ").filter(Boolean);
  const linhas: string[] = [];
  let atual = "";

  palavras.forEach((palavra) => {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (candidata.length > maxCaracteres && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = candidata;
    }
  });

  if (atual) linhas.push(atual);
  return linhas.length ? linhas : ["-"];
}

function criarPDFRelatorio(titulo: string, descricao: string, resumo: string, headers: string[], rows: string[][]): Blob {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const footerHeight = 34;
  const maxLinesPerCell = 2;
  const paginas: string[][] = [];
  let comandos: string[] = [];
  let y = pageHeight - margin;

  const relatorio = normalizarTextoPDF(titulo || "Relatório");
  const dataGeracao = new Date().toLocaleString("pt-BR");

  const cor = (r: number, g: number, b: number) => `${r} ${g} ${b}`;

  const retangulo = (x: number, yRect: number, largura: number, altura: number, preenchimento: string, contorno?: string) => {
    comandos.push("q");
    comandos.push(`${preenchimento} rg`);
    if (contorno) comandos.push(`${contorno} RG`);
    comandos.push(`${x} ${yRect} ${largura} ${altura} re`);
    comandos.push(contorno ? "B" : "f");
    comandos.push("Q");
  };

  const linha = (x1: number, y1: number, x2: number, y2: number, largura = 0.6, stroke = cor(0.86, 0.89, 0.94)) => {
    comandos.push("q", `${stroke} RG`, `${largura} w`, `${x1} ${y1} m`, `${x2} ${y2} l`, "S", "Q");
  };

  const texto = (x: number, yTexto: number, conteudo: string, tamanho = 10, fonte: "F1" | "F2" = "F1", preenchimento = cor(0.16, 0.20, 0.27)) => {
    comandos.push(
      "BT",
      `${preenchimento} rg`,
      `/${fonte} ${tamanho} Tf`,
      `1 0 0 1 ${x} ${yTexto} Tm`,
      `(${escaparPDF(normalizarTextoPDF(conteudo))}) Tj`,
      "ET"
    );
  };

  const textoDireita = (xDireita: number, yTexto: number, conteudo: string, tamanho = 10, fonte: "F1" | "F2" = "F1", preenchimento = cor(0.35, 0.40, 0.49)) => {
    const textoLimpo = normalizarTextoPDF(conteudo);
    const larguraAproximada = textoLimpo.length * tamanho * 0.52;
    texto(xDireita - larguraAproximada, yTexto, textoLimpo, tamanho, fonte, preenchimento);
  };

  const desenharCabecalho = () => {
    retangulo(0, pageHeight - 92, pageWidth, 92, cor(0.08, 0.13, 0.22));
    retangulo(margin, pageHeight - 70, 34, 34, cor(0.18, 0.42, 0.78));
    texto(margin + 10, pageHeight - 58, "R", 16, "F2", cor(1, 1, 1));
    texto(margin + 46, pageHeight - 47, "Relatório gerencial", 10, "F1", cor(0.80, 0.86, 0.95));
    texto(margin + 46, pageHeight - 68, relatorio, 18, "F2", cor(1, 1, 1));
    textoDireita(pageWidth - margin, pageHeight - 47, `Gerado em ${dataGeracao}`, 8, "F1", cor(0.80, 0.86, 0.95));
    y = pageHeight - 118;
  };

  const desenharRodape = (paginaAtual: number) => {
    linha(margin, footerHeight + 8, pageWidth - margin, footerHeight + 8, 0.5, cor(0.88, 0.91, 0.95));
    texto(margin, footerHeight - 8, "Sistema de gestão - documento gerado automaticamente", 8, "F1", cor(0.45, 0.50, 0.58));
    textoDireita(pageWidth - margin, footerHeight - 8, `Página ${paginaAtual}`, 8, "F1", cor(0.45, 0.50, 0.58));
  };

  const iniciarPagina = () => {
    comandos = [];
    desenharCabecalho();
  };

  const fecharPagina = () => {
    desenharRodape(paginas.length + 1);
    paginas.push(comandos);
  };

  const novaPagina = () => {
    fecharPagina();
    iniciarPagina();
  };

  iniciarPagina();

  retangulo(margin, y - 52, contentWidth, 62, cor(0.96, 0.98, 1), cor(0.86, 0.90, 0.96));
  texto(margin + 14, y - 8, "Descrição", 10, "F2", cor(0.18, 0.42, 0.78));
  let yDescricao = y - 25;
  quebrarLinha(descricao, 100).slice(0, 2).forEach((linhaDescricao) => {
    texto(margin + 14, yDescricao, linhaDescricao, 9, "F1", cor(0.28, 0.33, 0.41));
    yDescricao -= 12;
  });
  y -= 84;

  const totalRegistros = rows.length;
  const larguraCard = (contentWidth - 16) / 2;
  retangulo(margin, y - 42, larguraCard, 48, cor(1, 1, 1), cor(0.86, 0.90, 0.96));
  texto(margin + 14, y - 10, "Total de registros", 9, "F1", cor(0.45, 0.50, 0.58));
  texto(margin + 14, y - 30, String(totalRegistros), 17, "F2", cor(0.08, 0.13, 0.22));

  retangulo(margin + larguraCard + 16, y - 42, larguraCard, 48, cor(1, 1, 1), cor(0.86, 0.90, 0.96));
  texto(margin + larguraCard + 30, y - 10, "Resumo", 9, "F1", cor(0.45, 0.50, 0.58));
  quebrarLinha(resumo, 46).slice(0, 2).forEach((linhaResumo, indice) => {
    texto(margin + larguraCard + 30, y - 29 - indice * 11, linhaResumo, 8.5, "F1", cor(0.20, 0.25, 0.33));
  });
  y -= 74;

  const colunas = headers.length || 1;
  const colWidth = contentWidth / colunas;
  const charsPorColuna = Math.max(8, Math.floor(colWidth / 5.2));

  const desenharLinhaTabela = (valores: string[], tipo: "header" | "normal" | "empty" = "normal", indiceLinha = 0) => {
    const dados = headers.length ? valores : [valores[0] ?? "-"];
    const linhasPorCelula = Array.from({ length: colunas }, (_, index) => quebrarLinha(dados[index] ?? "-", charsPorColuna).slice(0, maxLinesPerCell));
    const altura = Math.max(...linhasPorCelula.map((linhas) => linhas.length)) * 11 + 14;

    if (y - altura < footerHeight + 28) novaPagina();

    const fundo = tipo === "header" ? cor(0.18, 0.42, 0.78) : indiceLinha % 2 === 0 ? cor(1, 1, 1) : cor(0.97, 0.98, 1);
    const borda = tipo === "header" ? cor(0.18, 0.42, 0.78) : cor(0.88, 0.91, 0.95);
    retangulo(margin, y - altura + 4, contentWidth, altura, fundo, borda);

    linhasPorCelula.forEach((linhas, coluna) => {
      const x = margin + coluna * colWidth + 8;
      if (coluna > 0) linha(margin + coluna * colWidth, y - altura + 4, margin + coluna * colWidth, y + 4, 0.4, tipo === "header" ? cor(0.40, 0.58, 0.84) : cor(0.88, 0.91, 0.95));
      linhas.forEach((linhaTexto, indice) => {
        texto(
          x,
          y - 10 - indice * 11,
          linhaTexto,
          tipo === "header" ? 8.5 : 8,
          tipo === "header" ? "F2" : "F1",
          tipo === "header" ? cor(1, 1, 1) : cor(0.20, 0.25, 0.33)
        );
      });
    });

    y -= altura;
  };

  texto(margin, y, "Detalhamento", 12, "F2", cor(0.08, 0.13, 0.22));
  y -= 22;
  desenharLinhaTabela(headers.length ? headers : ["Dados"], "header");

  if (rows.length) {
    rows.forEach((row, indice) => desenharLinhaTabela(row, "normal", indice));
  } else {
    desenharLinhaTabela(["Nenhum dado disponível para este relatório."], "empty", 0);
  }

  fecharPagina();

  const objetos: string[] = [];
  const pageObjectIds: number[] = [];

  objetos.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objetos.push("");
  objetos.push("3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj");
  objetos.push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj");

  paginas.forEach((pagina) => {
    const pageId = objetos.length + 1;
    const contentId = objetos.length + 2;
    const stream = pagina.join("\n");
    pageObjectIds.push(pageId);
    objetos.push(`${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >> endobj`);
    objetos.push(`${contentId} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`);
  });

  objetos[1] = `2 0 obj << /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >> endobj`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objetos.forEach((objeto) => {
    offsets.push(pdf.length);
    pdf += `${objeto}\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([textoParaBytesLatin1(pdf)], { type: "application/pdf" });
}

function baixarArquivo(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
      showToast("Selecione um relatório antes de exportar.", "warning");
      return;
    }

    if (loading) {
      showToast("Aguarde o relatório terminar de carregar.", "info");
      return;
    }

    try {
      const pdf = criarPDFRelatorio(
        activeReportDef.label,
        activeReportDef.description,
        reportData.summary,
        reportData.headers,
        reportData.rows
      );
      const data = new Date().toISOString().slice(0, 10);
      baixarArquivo(pdf, `relatorio-${activeReport}-${data}.pdf`);
      showToast("PDF exportado com sucesso.", "success");
    } catch (err) {
      console.error(err);
      showToast("Não foi possível exportar o PDF.", "error");
    }
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
                  disabled={loading || !activeReportDef}
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
