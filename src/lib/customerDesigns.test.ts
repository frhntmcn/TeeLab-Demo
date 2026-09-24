import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteSavedStudioDesign, getSavedStudioDesigns, saveStudioDesign, type SavedStudioDesignData } from './customerDesigns';

afterEach(() => vi.unstubAllGlobals());

const design: SavedStudioDesignData = {
  documents: { front: { version: '6.0.0', objects: [{ type: 'textbox', text: 'Merhaba' }] }, back: { version: '6.0.0', objects: [] } },
  options: { color: 'white', size: 'M', fit: 'slim', quantity: 1 },
  previews: { front: '', back: '' },
  measurements: { front: [], back: [] },
};

describe('account-saved studio designs', () => {
  it('reads saved designs from the signed-in account endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ designs: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getSavedStudioDesigns()).resolves.toEqual({ designs: [] });
    expect(fetchMock.mock.calls[0][0]).toBe('/wp-json/maymoon/v1/account/designs');
  });

  it('stores a versioned design payload in the customer account', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'design-id', name: 'Ön baskı', updated_at: '2026-09-22T00:00:00Z', design }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await saveStudioDesign('Ön baskı', design);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/wp-json/maymoon/v1/account/designs');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ name: 'Ön baskı', design });
  });

  it('deletes only the selected design record', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ deleted: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await deleteSavedStudioDesign('record-123');
    expect(fetchMock.mock.calls[0][0]).toBe('/wp-json/maymoon/v1/account/designs/record-123');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });
});
