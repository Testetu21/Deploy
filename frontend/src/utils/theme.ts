/**
 * Theme — Dark/Light com persistência e botão flutuante.
 * Tema padrão: dark (foco visual principal).
 */
const STORAGE_KEY = "tm-theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) btn.innerHTML = theme === "dark" ? sunIcon() : moonIcon();
}

function sunIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>`;
}
function moonIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;
}

export function initTheme() {
  if (typeof window === "undefined") return;
  applyTheme(getInitialTheme());

  const ensureButton = () => {
    if (document.getElementById("theme-toggle-btn")) return;
    const btn = document.createElement("button");
    btn.id = "theme-toggle-btn";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Alternar tema");
    btn.title = "Alternar tema";
    btn.innerHTML = (document.documentElement.getAttribute("data-theme") === "dark") ? sunIcon() : moonIcon();
    btn.addEventListener("click", () => {
      const cur = (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
      applyTheme(cur === "dark" ? "light" : "dark");
    });
    document.body.appendChild(btn);
  };

  if (document.body) ensureButton();
  else document.addEventListener("DOMContentLoaded", ensureButton);
}
