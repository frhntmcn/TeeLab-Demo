import { describe, expect, it } from 'vitest';
import { requiresLiveCustomerAccount } from './customerSession';

describe('requiresLiveCustomerAccount', () => {
  it('requires an account on the Maymoon production hosts', () => {
    expect(requiresLiveCustomerAccount('maymoon.com.tr')).toBe(true);
    expect(requiresLiveCustomerAccount('www.maymoon.com.tr')).toBe(true);
  });

  it('leaves local development and preview demos usable', () => {
    expect(requiresLiveCustomerAccount('localhost')).toBe(false);
    expect(requiresLiveCustomerAccount('teelab-demo-git-test.vercel.app')).toBe(false);
  });
});
