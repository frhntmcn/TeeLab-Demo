export interface CheckoutFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutFormValues, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+90|0090|0)?\s*5\d{2}[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}$/;

export function validateCheckout(values: CheckoutFormValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (!values.name.trim()) errors.name = 'Ad soyad gerekli.';
  if (!values.phone.trim()) errors.phone = 'Telefon numarası gerekli.';
  else if (!phonePattern.test(values.phone.trim())) errors.phone = 'Geçerli bir Türkiye cep telefonu gir.';
  if (!values.email.trim()) errors.email = 'E-posta adresi gerekli.';
  else if (!emailPattern.test(values.email.trim())) errors.email = 'Geçerli bir e-posta adresi gir.';
  if (!values.address.trim()) errors.address = 'Teslimat adresi gerekli.';
  return errors;
}
