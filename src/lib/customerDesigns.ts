import type { DesignSides, ObjectMeasurement, OrderOptions, PreviewImages, Side, TemplateMetadata } from '../types';
import { getCustomerRestNonce } from './customerSession';

export interface SavedStudioDesignData {
  documents: DesignSides;
  options: OrderOptions;
  previews: PreviewImages;
  templateMetadata?: Partial<Record<Side, TemplateMetadata>>;
  measurements: Record<Side, ObjectMeasurement[]>;
}

export interface SavedStudioDesign {
  id: string;
  name: string;
  updated_at: string;
  design: SavedStudioDesignData;
}

const endpoint = '/wp-json/maymoon/v1/account/designs';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(getCustomerRestNonce() ? { 'X-WP-Nonce': getCustomerRestNonce()! } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(body.message ?? 'Kayıtlı tasarımlar alınamadı.');
  return body;
}

export async function getSavedStudioDesigns() {
  return request<{ designs: SavedStudioDesign[] }>(endpoint);
}

export async function getSavedStudioDesign(id: string) {
  const { designs } = await getSavedStudioDesigns();
  const record = designs.find((item) => item.id === id);
  if (!record) throw new Error('Bu tasarım hesabında bulunamadı.');
  return record;
}

export async function saveStudioDesign(name: string, design: SavedStudioDesignData) {
  return request<SavedStudioDesign>(endpoint, { method: 'POST', body: JSON.stringify({ name, design }) });
}

export async function deleteSavedStudioDesign(id: string) {
  return request<{ deleted: boolean }>(`${endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
