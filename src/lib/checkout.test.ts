import { describe, expect, it } from 'vitest';
import { validateCheckout } from './checkout';

const valid = { name: 'Ada Yılmaz', phone: '0532 123 45 67', email: 'ada@example.com', address: 'Kadıköy, İstanbul' };

describe('checkout validation', () => {
  it('rejects blank and whitespace-only values', () => {
    expect(validateCheckout({ name: ' ', phone: ' ', email: ' ', address: '   ' })).toEqual({ name: 'Ad soyad gerekli.', phone: 'Telefon numarası gerekli.', email: 'E-posta adresi gerekli.', address: 'Teslimat adresi gerekli.' });
  });

  it('rejects malformed email and phone values', () => {
    expect(validateCheckout({ ...valid, email: 'not-an-email', phone: '12345' })).toEqual({ phone: 'Geçerli bir Türkiye cep telefonu gir.', email: 'Geçerli bir e-posta adresi gir.' });
  });

  it('accepts a valid demo checkout form', () => {
    expect(validateCheckout(valid)).toEqual({});
  });
});
