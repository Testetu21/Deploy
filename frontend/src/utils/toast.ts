export type ToastType = "success" | "error" | "warning" | "info";

export function showToast(message: string, type: ToastType = "success") {
  window.dispatchEvent(
    new CustomEvent("site-toast", {
      detail: { message, type },
    })
  );
}

/* ──────────────────────────────────────────────────────────────
   Sobrescreve window.alert para exibir o Toast estilizado.
   Detecta automaticamente o tipo pela mensagem.
   ────────────────────────────────────────────────────────────── */
window.alert = (message?: any) => {
  const msg = String(message || "");
  const lower = msg.toLowerCase();

  let type: ToastType = "success";

  if (
    lower.includes("erro") ||
    lower.includes("error") ||
    lower.includes("falha") ||
    lower.includes("inválido") ||
    lower.includes("invalido") ||
    lower.includes("expirada") ||
    lower.includes("obrigatório") ||
    lower.includes("obrigatorio")
  ) {
    type = "error";
  } else if (
    lower.includes("atenção") ||
    lower.includes("atencao") ||
    lower.includes("aviso") ||
    lower.includes("deve ser maior") ||
    lower.includes("adicione") ||
    lower.includes("informe")
  ) {
    type = "warning";
  } else if (lower.includes("info") || lower.includes("carregando")) {
    type = "info";
  }

  showToast(msg, type);
};
