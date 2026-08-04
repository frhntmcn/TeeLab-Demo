import {
  AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowLeft, ArrowUpToLine,
  ImagePlus, Info, Minus, Plus, RotateCcw, Save, Trash2, Type, Upload, WandSparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { colorHex, colorNames, emptyDesign } from '../data/products';
import { symbols } from '../data/symbols';
import { clearDraft, createEmptyDraft, loadDraft, saveDraft } from '../lib/draftStorage';
import { calculatePrice, formatTRY } from '../lib/pricing';
import type { DesignDocument, ObjectMeasurement, OrderOptions, PreviewImages, ShirtColor, ShirtSize, Side } from '../types';
import { FabricEditor, type EditorHandle, type SelectionInfo } from './FabricEditor';
import { Mockup } from './Mockup';
import { EmailModal, SummaryModal } from './OrderModals';

const qualityLabel = { suitable: 'Baskıya uygun', warning: 'Çözünürlük uyarısı', risk: 'Kalite riski' } as const;

export function Studio({ onBack }: { onBack: () => void }) {
  const initialDraft = useRef(loadDraft());
  const editorRef = useRef<EditorHandle>(null);
  const skipNextSave = useRef(false);
  const [side, setSide] = useState<Side>(initialDraft.current.activeSide);
  const [documents, setDocuments] = useState<Record<Side, DesignDocument>>(initialDraft.current.documents);
  const [measurements, setMeasurements] = useState<Record<Side, ObjectMeasurement[]>>({ front: [], back: [] });
  const [previews, setPreviews] = useState<PreviewImages>(initialDraft.current.previews ?? { front: '', back: '' });
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [options, setOptions] = useState<OrderOptions>(initialDraft.current.options);
  const [notice, setNotice] = useState('');
  const [saveStatus, setSaveStatus] = useState('Taslak tarayıcıda saklanır');
  const [draftRevision, setDraftRevision] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const allMeasurements = [...measurements.front, ...measurements.back];
  const price = calculatePrice(options.quantity, measurements.front.length > 0, measurements.back.length > 0);
  const orderId = useMemo(() => `TL-${String(Math.floor(1000 + Math.random() * 9000))}`, []);

  useEffect(() => {
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSaveStatus('Kaydediliyor…');
    const timer = window.setTimeout(() => {
      const saved = saveDraft({ schemaVersion: 1, documents, options, activeSide: side, previews, updatedAt: new Date().toISOString() });
      setSaveStatus(saved ? 'Taslak tarayıcıya kaydedildi' : 'Yerel kayıt kullanılamıyor');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [documents, options, previews, side]);

  const updateSide = (document: DesignDocument, items: ObjectMeasurement[], preview: string) => {
    setDocuments((current) => ({ ...current, [side]: document }));
    setMeasurements((current) => ({ ...current, [side]: items }));
    setPreviews((current) => ({ ...current, [side]: preview }));
  };

  const chooseSide = (next: Side) => { setSelection(null); setSide(next); };

  const upload = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) { setNotice('Yalnızca PNG, JPG/JPEG veya SVG yükleyebilirsin.'); return; }
    if (file.size > 8 * 1024 * 1024) { setNotice('Demo için görsel boyutu en fazla 8 MB olmalı.'); return; }
    try {
      const result = await editorRef.current?.addImage(file);
      setNotice(result?.message ?? 'Görsel eklendi.');
    } catch {
      setNotice('Görsel okunamadı. Dosyayı kontrol edip tekrar dene.');
    }
  };

  const resetDraft = () => {
    if (!window.confirm('Bu tarayıcıdaki ön ve arka yüz taslağını kalıcı olarak temizlemek istiyor musun?')) return;
    skipNextSave.current = true;
    clearDraft();
    const empty = createEmptyDraft();
    setDocuments({ front: emptyDesign(), back: emptyDesign() });
    setMeasurements({ front: [], back: [] });
    setPreviews({ front: '', back: '' });
    setOptions(empty.options);
    setSide('front');
    setSelection(null);
    setNotice('Yerel demo taslağı temizlendi.');
    setSaveStatus('Taslak temizlendi');
    setDraftRevision((value) => value + 1);
  };

  return (
    <main className="studio-page">
      <div className="studio-topbar">
        <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Mağazaya dön</button>
        <div><b>TeeLab Stüdyo</b><span><Save size={11} /> {saveStatus} · tarayıcı içi demo</span></div>
        <div className="studio-topbar-actions">
          <button className="clear-draft-button" onClick={resetDraft}>Taslağı temizle</button>
          <button className="button button--primary" onClick={() => setShowSummary(true)}>Tasarımı Tamamla</button>
        </div>
      </div>

      <div className="studio-layout">
        <aside className="tools-panel">
          <div className="panel-title"><span>01</span><div><b>Araçlar</b><small>Tasarımını oluştur</small></div></div>
          <section className="tool-section">
            <h3><Type size={17} /> Metin</h3>
            <button className="tool-action" onClick={() => editorRef.current?.addText()}><Plus size={17} /> Örnek metin ekle</button>
            {selection?.kind === 'text' && (
              <div className="text-controls">
                <label>Metin<textarea value={selection.text ?? ''} onChange={(event) => editorRef.current?.updateSelected({ text: event.target.value })} /></label>
                <div className="two-cols">
                  <label>Yazı tipi<select value={selection.fontFamily} onChange={(event) => editorRef.current?.updateSelected({ fontFamily: event.target.value })}><option value="Arial">Sans-serif</option><option value="Georgia">Serif</option><option value="Courier New">Monospace</option><option value="Impact">Display</option></select></label>
                  <label>Punto<input type="number" min="12" max="120" value={selection.fontSize ?? 34} onChange={(event) => editorRef.current?.updateSelected({ fontSize: Number(event.target.value) })} /></label>
                </div>
                <div className="inline-controls">
                  <label>Renk<input type="color" value={selection.fill ?? '#0f172a'} onChange={(event) => editorRef.current?.updateSelected({ fill: event.target.value })} /></label>
                  <button className={selection.fontWeight === 700 ? 'is-active' : ''} onClick={() => editorRef.current?.updateSelected({ fontWeight: selection.fontWeight === 700 ? 400 : 700 })} aria-label="Kalın yazı">B</button>
                  <button onClick={() => editorRef.current?.updateSelected({ textAlign: 'left' })} aria-label="Sola hizala"><AlignLeft /></button>
                  <button onClick={() => editorRef.current?.updateSelected({ textAlign: 'center' })} aria-label="Ortala"><AlignCenter /></button>
                  <button onClick={() => editorRef.current?.updateSelected({ textAlign: 'right' })} aria-label="Sağa hizala"><AlignRight /></button>
                </div>
              </div>
            )}
          </section>

          <section className="tool-section"><h3><WandSparkles size={17} /> Hazır semboller</h3><div className="symbol-grid">{symbols.map((symbol) => {
            const isActive = measurements[side].some((item) => item.kind === 'symbol' && item.label === symbol.name);
            return <button key={symbol.name} className={isActive ? 'is-active' : ''} aria-pressed={isActive} onClick={() => editorRef.current?.toggleSymbol(symbol.svg, symbol.name)} title={isActive ? `${symbol.name} sembolünü kaldır` : `${symbol.name} sembolünü ekle`}><b>{symbol.icon}</b><small>{symbol.name}</small></button>;
          })}</div></section>
          <section className="tool-section"><h3><ImagePlus size={17} /> Kendi görselin</h3><label className="upload-zone"><Upload /><b>Görsel yükle</b><span>PNG, JPG veya SVG · maks. 8 MB</span><input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" onChange={(event) => upload(event.target.files?.[0])} /></label>{notice && <div className="quality-note"><Info size={15} /> {notice}</div>}</section>
          <section className="tool-section object-tools"><h3>Nesne düzenleme</h3><div><button disabled={!selection} onClick={() => editorRef.current?.bringForward()}><ArrowUpToLine /> Öne al</button><button disabled={!selection} onClick={() => editorRef.current?.sendBackward()}><ArrowDownToLine /> Arkaya al</button><button disabled={!selection} onClick={() => editorRef.current?.removeSelected()} className="danger"><Trash2 /> Sil</button></div></section>
        </aside>

        <section className="canvas-workspace">
          <div className="side-tabs" role="tablist" aria-label="Tişört yüzü"><button className={side === 'front' ? 'is-active' : ''} onClick={() => chooseSide('front')}>Ön yüz <span>{measurements.front.length}</span></button><button className={side === 'back' ? 'is-active' : ''} onClick={() => chooseSide('back')}>Arka yüz <span>{measurements.back.length}</span></button></div>
          <div className="editor-stage">
            <Mockup
              color={options.color}
              side={side}
              showGuide
              className="editor-realistic-mockup"
              editor={<FabricEditor key={`${side}-${draftRevision}`} ref={editorRef} side={side} document={documents[side]} onChange={updateSide} onSelection={setSelection} />}
            />
          </div>
          <div className="canvas-hint"><RotateCcw size={15} /> Nesneyi seç; köşelerden ölçekle, üst noktadan döndür. Tasarımlar 30 × 40 cm baskı alanı içinde tutulur.</div>
        </section>

        <aside className="options-panel">
          <div className="panel-title"><span>02</span><div><b>Ürün & Sipariş</b><small>Seçenekleri belirle</small></div></div>
          <section className="option-section"><h3>Tişört rengi <b>{colorNames[options.color]}</b></h3><div className="shirt-colors">{(['white', 'black', 'beige', 'purple'] as ShirtColor[]).map((color) => <button key={color} className={options.color === color ? 'is-active' : ''} onClick={() => setOptions({ ...options, color })}><i style={{ background: colorHex[color] }} />{colorNames[color]}</button>)}</div></section>
          <section className="option-section"><h3>Beden</h3><div className="sizes">{(['S', 'M', 'L', 'XL'] as ShirtSize[]).map((size) => <button key={size} className={options.size === size ? 'is-active' : ''} onClick={() => setOptions({ ...options, size })}>{size}</button>)}</div></section>
          <section className="option-section"><h3>Adet</h3><div className="stepper"><button onClick={() => setOptions({ ...options, quantity: Math.max(1, options.quantity - 1) })} aria-label="Adedi azalt"><Minus /></button><input aria-label="Adet" type="number" min="1" max="50" value={options.quantity} onChange={(event) => setOptions({ ...options, quantity: Math.min(50, Math.max(1, Number(event.target.value))) })} /><button onClick={() => setOptions({ ...options, quantity: Math.min(50, options.quantity + 1) })} aria-label="Adedi artır"><Plus /></button></div><small>5+ adette %7, 10+ adette %12 indirim</small></section>

          <section className="selection-card">
            <h3>Seçili nesne</h3>
            {selection ? (
              <>
                <b>{selection.label}</b>
                <div className="measure-grid"><span><small>Merkez X / Y</small>{selection.measurement.xCm} / {selection.measurement.yCm} cm</span><span><small>G × Y</small>{selection.measurement.widthCm} × {selection.measurement.heightCm} cm</span><span><small>Dönüş</small>{selection.measurement.angle}°</span><span><small>Tür</small>{selection.kind === 'text' ? 'Metin' : selection.kind === 'symbol' ? 'Vektör' : selection.measurement.vector ? 'SVG / vektör' : 'Raster görsel'}</span></div>
                {selection.measurement.estimatedPpi !== undefined && <div className={`ppi-badge ppi-badge--${selection.measurement.quality}`}><b>{selection.measurement.estimatedPpi} PPI</b><span>{qualityLabel[selection.measurement.quality!]}</span></div>}
                <small className="coordinate-note">X/Y, baskı alanının sol üstünden nesne merkezine ölçülür.</small>
              </>
            ) : <p>Ölçü, merkez konumu ve raster kalitesini görmek için baskı alanından bir nesne seç.</p>}
          </section>

          <section className="price-card"><div className="price-title"><span>Fiyat simülasyonu</span><b>{formatTRY(price.total)}</b></div><dl><div><dt>Temel tişört</dt><dd>{formatTRY(price.baseUnit)} × {options.quantity}</dd></div><div><dt>Ön baskı</dt><dd>{measurements.front.length ? `${formatTRY(price.frontUnit)} × ${options.quantity}` : '—'}</dd></div><div><dt>Arka baskı</dt><dd>{measurements.back.length ? `${formatTRY(price.backUnit)} × ${options.quantity}` : '—'}</dd></div>{price.discount > 0 && <div className="discount"><dt>Adet indirimi</dt><dd>−{formatTRY(price.discount)}</dd></div>}</dl><small>Demo tahminidir; gerçek üretim teklifi değildir.</small><button className="button button--primary button--wide" onClick={() => setShowSummary(true)}>Tasarımı Tamamla</button></section>
        </aside>
      </div>

      {showSummary && !showEmail && <SummaryModal options={options} price={price} previews={previews} measurements={allMeasurements} orderId={orderId} onClose={() => setShowSummary(false)} onEmail={() => setShowEmail(true)} />}
      {showEmail && <EmailModal options={options} price={price} previews={previews} measurements={allMeasurements} orderId={orderId} onClose={() => { setShowEmail(false); setShowSummary(false); }} />}
    </main>
  );
}
