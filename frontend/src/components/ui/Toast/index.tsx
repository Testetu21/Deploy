import { useEffect, useState } from "react";
import "./toast.css";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
};

const ICONS: Record<Toast["type"], string> = {
  success: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
    <path d="M6.5 10.5L8.5 12.5L13.5 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  error: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
    <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  warning: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.134 3.527c.38-.7 1.352-.7 1.732 0l6.928 12.75C18.173 17 17.687 18 16.928 18H3.072c-.759 0-1.245-1-.866-1.723L9.134 3.527Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M10 8v4M10 13.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  info: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
    <path d="M10 9v5M10 6.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
};

const LABELS: Record<Toast["type"], string> = {
  success: "Sucesso",
  error: "Erro",
  warning: "Atenção",
  info: "Informação",
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent;
      const id = Date.now();

      setToasts((prev) => [
        ...prev,
        {
          id,
          message: customEvent.detail.message,
          type: customEvent.detail.type || "success",
        },
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }

    window.addEventListener("site-toast", handleToast);
    return () => window.removeEventListener("site-toast", handleToast);
  }, []);

  return (
    <div className="toast-area" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`site-toast toast-${toast.type}`} key={toast.id} role="alert">
          <div
            className="toast-icon"
            dangerouslySetInnerHTML={{ __html: ICONS[toast.type] }}
          />
          <div className="toast-body">
            <span className="toast-label">{LABELS[toast.type]}</span>
            <p className="toast-message">{toast.message}</p>
          </div>
          <div className="toast-progress" />
          <button
            type="button"
            className="toast-close"
            aria-label="Fechar"
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          >
            <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
