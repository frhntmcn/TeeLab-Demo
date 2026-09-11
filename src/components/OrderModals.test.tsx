import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SummaryModal } from './OrderModals';

const props = {
  options: { color: 'white' as const, size: 'M' as const, fit: 'slim' as const, quantity: 1 },
  price: { baseUnit: 100, frontUnit: 0, backUnit: 0, subtotal: 100, discount: 0, total: 100 },
  previews: { front: '', back: '' },
  measurements: [],
  orderId: 'TL-1000',
  onClose: vi.fn(),
  onEmail: vi.fn(),
};

describe('order template metadata', () => {
  it('renders the template name with only its recorded side', () => {
    const markup = renderToStaticMarkup(<SummaryModal {...props} templateId="big-heading" templateSide="front" />);
    expect(markup).toContain('Ön yüz: Büyük Başlık');
    expect(markup).not.toContain('Arka yüz: Büyük Başlık');
  });

  it('uses a safe custom-design label for old or empty metadata', () => {
    expect(renderToStaticMarkup(<SummaryModal {...props} />)).toContain('Özel tasarım');
    expect(renderToStaticMarkup(<SummaryModal {...props} templateId="missing-template" templateSide="back" />)).toContain('Özel tasarım');
  });
});
