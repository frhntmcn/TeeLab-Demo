export interface AdminSession {
  authenticated: boolean;
  restNonce?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'shop_manager' | 'administrator';
  };
}

const endpoint = (path: string) => `/wp-json/maymoon/v1/${path}`;
let restNonce: string | undefined;

export function getAdminRestNonce() { return restNonce; }

export function requiresLiveAdminAuthentication(hostname = window.location.hostname) {
  return hostname === 'maymoon.com.tr' || hostname === 'www.maymoon.com.tr';
}

async function readResponse(response: Response): Promise<AdminSession> {
  const body = await response.json().catch(() => ({})) as AdminSession & { message?: string };
  if (!response.ok) throw new Error(body.message ?? 'Yönetim erişimi doğrulanamadı.');
  if (body.restNonce) restNonce = body.restNonce;
  return body;
}

export async function getAdminSession(): Promise<AdminSession> {
  const response = await fetch(endpoint('session'), { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  return readResponse(response);
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  const response = await fetch(endpoint('admin-login'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return readResponse(response);
}

export async function logoutAdmin() {
  const response = await fetch(endpoint('admin-logout'), { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', ...(restNonce ? { 'X-WP-Nonce': restNonce } : {}) } });
  restNonce = undefined;
  return readResponse(response);
}
