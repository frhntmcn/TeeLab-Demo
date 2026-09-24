import { useState } from 'react';
import { brand } from '../config/brand';

const STORAGE_KEY = `${brand.storageNamespace}:cookie-consent:v1`;

export function CookieConsent() {
  const [visible, setVisible] = useState(() => !window.localStorage.getItem(STORAGE_KEY));
  const save = (analytics: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ necessary: true, analytics, updatedAt: new Date().toISOString() }));
    setVisible(false);
  };
  if (!visible) return null;
  return <aside className="cookie-consent" aria-label="Çerez tercihi"><strong>Çerez tercihin</strong><p>Temel çerezler mağazanın çalışması için kullanılır. Analitik veya pazarlama çerezleri, açık onayın olmadan etkinleştirilmez.</p><div><button type="button" className="button button--ghost" onClick={() => save(false)}>Yalnızca gerekli</button><button type="button" className="button button--ink" onClick={() => save(true)}>Analitiğe izin ver</button></div></aside>;
}
