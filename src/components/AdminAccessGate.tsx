import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminSession, loginAdmin, requiresLiveAdminAuthentication, type AdminSession } from '../lib/adminSession';

interface Props {
  children: React.ReactNode;
}

export function AdminAccessGate({ children }: Props) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const liveHost = requiresLiveAdminAuthentication();

  useEffect(() => {
    if (!liveHost) return;
    let cancelled = false;
    getAdminSession().then((next) => { if (!cancelled) setSession(next); }).catch(() => { if (!cancelled) setSession({ authenticated: false }); });
    return () => { cancelled = true; };
  }, [liveHost]);

  if (!liveHost) return <>{children}</>;

  if (!session) return <main className="admin-access"><ShieldCheck size={34} /><h1>Yönetim erişimi doğrulanıyor</h1><p>Güvenli oturumunuz kontrol ediliyor.</p></main>;
  if (session.authenticated) return <>{children}</>;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const next = await loginAdmin(username, password);
      if (!next.authenticated) throw new Error('Bu hesap yönetim yetkisine sahip değil.');
      setSession(next);
      setPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Giriş doğrulanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="admin-access"><div className="admin-access__card"><LockKeyhole size={32} /><p className="admin-section-kicker">MAYMOON YÖNETİMİ</p><h1>Güvenli giriş</h1><p>Yalnızca WooCommerce mağaza yöneticileri bu alana erişebilir.</p><form onSubmit={submit}><label>Kullanıcı adı<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label>Şifre<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="admin-access__error" role="alert">{error}</p>}<button className="admin-action admin-action--primary" type="submit" disabled={submitting}>{submitting ? 'Doğrulanıyor…' : 'Yönetim paneline gir'}</button></form><small>Bu giriş, WordPress/WooCommerce mağaza yöneticisi hesabınızla doğrulanır.</small></div></main>;
}
