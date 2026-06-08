import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar";
import { IconBox, IconBuilding, IconCard, IconCart, IconChart, IconEye, IconMoney, IconTool, IconUsers } from "../../components/ui/icons";
import "./Detalhes.css";

interface DetailsState {
  title?: string;
  data?: Record<string, unknown>;
}

function formatLabel(key: string) {
  const words = key.replace(/_/g, " ").split(" ");
  const mapped = words.map((w, i) => {
    if (w.toLowerCase() === "id") return "Código";
    if (i === 0 && w.toLowerCase().startsWith("id")) return "Código";
    return w;
  });
  return mapped.join(" ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (value instanceof Date) return value.toLocaleString("pt-BR");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function Detalhes() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as DetailsState;

  const title = state.title || "Detalhes";
  const entries = Object.entries(state.data || {}).filter(
    ([, value]) => typeof value !== "function"
  );

  const normalizedTitle = title.toLowerCase().trim();
  const iconMap: Record<string, JSX.Element> = {
    "cliente": <IconUsers />,
    "fornecedor": <IconBuilding />,
    "funcionário": <IconUsers />,
    "funcionario": <IconUsers />,
    "pagamento": <IconCard />,
    "despesa": <IconMoney />,
    "caixa": <IconMoney />,
    "orçamento": <IconChart />,
    "orcamento": <IconChart />,
    "produto": <IconBox />,
    "movimentação": <IconChart />,
    "movimentacao": <IconChart />,
    "ordem de serviço": <IconTool />,
    "ordem de servico": <IconTool />,
    "venda": <IconCart />,
  };
  const headerIcon = iconMap[normalizedTitle] ?? <IconEye />;
  const idEntry = entries.find(([key]) => /^id(_|$)/i.test(key));
  const idValue = idEntry ? formatValue(idEntry[1]) : null;

  return (
    <div className="detalhes-wrapper">
      <Sidebar />
      <div className="detalhes-page">
        <header className="p-topbar">
          <div className="p-topbar-title">{title}</div>
          <div className="p-topbar-actions">
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Voltar
            </button>
          </div>
        </header>

        <div className="p-content detalhes-content">
          <div className="detalhes-hero">
            <div className="detalhes-hero-icon">{headerIcon}</div>
            <div className="detalhes-hero-info">
              <div className="detalhes-hero-title">{title}</div>
              <div className="detalhes-hero-meta">
                <span>{entries.length} campos</span>
                {idValue && <span>• Código {idValue}</span>}
              </div>
            </div>
          </div>
          {entries.length === 0 ? (
            <div className="detalhes-empty">Sem informações disponíveis.</div>
          ) : (
            <div className="detalhes-card">
              <dl>
                {entries.map(([key, value]) => (
                  <div className="detalhes-row" key={key}>
                    <dt>{formatLabel(key)}</dt>
                    <dd>{formatValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
