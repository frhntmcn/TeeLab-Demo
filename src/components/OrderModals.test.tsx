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
    const markup = renderToStaticMarkup(<SummaryModal {...props} templateMetadata={{ front: { id: 'big-heading', name: 'Büyük Başlık' } }} />);
    expect(markup).toContain('Büyük Başlık');
    expect(markup).toContain('Özel tasarım');
  });

  it('uses a safe custom-design label for old or empty metadata', () => {
    expect(renderToStaticMarkup(<SummaryModal {...props} />)).toContain('Özel tasarım');
    expect(renderToStaticMarkup(<SummaryModal {...props} templateMetadata={{ back: undefined }} />)).toContain('Özel tasarım');
  });
});
