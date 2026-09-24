export interface CustomerSession {
  authenticated: boolean;
  restNonce?: string;
  user?: { id: number; name: string; email: string };
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  address: {
    first_name: string; last_name: string; company: string; tax_office: string; tax_number: string;
    line_1: string; line_2: string; city: string; district: string; postcode: string; country: string;
  };
}

export interface CustomerOrder {
  id: number;
  number: string;
  date: string;
  status: string;
  total: number;
  items: { name: string; quantity: number }[];
}

const endpoint = (path: string) => `/wp-json/maymoon/v1/account/${path}`;
let restNonce: string | undefined;
const nonceHeaders = (): Record<string, string> => restNonce ? { 'X-WP-Nonce': restNonce } : {};
export function getCustomerRestNonce() { return restNonce; }

export function requiresLiveCustomerAccount(hostname = window.location.hostname) {
  return hostname === 'maymoon.com.tr' || hostname === 'www.maymoon.com.tr';
}

async function responseAsSession(response: Response): Promise<CustomerSession> {
  const body = await response.json().catch(() => ({})) as CustomerSession & { message?: string };
  if (!response.ok) throw new Error(body.message ?? 'Hesap işlemi tamamlanamadı.');
  if (body.restNonce) restNonce = body.restNonce;
  if (!body.authenticated) restNonce = undefined;
  return body;
}

export async function getCustomerSession() {
  return responseAsSession(await fetch(endpoint('session'), { credentials: 'same-origin', headers: { Accept: 'application/json' } }));
}

export async function registerCustomer(input: { name: string; email: string; password: string }) {
  return responseAsSession(await fetch(endpoint('register'), { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(input) }));
}

export async function loginCustomer(login: string, password: string) {
  return responseAsSession(await fetch(endpoint('login'), { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password }) }));
}

export async function logoutCustomer() {
  return responseAsSession(await fetch(endpoint('logout'), { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...nonceHeaders() }, body: '{}' }));
}

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(body.message ?? fallback);
  return body;
}

export async function getCustomerProfile() {
  return readResponse<CustomerProfile>(await fetch(endpoint('profile'), { credentials: 'same-origin', headers: { Accept: 'application/json', ...nonceHeaders() } }), 'Hesap bilgileri alınamadı.');
}

export async function updateCustomerProfile(profile: CustomerProfile) {
  return readResponse<CustomerProfile>(await fetch(endpoint('profile'), { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...nonceHeaders() }, body: JSON.stringify(profile) }), 'Hesap bilgileri kaydedilemedi.');
}

export async function getCustomerOrders() {
  return readResponse<{ orders: CustomerOrder[] }>(await fetch(endpoint('orders'), { credentials: 'same-origin', headers: { Accept: 'application/json', ...nonceHeaders() } }), 'Sipariş geçmişi alınamadı.');
}

export async function requestPasswordReset(login: string) {
  const response = await fetch(endpoint('password-reset'), { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ login }) });
  if (!response.ok) throw new Error('Şifre sıfırlama isteği gönderilemedi.');
}
