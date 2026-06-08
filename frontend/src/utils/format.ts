// ============================================================
// FORMATADORES PADRÃO DO SISTEMA — usar em TODAS as páginas.
// ============================================================

const NF_BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NF_NUM = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NF_PCT = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DF_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DF_DATETIME = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DF_TIME = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** R$ 1.234,56 */
export function formatCurrency(v: unknown): string {
  return NF_BRL.format(toNum(v));
}

/** 1.234,56 (sem prefixo) */
export function formatNumber(v: unknown): string {
  return NF_NUM.format(toNum(v));
}

/** 12,50% — recebe número (12.5), NÃO 0.125 */
export function formatPercent(v: unknown): string {
  return `${NF_PCT.format(toNum(v))}%`;
}

/** 09/05/2026 */
export function formatDate(v: unknown): string {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v as string);
  if (isNaN(d.getTime())) return "-";
  return DF_DATE.format(d);
}

/** 09/05/2026 14:32 */
export function formatDateTime(v: unknown): string {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v as string);
  if (isNaN(d.getTime())) return "-";
  return DF_DATETIME.format(d);
}

/** 14:32 */
export function formatTime(v: unknown): string {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v as string);
  if (isNaN(d.getTime())) return "-";
  return DF_TIME.format(d);
}
