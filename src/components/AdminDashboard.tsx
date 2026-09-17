import {
  Bell, Box, CheckCircle2, ExternalLink, Home, ListOrdered, MessageSquare, Moon,
  PackageSearch, Palette, Plus, Printer, Search, Settings, Shirt, ShoppingBag,
  Sun, Users, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../config/brand';
import { products } from '../data/products';
import { type AdminOrder, type AdminOrderStatus, ORDER_INBOX_EVENT, readDemoOrders, updateDemoOrderStatus } from '../lib/orderInbox';
import { formatTRY } from '../lib/pricing';
import { createManagedProduct, filterManagedProducts, getManagedProductRecords, STOREFRONT_MANAGEMENT_EVENT, updateManagedProduct } from '../lib/storefrontManagement';
import { Logo } from './Logo';

type AdminSection = 'home' | 'orders' | 'products' | 'designs' | 'customers' | 'settings';
type AdminTheme = 'light' | 'dark';

const navigation: { id: AdminSection; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'orders', label: 'Siparişler', icon: ShoppingBag },
  { id: 'products', label: 'Ürünler', icon: Shirt },
  { id: 'designs', label: 'Tasarımlar', icon: Palette },
  { id: 'customers', label: 'Müşteriler', icon: Users },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

const tasks = [
  { id: 'review', title: 'Yeni siparişi kontrol et', detail: 'Yeni mağaza siparişlerini gözden geçir.', timing: 'Bekleyen sipariş olabilir', action: 'Siparişleri aç', icon: PackageSearch, tone: 'urgent' },
  { id: 'print', title: 'Baskıya gönder', detail: 'Onaylanmış tasarımları üretime hazırla.', timing: 'Bugün tamamlanması gerekiyor', action: 'Tamamlandı', icon: Printer, tone: 'info', primary: true },
  { id: 'reply', title: 'Müşteriye cevap ver', detail: 'Bekleyen müşteri sorularını kontrol et.', timing: 'Yeni mesaj', action: 'Tamamlandı', icon: MessageSquare, tone: 'success' },
];

const sampleOrders: AdminOrder[] = [
  { id: '#2048', customer: 'Mehmet K.', email: 'mehmet@ornek.com', product: 'Gece Yörüngesi', detail: 'Siyah · L beden · 1 adet', total: 649, status: 'Üretime hazır', createdAt: '2026-09-17T08:30:00.000Z' },
  { id: '#2047', customer: 'Zeynep A.', email: 'zeynep@ornek.com', product: 'Anadolu Form', detail: 'Bej · M beden · 2 adet', total: 1258, status: 'Baskıda', createdAt: '2026-09-17T07:15:00.000Z' },
  { id: '#2046', customer: 'Caner T.', email: 'caner@ornek.com', product: 'İyi Fikir', detail: 'Beyaz · XL beden · 1 adet', total: 599, status: 'Kargoya verildi', createdAt: '2026-09-16T14:10:00.000Z' },
];

const statusTone = (status: AdminOrderStatus) => status === 'Yeni sipariş' ? 'new' : status === 'Üretime hazır' ? 'ready' : status === 'Baskıda' ? 'printing' : 'shipped';

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('home');
  const [theme, setTheme] = useState<AdminTheme>(() => {
    const savedTheme = window.localStorage.getItem(`${brand.storageNamespace}:admin-theme`);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [query, setQuery] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>(() => [...readDemoOrders(), ...sampleOrders]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [managedProducts, setManagedProducts] = useState(() => getManagedProductRecords(products));
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '649' });
  const today = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date());

  useEffect(() => { window.localStorage.setItem(`${brand.storageNamespace}:admin-theme`, theme); }, [theme]);
  useEffect(() => {
    const refreshOrders = () => setOrders([...readDemoOrders(), ...sampleOrders]);
    const refreshProducts = () => setManagedProducts(getManagedProductRecords(products));
    window.addEventListener('storage', refreshOrders);
    window.addEventListener(ORDER_INBOX_EVENT, refreshOrders);
    window.addEventListener(STOREFRONT_MANAGEMENT_EVENT, refreshProducts);
    return () => {
      window.removeEventListener('storage', refreshOrders);
      window.removeEventListener(ORDER_INBOX_EVENT, refreshOrders);
      window.removeEventListener(STOREFRONT_MANAGEMENT_EVENT, refreshProducts);
    };
  }, []);

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    if (!normalized) return orders;
    return orders.filter((order) => Object.values(order).some((value) => String(value).toLocaleLowerCase('tr-TR').includes(normalized)));
  }, [orders, query]);
  const visibleManagedProducts = useMemo(() => filterManagedProducts(managedProducts, query), [managedProducts, query]);
  const pendingTasks = tasks.filter((task) => !completedTasks.includes(task.id));
  const newOrderCount = orders.filter((order) => order.status === 'Yeni sipariş').length;
  const dailySales = orders.reduce((total, order) => total + order.total, 0);

  const goTo = (section: AdminSection) => { setActiveSection(section); setQuery(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const completeTask = (id: string) => {
    if (id === 'review') { goTo('orders'); return; }
    setCompletedTasks((current) => [...current, id]);
    setNotice('İş tamamlandı olarak işaretlendi.');
  };
  const changeOrderStatus = (order: AdminOrder, status: AdminOrderStatus) => {
    if (readDemoOrders().some((item) => item.id === order.id)) updateDemoOrderStatus(order.id, status);
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status } : item));
    setSelectedOrder((current) => current ? { ...current, status } : current);
    setNotice(`${order.id} durumu “${status}” olarak güncellendi.`);
  };
  const changeProduct = (id: string, update: { visible?: boolean; stock?: number }) => {
    updateManagedProduct(id, update);
    setManagedProducts(getManagedProductRecords(products));
    setNotice('Ürün ayarı mağazaya yansıtıldı.');
  };
  const addProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productForm.name.trim() || !productForm.description.trim() || Number(productForm.price) <= 0) return;
    createManagedProduct(productForm.name, productForm.description, Number(productForm.price));
    setManagedProducts(getManagedProductRecords(products));
    setProductForm({ name: '', description: '', price: '649' });
    setProductFormOpen(false);
    setNotice('Yeni ürün oluşturuldu ve mağazada yayına alındı.');
  };

  const renderOrders = (compact = false) => (
    <section className="admin-card admin-orders" id="son-siparisler" aria-labelledby="orders-heading">
      <div className="admin-card-heading admin-orders-heading"><div><p className="admin-section-kicker">{compact ? 'SIRADA NE VAR?' : 'SİPARİŞ YÖNETİMİ'}</p><h2 id="orders-heading"><ListOrdered size={23} /> {compact ? 'Son siparişler' : 'Tüm siparişler'}</h2></div>{compact && <button type="button" onClick={() => goTo('orders')}>Tüm siparişleri gör</button>}</div>
      <div className="admin-table-wrap"><table><thead><tr><th>Sipariş</th><th>Müşteri</th><th>Ürün</th><th>Durum</th><th><span className="sr-only">İşlem</span></th></tr></thead><tbody>{visibleOrders.slice(0, compact ? 4 : undefined).map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(order.createdAt))}</small></td><td><strong>{order.customer}</strong><small>{order.email}</small></td><td><strong>{order.product}</strong><small>{order.detail}</small></td><td><span className={`admin-status admin-status--${statusTone(order.status)}`}>{order.status}</span></td><td><button className="admin-action" type="button" onClick={() => setSelectedOrder(order)}>Siparişi aç</button></td></tr>)}</tbody></table>{!visibleOrders.length && <p className="admin-empty">Aramana uygun sipariş bulunamadı. Başka bir kelime deneyebilirsin.</p>}</div>
    </section>
  );

  const renderProducts = () => (
    <section className="admin-section-page" aria-labelledby="products-title">
      <div className="admin-page-heading"><div><p className="admin-section-kicker">MAĞAZA İLE BAĞLANTILI</p><h2 id="products-title">Ürünleri yönet</h2><p>Buradaki görünürlük ve stok değişiklikleri koleksiyon sayfasına anında yansır.</p></div><button className="admin-action admin-action--primary" type="button" onClick={() => setProductFormOpen(true)}><Plus size={18} /> Yeni ürün ekle</button></div>
      <div className="admin-product-list">{visibleManagedProducts.map(({ product, visible, stock, custom }) => <article className="admin-product-row" key={product.id}><div><span className="admin-product-mark"><Shirt size={22} /></span><span><strong>{product.name}</strong><small>{custom ? 'Panelden eklendi' : 'Hazır koleksiyon'} · {formatTRY(product.price)}</small></span></div><label>Stok<input type="number" min="0" max="999" value={stock} onChange={(event) => changeProduct(product.id, { stock: Number(event.target.value) })} /></label><label className="admin-switch"><input type="checkbox" checked={visible} onChange={(event) => changeProduct(product.id, { visible: event.target.checked })} /><span aria-hidden="true" /><b>{visible ? 'Mağazada görünüyor' : 'Mağazada gizli'}</b></label><Link className="admin-action" to={`/koleksiyon/${product.id}`}>Ürünü gör <ExternalLink size={15} /></Link></article>)}</div>
      {!visibleManagedProducts.length && <p className="admin-empty admin-product-empty">Aramana uygun ürün bulunamadı. Ürün adı veya açıklamasından başka bir kelime deneyebilirsin.</p>}
    </section>
  );

  const renderHome = () => (
    <>
      <section className="admin-welcome" aria-labelledby="today-heading"><div><p className="admin-section-kicker">BUGÜN</p><h2 id="today-heading">Önce bunlarla ilgilen</h2><p>En önemli işler yukarıda. Birini tamamladığında sıradaki iş otomatik olarak öne çıkar.</p></div><Link className="admin-store-link" to="/" target="_blank">Mağazayı görüntüle <ExternalLink size={17} /></Link></section>
      <div className="admin-overview-grid"><section className="admin-card admin-tasks" aria-labelledby="tasks-heading"><div className="admin-card-heading"><h2 id="tasks-heading"><CheckCircle2 size={23} /> Yapılacaklarım</h2><span>{pendingTasks.length} önemli iş</span></div><div className="admin-task-list">{pendingTasks.length ? pendingTasks.map(({ id, title, detail, timing, action, icon: Icon, tone, primary }) => <article className="admin-task" key={id}><span className={`admin-task-icon admin-task-icon--${tone}`}><Icon size={23} /></span><div className="admin-task-copy"><h3>{title}</h3><p>{detail}</p><small className={`admin-task-time admin-task-time--${tone}`}>{timing}</small></div><button className={primary ? 'admin-action admin-action--primary' : 'admin-action'} type="button" onClick={() => completeTask(id)}>{action}</button></article>) : <div className="admin-all-done"><CheckCircle2 /><h3>Bugünkü işler tamamlandı</h3><p>Yeni bir iş oluştuğunda burada göreceksin.</p></div>}</div></section>
        <aside className="admin-summary" aria-labelledby="summary-heading"><div className="admin-card-heading"><h2 id="summary-heading">Bugünün özeti</h2></div><div className="admin-stat-grid"><article><ShoppingBag size={22} /><span>Yeni sipariş</span><strong>{newOrderCount}</strong><small>Mağazadan gelen</small></article><article><Box size={22} /><span>Hazırlanacak ürün</span><strong>{orders.filter((order) => order.status !== 'Kargoya verildi').length}</strong><small>Üretim sırasında</small></article><article><CheckCircle2 size={22} /><span>Tamamlanan iş</span><strong>{completedTasks.length}</strong><small>Bugün</small></article><article><span className="admin-currency">₺</span><span>Yaklaşık satış</span><strong>{formatTRY(dailySales)}</strong><small>Listelenen siparişler</small></article></div><div className="admin-quick-actions"><h3>Hızlı işlemler</h3><button type="button" onClick={() => { goTo('products'); setProductFormOpen(true); }}><Plus size={18} /> Yeni ürün ekle</button><button type="button" onClick={() => goTo('orders')}><ListOrdered size={18} /> Siparişleri gör</button><Link to="/" target="_blank"><ExternalLink size={18} /> Mağazayı görüntüle</Link></div></aside></div>
      {renderOrders(true)}
    </>
  );

  const renderSimpleSection = () => {
    const content = activeSection === 'designs' ? ['Tasarımlar', 'Müşterilerin stüdyoda oluşturduğu tasarımlar, WooCommerce sipariş bağlantısı kurulduğunda burada listelenecek.'] : activeSection === 'customers' ? ['Müşteriler', 'Yeni demo siparişleri geldikçe müşteri bilgileri Siparişler bölümünde görünür.'] : ['Ayarlar', 'Tema tercihin bu tarayıcıda saklanır. Ürün ve sipariş bağlantıları yerel demo verisiyle çalışır.'];
    return <section className="admin-placeholder"><span>{activeSection === 'designs' ? <Palette /> : activeSection === 'customers' ? <Users /> : <Settings />}</span><h2>{content[0]}</h2><p>{content[1]}</p>{activeSection === 'settings' && <button className="admin-action" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />} {theme === 'light' ? 'Koyu moda geç' : 'Açık moda geç'}</button>}</section>;
  };

  return (
    <div className="admin-shell" data-theme={theme}>
      <aside className="admin-sidebar" aria-label="Yönetim menüsü"><Link className="admin-brand" to="/yonetim" onClick={() => goTo('home')} aria-label={`${brand.name} yönetim ana sayfası`}><Logo inverse={theme === 'dark'} /></Link><nav className="admin-nav">{navigation.map(({ id, label, icon: Icon }) => <button className={activeSection === id ? 'active' : ''} type="button" key={id} aria-current={activeSection === id ? 'page' : undefined} onClick={() => goTo(id)}><Icon size={22} aria-hidden="true" /><span>{label}</span></button>)}</nav><div className="admin-profile"><span className="admin-avatar" aria-hidden="true">M</span><span><strong>Maymoon Ekibi</strong><small>Mağaza yöneticisi</small></span></div></aside>
      <main className="admin-main"><header className="admin-topbar"><div><p className="admin-eyebrow">{today}</p><h1>{activeSection === 'home' ? 'Günaydın.' : navigation.find((item) => item.id === activeSection)?.label}</h1><p>{activeSection === 'home' ? `Bugün ilgilenmen gereken ${pendingTasks.length} işin var.` : 'Değişiklikler bu tarayıcıda otomatik olarak saklanır.'}</p></div><div className={`admin-topbar-actions ${['designs', 'customers', 'settings'].includes(activeSection) ? 'admin-topbar-actions--without-search' : ''}`}>{!['designs', 'customers', 'settings'].includes(activeSection) && <label className="admin-search"><Search size={20} aria-hidden="true" /><span className="sr-only">{activeSection === 'products' ? 'Ürün ara' : 'Sipariş veya müşteri ara'}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeSection === 'products' ? 'Ürün adı veya açıklaması ara' : 'Sipariş, ürün veya müşteri ara'} /></label>}<button className="admin-icon-button" type="button" aria-label={theme === 'light' ? 'Koyu moda geç' : 'Açık moda geç'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={21} /> : <Sun size={21} />}</button><button className="admin-icon-button" type="button" aria-label="Bildirimleri aç" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={21} /><span aria-label={`${newOrderCount} yeni bildirim`} /></button></div>{notificationsOpen && <div className="admin-notifications" role="status"><strong>Bildirimler</strong><p>{newOrderCount ? `${newOrderCount} yeni sipariş mağazadan yönetim paneline ulaştı.` : 'Şu anda yeni bildirimin yok.'}</p><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Bildirimleri kapat"><X size={17} /></button></div>}</header>
        <div className="admin-content">{notice && <div className="admin-notice" role="status"><CheckCircle2 size={19} />{notice}<button type="button" aria-label="Bildirimi kapat" onClick={() => setNotice('')}><X size={17} /></button></div>}{activeSection === 'home' && renderHome()}{activeSection === 'orders' && renderOrders()}{activeSection === 'products' && renderProducts()}{['designs', 'customers', 'settings'].includes(activeSection) && renderSimpleSection()}</div></main>
      {selectedOrder && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setSelectedOrder(null)}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title" onMouseDown={(event) => event.stopPropagation()}><button className="admin-modal-close" type="button" onClick={() => setSelectedOrder(null)} aria-label="Siparişi kapat"><X /></button><p className="admin-section-kicker">SİPARİŞ DETAYI</p><h2 id="order-dialog-title">{selectedOrder.id}</h2><dl><div><dt>Müşteri</dt><dd>{selectedOrder.customer}</dd></div><div><dt>Ürün</dt><dd>{selectedOrder.product}</dd></div><div><dt>Toplam</dt><dd>{formatTRY(selectedOrder.total)}</dd></div></dl><label>Sipariş durumu<select value={selectedOrder.status} onChange={(event) => changeOrderStatus(selectedOrder, event.target.value as AdminOrderStatus)}>{(['Yeni sipariş', 'Üretime hazır', 'Baskıda', 'Kargoya verildi'] as AdminOrderStatus[]).map((status) => <option key={status}>{status}</option>)}</select></label><button className="admin-action admin-action--primary" type="button" onClick={() => setSelectedOrder(null)}>Kaydet ve kapat</button></section></div>}
      {productFormOpen && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setProductFormOpen(false)}><form className="admin-modal" onSubmit={addProduct} onMouseDown={(event) => event.stopPropagation()}><button className="admin-modal-close" type="button" onClick={() => setProductFormOpen(false)} aria-label="Formu kapat"><X /></button><p className="admin-section-kicker">YENİ ÜRÜN</p><h2>Mağazaya ürün ekle</h2><label>Ürün adı<input required value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} /></label><label>Kısa açıklama<textarea required rows={3} value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} /></label><label>Fiyat (₺)<input required type="number" min="1" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} /></label><p className="admin-form-note">Yeni ürün varsayılan Maymoon görseliyle ve 20 adet stokla yayınlanır.</p><button className="admin-action admin-action--primary" type="submit">Ürünü oluştur ve yayınla</button></form></div>}
    </div>
  );
}
