import { describe, expect, it } from 'vitest';
import { requiresLiveAdminAuthentication } from './adminSession';

describe('requiresLiveAdminAuthentication', () => {
  it('requires an authenticated management session only on the live Maymoon hosts', () => {
    expect(requiresLiveAdminAuthentication('maymoon.com.tr')).toBe(true);
    expect(requiresLiveAdminAuthentication('www.maymoon.com.tr')).toBe(true);
    expect(requiresLiveAdminAuthentication('teelab-demo.vercel.app')).toBe(false);
    expect(requiresLiveAdminAuthentication('localhost')).toBe(false);
  });
});
