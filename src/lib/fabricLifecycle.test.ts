import { describe, expect, it, vi } from 'vitest';
import { disposeFabricCanvas } from './fabricLifecycle';

describe('disposeFabricCanvas', () => {
  it('aborts JSON loading and cancels rendering before asynchronous disposal', () => {
    const order: string[] = [];
    const controller = new AbortController();
    controller.signal.addEventListener('abort', () => order.push('abort'));
    disposeFabricCanvas({
      cancelRequestedRender: vi.fn(() => order.push('cancel')),
      dispose: vi.fn(async () => { order.push('dispose'); return true; }),
    }, controller);
    expect(order).toEqual(['abort', 'cancel', 'dispose']);
  });
});
