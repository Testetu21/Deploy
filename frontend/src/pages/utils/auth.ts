// Decodifica o payload do JWT salvo no localStorage (sem verificar assinatura,
// só para leitura de dados como nivel/id — a validação real é sempre no backend)
export function getUsuarioLogado(): { nivel?: number; id?: number; id_funcionario?: number; [key: string]: any } | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  const user = getUsuarioLogado();
  return user?.nivel === 1 || user?.nivel === 2;
}