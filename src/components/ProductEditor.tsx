import { Check, ImagePlus, Plus, Shirt, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { NewManagedProduct, ProductVariant } from '../lib/storefrontManagement';
import type { ShirtSize } from '../types';

const sizes: ShirtSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
const colors = [
  ['Kırmızı', '#dc2626'], ['Kiremit', '#b45309'], ['Mavi', '#2563eb'], ['Mor', '#7c3aed'], ['Sarı', '#eab308'], ['Siyah', '#111827'], ['Beyaz', '#f8fafc'], ['Bej', '#d7c6ad'], ['Bordo', '#800000'], ['Turuncu', '#ea580c'], ['Yeşil', '#16a34a'], ['Pembe', '#db2777'], ['Gri', '#6b7280'], ['Lacivert', '#1e3a8a'], ['Kahverengi', '#92400e'], ['Turkuaz', '#0d9488'], ['Haki', '#6b7045'], ['Antrasit', '#383e42'], ['Ekru', '#f3ebd3'], ['Krem', '#fffdd0'], ['Taş', '#c4bbaf'], ['Vizon', '#a38b79'], ['Camel', '#c19a6b'], ['Taba', '#a66a42'], ['Füme', '#55565b'], ['Gümüş', '#c0c0c0'], ['Açık mavi', '#add8e6'], ['Koyu mavi', '#00008b'], ['Petrol mavisi', '#005f6b'], ['Mint', '#98d8c8'], ['Zeytin yeşili', '#808000'], ['Zümrüt yeşili', '#008a60'], ['Lila', '#c8a2c8'], ['Lavanta', '#b7a4d4'], ['Mürdüm', '#673147'], ['Pudra', '#e8c4c4'], ['Fuşya', '#d10073'], ['Somon', '#fa8072'], ['Hardal', '#d4a017'], ['Safran', '#d97706'], ['Terracotta', '#c66b4e'],
] as const;

const emptyStock = (): Record<ShirtSize, number> => ({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
const normalize = (value: string) => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');

export function ProductEditor({ categories, onAddCategory, onClose, onSave }: { categories: string[]; onAddCategory: (name: string) => string | undefined; onClose: () => void; onSave: (input: NewManagedProduct) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Tişört');
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string>();
  const [colorQuery, setColorQuery] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [activeColor, setActiveColor] = useState<string>();
  const [error, setError] = useState('');
  const matches = useMemo(() => colorQuery.trim() ? colors.filter(([color]) => normalize(color).startsWith(normalize(colorQuery))).slice(0, 7) : [], [colorQuery]);
  const activeVariant = variants.find((variant) => variant.color === activeColor);

  const selectColor = (color: string, hex: string) => {
    setVariants((current) => current.some((variant) => variant.color === color) ? current : [...current, { color, hex, sizeStocks: emptyStock() }]);
    setActiveColor(color); setColorQuery('');
  };
  const updateStock = (size: ShirtSize, value: string) => setVariants((current) => current.map((variant) => variant.color !== activeColor ? variant : { ...variant, sizeStocks: { ...variant.sizeStocks, [size]: Math.max(0, Math.min(999, Number.parseInt(value, 10) || 0)) } }));
  const removeColor = (color: string) => { setVariants((current) => current.filter((variant) => variant.color !== color)); setActiveColor((current) => current === color ? undefined : current); };
  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Lütfen PNG, JPG veya WebP biçiminde bir görsel seçin.'); return; }
    const reader = new FileReader(); reader.onload = () => { setImageDataUrl(String(reader.result)); setError(''); }; reader.readAsDataURL(file);
  };
  const save = (visible: boolean) => {
    if (!name.trim() || !description.trim() || !price || !category || !variants.length) { setError('Ürün adı, açıklama, fiyat, kategori ve en az bir renk gerekli.'); return; }
    if (visible && !imageDataUrl) { setError('Mağazada yayınlamak için ana ürün görseli yükleyin.'); return; }
    onSave({ name, description, price: Number(price), category, imageDataUrl, variants, visible });
  };

  return <section className="admin-product-editor" aria-labelledby="editor-title">
    <header className="admin-editor-heading"><div><p className="admin-section-kicker">ÜRÜNLER / YENİ ÜRÜN</p><h2 id="editor-title">Yeni ürün ekle</h2><p>Bilgileri sırayla girin. Taslak kaydedebilir veya hazır olduğunda mağazada yayınlayabilirsiniz.</p></div><button type="button" className="admin-action" onClick={onClose}><X size={18} /> Geri dön</button></header>
    {error && <p className="admin-editor-error" role="alert">{error}</p>}
    <div className="admin-editor-layout"><div className="admin-editor-fields">
      <section><h3>Temel bilgiler</h3><label>Ürün adı<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Gece Yörüngesi" /></label><label>Kısa açıklama<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ürünü kısa ve anlaşılır biçimde anlatın." /></label><label>Kategori<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>{showCategoryInput ? <div className="admin-category-create"><input autoFocus value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Yeni kategori adı" /><button type="button" className="admin-action admin-action--primary" onClick={() => { const added = onAddCategory(newCategory); if (added) { setCategory(added); setNewCategory(''); setShowCategoryInput(false); } }}>Kaydet</button><button type="button" className="admin-action" onClick={() => setShowCategoryInput(false)}>İptal</button></div> : <button type="button" className="admin-text-action" onClick={() => setShowCategoryInput(true)}><Plus size={17} /> Yeni kategori ekle</button>}</section>
      <section><h3>Tasarım görseli</h3><input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} /><button type="button" className="admin-image-upload" onClick={() => inputRef.current?.click()}>{imageDataUrl ? <img src={imageDataUrl} alt="Yüklenen ürün önizlemesi" /> : <><ImagePlus size={34} /><strong>Ana görseli yükle</strong><span>PNG, JPG veya WebP</span></>}</button><p>Mağazada yayınlamak için ana ürün görseli zorunludur.</p></section>
      <section><h3>Fiyat ve stok</h3><label>Fiyat (₺)<input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Örn: 649" /></label></section>
      <section><h3>Renk ve beden stokları</h3><label>Renk adı<div className="admin-color-combobox"><input value={colorQuery} onChange={(event) => setColorQuery(event.target.value)} placeholder="Renk yazın: hak, ant, mav…" autoComplete="off" />{matches.length > 0 && <ul role="listbox">{matches.map(([color, hex]) => <li key={color}><button type="button" onClick={() => selectColor(color, hex)}><i style={{ backgroundColor: hex }} />{color}</button></li>)}</ul>}</div></label>{variants.length ? <div className="admin-variant-tabs">{variants.map((variant) => <button type="button" key={variant.color} className={activeColor === variant.color ? 'active' : ''} onClick={() => setActiveColor(variant.color)}><i style={{ backgroundColor: variant.hex }} />{variant.color}</button>)}</div> : <p className="admin-form-note">Beden stoklarını girmek için önce bir renk seçin.</p>}{activeVariant && <div className="admin-size-stock"><div className="admin-size-stock-heading"><strong><i style={{ backgroundColor: activeVariant.hex }} />{activeVariant.color} için beden stokları</strong><button type="button" onClick={() => removeColor(activeVariant.color)}><Trash2 size={16} /> Rengi kaldır</button></div>{sizes.map((size) => { const stock = activeVariant.sizeStocks[size]; return <label key={size}><b>{size}</b><input type="number" min="0" max="999" value={stock} onChange={(event) => updateStock(size, event.target.value)} /><span>{stock ? `${stock} adet hazır` : 'Tükendi'}</span></label>; })}</div>}</section>
    </div><aside className="admin-editor-preview"><div className="admin-preview-card"><p>CANLI ÖNİZLEME</p><div className="admin-preview-image">{imageDataUrl ? <img src={imageDataUrl} alt="Ürün önizlemesi" /> : <Shirt size={58} />}</div><h3>{name || 'Yeni ürün'}</h3><span>{price ? `${Number(price).toLocaleString('tr-TR')} ₺` : 'Fiyat girilmedi'}</span><small>{category}</small></div><div className="admin-editor-actions"><button type="button" className="admin-action" onClick={() => save(false)}>Taslak kaydet</button><button type="button" className="admin-action admin-action--primary" onClick={() => save(true)}><Check size={18} /> Mağazada yayınla</button></div></aside></div>
  </section>;
}
