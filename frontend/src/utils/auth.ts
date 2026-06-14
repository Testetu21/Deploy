export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length < 2) return null;

    const base64Url = tokenParts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    const nivelNormalizado = Number(payload.nivel ?? payload.nivel_acesso ?? 0);

    return {
      ...payload,
      nivel: nivelNormalizado,
    } as { id: number; nivel: number; tipo: string };
  } catch {
    return null;
  }
}

export function getNivel(): number {
  return getUser()?.nivel ?? 0;
}

export function isLogado(): boolean {
  return !!getUser();
}

export function isAdmin(): boolean {
  const nivel = getNivel();
  return nivel === 1 || nivel === 2;
}