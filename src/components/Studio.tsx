import {
  AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpToLine,
  Copy, Eye, EyeOff, ImagePlus, Info, Layers, Lock, Minus, Palette, Plus, Redo2, RotateCcw, Save, Shirt, Trash2, Type, Undo2, Unlock, Upload, WandSparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { brand } from '../config/brand';
import { colorHex, colorNames, emptyDesign } from '../data/products';
import { cloneTemplateDocument, designTemplates } from '../data/designTemplates';
import { symbols } from '../data/symbols';
import { studioShapes } from '../data/studioShapes';
import { studioFonts } from '../data/studioFonts';
import { clearDraft, createEmptyDraft, loadDraft, saveDraft } from '../lib/draftStorage';
import { calculatePrice, formatTRY } from '../lib/pricing';
import { designHash } from '../lib/designIdentity';
import { createProductionSnapshot } from '../lib/productionSnapshot';
import { sideHasDesignContent } from '../lib/templateApplication';
import { uploadIssueMessage, validateUploadFile } from '../lib/imageValidation';
import { canContinue, hasOverflow } from '../lib/qualityGate';
import { AVAILABLE_SHIRT_SIZES, MAX_ORDER_QUANTITY, setSizeQuantity, sizeEntries } from '../lib/orderOptions';
import { measureDocument } from '../lib/measureDocument';
import { getSavedStudioDesign, saveStudioDesign } from '../lib/customerDesigns';
import { getCustomerSession, requiresLiveCustomerAccount, type CustomerSession } from '../lib/customerSession';
import type { CartItem, DesignDocument, DesignTemplate, ObjectMeasurement, OrderOptions, PreviewImages, ShirtColor, ShirtFit, Side, TemplateMetadata } from '../types';
import { FabricEditor, type EditorHandle, type LayerInfo, type SelectionInfo } from './FabricEditor';
import { Mockup } from './Mockup';
import { SummaryModal } from './OrderModals';

type StudioStep = 'product' | 'design' | 'preview';
const steps: { id: StudioStep; label: string; icon: typeof Shirt }[] = [
  { id: 'product', label: 'Ürün', icon: Shirt }, { id: 'design', label: 'Tasarım', icon: Palette }, { id: 'preview', label: 'Önizleme', icon: Eye },
];
const qualityLabel = { suitable: 'Baskıya uygun', warning: 'Çözünürlük uyarısı', risk: 'Kalite riski' } as const;

export function Studio({ onBack, onAdd }: { onBack: () => void; onAdd: (item: CartItem) => void }) {
  const initialDraft = useRef(loadDraft());
  const [searchParams, setSearchParams] = useSearchParams();
  const editorRef = useRef<EditorHandle>(null);
  const toolsRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const skipNextSave = useRef(false);
  const [step, setStep] = useState<StudioStep>('product');
  const [side, setSide] = useState<Side>(initialDraft.current.activeSide);
  const [documents, setDocuments] = useState<Record<Side, DesignDocument>>(initialDraft.current.documents);
  const [measurements, setMeasurements] = useState<Record<Side, ObjectMeasurement[]>>({ front: [], back: [] });
  const [measurementsReady, setMeasurementsReady] = useState(false);
  const [previews, setPreviews] = useState<PreviewImages>(initialDraft.current.previews ?? { front: '', back: '' });
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [shapeQuery, setShapeQuery] = useState('');
  const [fontQuery, setFontQuery] = useState('');
  const [drawMode, setDrawMode] = useState(false);
  const [brushWidth, setBrushWidth] = useState(5);
  const [brushColor, setBrushColor] = useState('#111827');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [options, setOptions] = useState<OrderOptions>(initialDraft.current.options);
  const [notice, setNotice] = useState('');
  const [cartAdded, setCartAdded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Taslak tarayıcıda saklanır');
  const [draftRevision, setDraftRevision] = useState(0);
  const documentsRef = useRef(documents);
  const [showSummary, setShowSummary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [templateMetadata, setTemplateMetadata] = useState<Record<Side, TemplateMetadata | undefined>>(() => ({
    front: initialDraft.current.templateMetadata?.front ?? (initialDraft.current.templateSide === 'front' || (!initialDraft.current.templateSide && initialDraft.current.activeSide === 'front') ? initialDraft.current.templateId ? { id: initialDraft.current.templateId, name: designTemplates.find((template) => template.id === initialDraft.current.templateId)?.name ?? initialDraft.current.templateId } : undefined : undefined),
    back: initialDraft.current.templateMetadata?.back ?? (initialDraft.current.templateSide === 'back' || (!initialDraft.current.templateSide && initialDraft.current.activeSide === 'back') ? initialDraft.current.templateId ? { id: initialDraft.current.templateId, name: designTemplates.find((template) => template.id === initialDraft.current.templateId)?.name ?? initialDraft.current.templateId } : undefined : undefined),
  }));
  const [templateConfirmation, setTemplateConfirmation] = useState<DesignTemplate | null>(null);
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [accountDesignName, setAccountDesignName] = useState('Yeni tasarım');
  const [accountSaveBusy, setAccountSaveBusy] = useState(false);
  const [accountSaveNotice, setAccountSaveNotice] = useState('');
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const allMeasurements = [...measurements.front, ...measurements.back];
  const hasOverflowDesign = hasOverflow(allMeasurements);
  const canContinueDesign = canContinue(allMeasurements);
  const unitPrice = calculatePrice(1, measurements.front.length > 0, measurements.back.length > 0);
  const price = options.quantity > 0 ? calculatePrice(options.quantity, measurements.front.length > 0, measurements.back.length > 0) : { ...unitPrice, subtotal: 0, discount: 0, total: 0 };
  const selectedSizes = sizeEntries(options);
  const orderId = useMemo(() => `TL-${String(Math.floor(1000 + Math.random() * 9000))}`, []);
  const liveCustomerHost = requiresLiveCustomerAccount();

  useEffect(() => {
    if (step !== 'design') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.matches('input,textarea,select') || target.isContentEditable)) return;
      const editor = editorRef.current;
      if (!editor) return;
      const command = event.ctrlKey || event.metaKey;
      if (command && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) editor.redo(); else editor.undo(); }
      else if (command && event.key.toLowerCase() === 'd') { event.preventDefault(); void editor.duplicateSelected(); }
      else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); editor.removeSelected(); }
      else if (event.key === 'Escape') { editor.clearSelection(); editor.setDrawingMode(false, brushWidth, brushColor); setDrawMode(false); }
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); const delta = event.shiftKey ? 10 : 1;
        editor.nudgeSelected(event.key === 'ArrowLeft' ? -delta : event.key === 'ArrowRight' ? delta : 0, event.key === 'ArrowUp' ? -delta : event.key === 'ArrowDown' ? delta : 0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, brushWidth, brushColor]);

  useEffect(() => {
    if (!liveCustomerHost) { setCustomerSession({ authenticated: false }); return; }
    let cancelled = false;
    getCustomerSession().then((session) => { if (!cancelled) setCustomerSession(session); }).catch(() => { if (!cancelled) setCustomerSession({ authenticated: false }); });
    return () => { cancelled = true; };
  }, [liveCustomerHost]);

  useEffect(() => {
    const designId = searchParams.get('design');
    if (!designId || !liveCustomerHost) return;
    let cancelled = false;
    getSavedStudioDesign(designId).then(({ name, design }) => {
      if (cancelled) return;
      setDocuments(design.documents);
      setOptions(design.options);
      setPreviews(design.previews);
      setTemplateMetadata({ front: design.templateMetadata?.front, back: design.templateMetadata?.back });
      setAccountDesignName(name);
      setSide('front'); setStep('design'); setDraftRevision((revision) => revision + 1);
      setNotice(`“${name}” tasarımı hesabından açıldı.`);
      setSearchParams({}, { replace: true });
    }).catch((reason: unknown) => { if (!cancelled) setNotice(reason instanceof Error ? reason.message : 'Kayıtlı tasarım açılamadı.'); });
    return () => { cancelled = true; };
  }, [liveCustomerHost, searchParams, setSearchParams]);
  const addCustomDesignToCart = () => {
    const hash = designHash(documents, options.fit);
    try {
      const designGroupId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const productionSnapshot = createProductionSnapshot(documents, measurements, templateMetadata);
      for (const entry of selectedSizes) onAdd({
        id: `custom-${designGroupId}-${entry.size}`,
        designHash: hash,
        designGroupId,
        productId: 'custom-design',
        name: 'Kendin Tasarla',
        color: options.color,
        size: entry.size,
        fit: options.fit,
        quantity: entry.quantity,
        unitPrice: price.baseUnit + price.frontUnit + price.backUnit,
        printSides: { front: measurements.front.length > 0, back: measurements.back.length > 0 },
        artwork: 'typography',
        designPreview: previews.front || previews.back || undefined,
        isCustom: true,
        productionSnapshot,
      });
      setCartAdded(true);
    } catch { setCartAdded(false); setNotice('Tasarım sepete eklenemedi. Tekrar dene.'); }
  };

  const saveCurrentDesignToAccount = async () => {
    if (!customerSession?.authenticated) { setAccountSaveNotice('Tasarımı hesabına kaydetmek için önce giriş yap.'); return; }
    if (!measurementsReady) { setAccountSaveNotice('Tasarım ölçümleri hazırlanıyor; birkaç saniye sonra tekrar dene.'); return; }
    if (!documents.front.objects.length && !documents.back.objects.length) { setAccountSaveNotice('Önce en az bir baskı yüzü tasarla.'); return; }
    setAccountSaveBusy(true); setAccountSaveNotice('');
    try {
      const saved = await saveStudioDesign(accountDesignName.trim() || 'Maymoon tasarımı', { documents, options, previews, templateMetadata, measurements });
      setAccountSaveNotice(`“${saved.name}” tasarımı hesabına kaydedildi.`);
    } catch (reason) {
      setAccountSaveNotice(reason instanceof Error ? reason.message : 'Tasarım hesabına kaydedilemedi.');
    } finally { setAccountSaveBusy(false); }
  };

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    let cancelled = false;
    const snapshot = documentsRef.current;
    setMeasurementsReady(false);
    void Promise.all([measureDocument(snapshot.front, 'front'), measureDocument(snapshot.back, 'back')]).then(([front, back]) => {
      if (cancelled) return;
      setMeasurements((current) => ({
        front: documentsRef.current.front === snapshot.front ? front : current.front,
        back: documentsRef.current.back === snapshot.back ? back : current.back,
      }));
      setMeasurementsReady(true);
    });
    return () => { cancelled = true; };
  }, [draftRevision]);

  useEffect(() => {
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSaveStatus('Kaydediliyor…');
    const timer = window.setTimeout(() => {
      const saved = saveDraft({ schemaVersion: 2, documents, options, activeSide: side, previews, templateMetadata, updatedAt: new Date().toISOString() });
      setSaveStatus(saved ? 'Taslak kaydedildi' : 'Yerel kayıt kullanılamıyor');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [documents, options, previews, side, templateMetadata]);

  const updateSide = (document: DesignDocument, items: ObjectMeasurement[], preview: string, metadata?: TemplateMetadata) => {
    setDocuments((current) => ({ ...current, [side]: document }));
    setMeasurements((current) => ({ ...current, [side]: items }));
    setPreviews((current) => ({ ...current, [side]: preview }));
    setTemplateMetadata((current) => ({ ...current, [side]: metadata }));
  };
  const chooseSide = (next: Side) => { setDrawMode(false); setSelection(null); setLayers([]); setHistoryState({ canUndo: false, canRedo: false }); setSide(next); };
  const upload = async (file?: File) => {
    if (!file || uploading) return;
    const validation = await validateUploadFile(file);
    if (validation.issue) return setNotice(uploadIssueMessage[validation.issue]);
    setUploading(true);
    try { const result = await editorRef.current?.addImage(file); setNotice(result?.message ?? 'Görsel eklendi.'); }
    catch (error) {
      const message = error instanceof Error ? error.message : '';
      setNotice(message === 'low-ppi' ? 'Bu görsel seçili baskı ölçüsünde 200 PPI altında kalıyor. Daha yüksek çözünürlüklü bir dosya yükle veya görseli küçült.' : message === 'dimensions' ? uploadIssueMessage.dimensions : validation.format === 'heic' ? 'HEIC görselin hazırlanamadı. Lütfen PNG veya JPG olarak tekrar yükle.' : 'Görsel okunamadı. Dosyayı kontrol edip tekrar dene.');
    }
    finally { setUploading(false); }
  };
  const replaceImage = async (file?: File) => {
    if (!file || uploading) return;
    const validation = await validateUploadFile(file);
    if (validation.issue) return setNotice(uploadIssueMessage[validation.issue]);
    setUploading(true);
    try { await editorRef.current?.replaceSelectedImage(file); setNotice('Görsel yerinde değiştirildi; baskı kalitesini tekrar kontrol et.'); }
    catch (error) { setNotice(error instanceof Error && error.message === 'low-ppi' ? 'Yeni görsel bu baskı boyutunda 200 PPI altında kalıyor; önceki görsel korundu.' : 'Yeni görsel hazırlanamadı; önceki görsel korundu.'); }
    finally { setUploading(false); }
  };
  const resetDraft = () => {
    if (!window.confirm('Bu tarayıcıdaki ön ve arka yüz taslağını kalıcı olarak temizlemek istiyor musun?')) return;
    skipNextSave.current = true; clearDraft(); const empty = createEmptyDraft();
    setDocuments({ front: emptyDesign(), back: emptyDesign() }); setMeasurements({ front: [], back: [] }); setMeasurementsReady(false); setPreviews({ front: '', back: '' });
    setOptions(empty.options); setSide('front'); setSelection(null); setNotice('Yerel demo taslağı temizlendi.'); setSaveStatus('Taslak temizlendi'); setDraftRevision((value) => value + 1);
    setTemplateMetadata({ front: undefined, back: undefined }); setHistoryState({ canUndo: false, canRedo: false });
  };
  const applyTemplate = async (template: DesignTemplate) => {
    const templateDocument = cloneTemplateDocument(template);
    await editorRef.current?.replaceDocument(templateDocument, { id: template.id, name: template.name });
    setSelection(null); setNotice(`“${template.name}” yalnızca ${side === 'front' ? 'ön' : 'arka'} yüze uygulandı.`);
  };
  const requestTemplate = (templateIdToApply: string) => {
    const template = designTemplates.find((item) => item.id === templateIdToApply);
    if (!template) return;
    if (sideHasDesignContent(documents[side])) { setTemplateConfirmation(template); return; }
    void applyTemplate(template);
  };
  const continueToPreview = () => {
    if (!options.quantity) return setNotice('Devam etmek için en az bir bedenin adedini gir.');
    if (!measurementsReady) return setNotice('Ölçümler hazırlanıyor…');
    if (!canContinueDesign) return setNotice(hasOverflowDesign ? 'Tasarım baskı alanının dışına taşıyor. Devam etmek için nesneyi alanın içine al.' : 'Tasarımda 200 PPI altında bir görsel var. Önizlemeye geçmeden önce görseli küçült veya daha yüksek çözünürlüklü dosya yükle.');
    setNotice('');
    setStep('preview');
  };
  const chooseStep = (next: StudioStep) => {
    if (next === 'preview') return continueToPreview();
    setStep(next);
  };
  const addToCartWithQualityCheck = () => {
    setCartAdded(false);
    setNotice('');
    if (!options.quantity) return setNotice('Sepete eklemek için en az bir bedenin adedini gir.');
    if (!measurementsReady) return setNotice('Ölçümler hazırlanıyor…');
    if (!canContinueDesign) return setNotice(hasOverflowDesign ? 'Tasarım baskı alanının dışına taşıyor. Devam etmek için nesneyi alanın içine al.' : 'Tasarımda 200 PPI altında bir görsel var. Sepete eklemeden önce görseli küçült veya daha yüksek çözünürlüklü dosya yükle.');
    addCustomDesignToCart();
  };

  return (
    <main className="studio-page studio-page--steps">
      <header className="studio-topbar studio-topbar--quiet">
        <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Mağazaya dön</button>
        <div><b>{brand.name} Stüdyo</b><span><Save size={11} /> {saveStatus}</span></div>
      </header>
      <nav className="studio-progress" aria-label="Tasarım adımları">
        {steps.map((item, index) => { const Icon = item.icon; return <button key={item.id} className={step === item.id ? 'is-active' : ''} onClick={() => chooseStep(item.id)} aria-current={step === item.id ? 'step' : undefined}><span>0{index + 1}</span><Icon /> <b>{item.label}</b></button>; })}
      </nav>

      {step === 'product' && <section className="studio-step product-step">
        <div className="step-copy"><span className="editorial-index">01 / ÜRÜN</span><h1>Tuvalini seç.</h1><p>Renk ve her bedenin adedini belirle. Tek tasarımı birden fazla bedende sipariş edebilirsin; ön ve arka yüz aynı 30 × 40 cm üretim alanını kullanır.</p>
          <div className="product-step-controls">
            <fieldset><legend>Kesim</legend><div className="sizes">{(['slim','oversize'] as ShirtFit[]).map((fit) => <button key={fit} className={options.fit === fit ? 'is-active' : ''} onClick={() => setOptions({ ...options, fit })}>{fit === 'slim' ? 'Slim fit' : 'Oversize'}</button>)}</div></fieldset>
            <fieldset><legend>Tişört rengi — <b>{colorNames[options.color]}</b></legend><div className="shirt-colors">{(['white','black'] as ShirtColor[]).map((color) => <button key={color} className={options.color === color ? 'is-active' : ''} onClick={() => setOptions({ ...options, color })}><i style={{ background: colorHex[color] }} />{colorNames[color]}</button>)}</div></fieldset>
            <fieldset className="studio-size-matrix"><legend>Bedenlere göre adet</legend><p>İstemediğin bedenleri 0 bırakabilirsin. Toplam en fazla {MAX_ORDER_QUANTITY} adet.</p><div className="studio-size-matrix__rows">{AVAILABLE_SHIRT_SIZES.map((size) => <div className="studio-size-matrix__row" key={size}><strong>{size}</strong><div className="stepper"><button type="button" onClick={() => setOptions(setSizeQuantity(options, size, (options.sizeQuantities?.[size] ?? (options.size === size ? options.quantity : 0)) - 1))} aria-label={`${size} adedini azalt`}><Minus /></button><input aria-label={`${size} beden adedi`} type="number" min="0" max={MAX_ORDER_QUANTITY} value={options.sizeQuantities?.[size] ?? (options.size === size ? options.quantity : 0)} onChange={(event) => setOptions(setSizeQuantity(options, size, Number(event.target.value)))} /><button type="button" onClick={() => setOptions(setSizeQuantity(options, size, (options.sizeQuantities?.[size] ?? (options.size === size ? options.quantity : 0)) + 1))} aria-label={`${size} adedini artır`}><Plus /></button></div></div>)}</div><p className="studio-size-matrix__total">Toplam: <strong>{options.quantity} adet</strong></p></fieldset>
          </div>
          <button className="button button--ink" disabled={!options.quantity} onClick={() => setStep('design')}>Tasarıma geç <ArrowRight /></button>
        </div>
        <div className="product-step-mockups"><div><Mockup color={options.color} fit={options.fit} side="front" className="product-choice-mockup" /><span>ÖN</span></div><div><Mockup color={options.color} fit={options.fit} side="back" className="product-choice-mockup" /><span>ARKA</span></div></div>
      </section>}

      {step === 'design' && <section className="studio-step design-step">
        <aside className="design-tools" ref={toolsRef}>
          <button className="studio-mobile-jump" type="button" onClick={() => canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>↑ Tuvale dön</button>
          <div className="step-panel-heading"><span>02 / TASARIM</span><h2>Fikrini yerleştir.</h2><p>Bir araç seç, sonra baskı alanında düzenle.</p></div>
          <div className="studio-live-price" aria-live="polite"><span>{options.quantity} adet · ön {measurements.front.length ? 'baskılı' : 'boş'} · arka {measurements.back.length ? 'baskılı' : 'boş'}</span><strong>{formatTRY(price.total)}</strong><small>Ürün {formatTRY(price.baseUnit)} + ön {formatTRY(price.frontUnit)} + arka {formatTRY(price.backUnit)} / adet{price.discount ? ` · ${formatTRY(price.discount)} indirim` : ''}. Demo tahminidir.</small></div>
          <details className="tool-section"><summary className="tool-section__summary"><WandSparkles /> Tasarım şablonları</summary><div className="template-grid">{designTemplates.map((template) => <button key={template.id} className={templateMetadata[side]?.id === template.id ? 'is-active' : ''} aria-pressed={templateMetadata[side]?.id === template.id} onClick={() => requestTemplate(template.id)}><b>{template.name}</b><small>{template.description}</small></button>)}</div></details>
          <details className="tool-section"><summary className="tool-section__summary"><Type /> Metin</summary><button className="tool-action" onClick={() => editorRef.current?.addText()}><Plus /> Metin ekle</button>
            {selection?.kind === 'text' && <div className="text-controls"><label>Metin<textarea value={selection.text ?? ''} onChange={(event) => editorRef.current?.updateSelected({ text: event.target.value })} /></label><label>Yazı tipi ara<input type="search" value={fontQuery} onChange={(event) => setFontQuery(event.target.value)} placeholder="Montserrat, Anton…" /></label><div className="two-cols"><label>Yazı tipi<select value={selection.fontFamily} onChange={(event) => editorRef.current?.updateSelected({ fontFamily: event.target.value })}>{studioFonts.filter((font) => font.label.toLocaleLowerCase('tr-TR').includes(fontQuery.toLocaleLowerCase('tr-TR')) || font.family === selection.fontFamily).map((font) => <option key={font.family} value={font.family}>{font.label}</option>)}</select></label><label>Punto<input type="number" min="12" max="120" value={selection.fontSize ?? 34} onChange={(event) => editorRef.current?.updateSelected({ fontSize: Number(event.target.value) })} /></label></div><div className="inline-controls"><label>Renk<input type="color" value={selection.fill ?? '#0f172a'} onChange={(event) => editorRef.current?.updateSelected({ fill: event.target.value })} /></label><button className={selection.fontWeight === 700 ? 'is-active' : ''} onClick={() => editorRef.current?.updateSelected({ fontWeight: selection.fontWeight === 700 ? 400 : 700 })} aria-label="Kalın yazı">B</button><button onClick={() => editorRef.current?.updateSelected({ textAlign:'left' })} aria-label="Sola hizala"><AlignLeft /></button><button onClick={() => editorRef.current?.updateSelected({ textAlign:'center' })} aria-label="Ortala"><AlignCenter /></button><button onClick={() => editorRef.current?.updateSelected({ textAlign:'right' })} aria-label="Sağa hizala"><AlignRight /></button></div><div className="two-cols"><label>Harf aralığı<input type="number" min="-100" max="1000" value={selection.charSpacing ?? 0} onChange={(event) => editorRef.current?.updateSelected({ charSpacing: Number(event.target.value) })} /></label><label>Satır yüksekliği<input type="number" min="0.7" max="3" step="0.1" value={selection.lineHeight ?? 1.16} onChange={(event) => editorRef.current?.updateSelected({ lineHeight: Number(event.target.value) })} /></label></div><label>Metin kavisi · {selection.textCurve ?? 0}<input type="range" min="-100" max="100" value={selection.textCurve ?? 0} onChange={(event) => editorRef.current?.setTextCurve(Number(event.target.value))} /></label></div>}
          </details>
          <details className="tool-section"><summary className="tool-section__summary"><WandSparkles /> Hazır semboller</summary><div className="symbol-grid">{symbols.map((symbol) => { const active = measurements[side].some((item) => item.kind === 'symbol' && item.label === symbol.name); return <button key={symbol.name} className={active ? 'is-active' : ''} aria-pressed={active} onClick={() => editorRef.current?.toggleSymbol(symbol.svg, symbol.name)} title={active ? `${symbol.name} sembolünü kaldır` : `${symbol.name} sembolünü ekle`}><b>{symbol.icon}</b><small>{symbol.name}</small></button>; })}</div></details>
          <details className="tool-section studio-shapes"><summary className="tool-section__summary">Şekiller</summary><label>Şekil ara<input type="search" value={shapeQuery} onChange={(event) => setShapeQuery(event.target.value)} placeholder="Daire, yıldız, çizgi…" /></label><div className="studio-shapes__grid">{studioShapes.filter((shape) => shape.name.toLocaleLowerCase('tr-TR').includes(shapeQuery.toLocaleLowerCase('tr-TR'))).map((shape) => <button type="button" key={shape.id} onClick={() => editorRef.current?.addShape(shape.id)}>{shape.name}</button>)}</div></details>
          <details className="tool-section studio-drawing"><summary className="tool-section__summary">Serbest çizim</summary><button className={drawMode ? 'is-active' : ''} type="button" onClick={() => { const next = !drawMode; setDrawMode(next); editorRef.current?.setDrawingMode(next, brushWidth, brushColor); }}>{drawMode ? 'Çizimi bitir' : 'Çizmeye başla'}</button><label>Fırça kalınlığı · {brushWidth} px<input type="range" min="1" max="30" value={brushWidth} onChange={(event) => { const next = Number(event.target.value); setBrushWidth(next); editorRef.current?.setDrawingMode(drawMode, next, brushColor); }} /></label><label>Fırça rengi<input type="color" value={brushColor} onChange={(event) => { setBrushColor(event.target.value); editorRef.current?.setDrawingMode(drawMode, brushWidth, event.target.value); }} /></label><p>Çizim modundan Esc ile çıkabilirsin.</p></details>
          {selection && <details className="tool-section studio-object-appearance"><summary className="tool-section__summary">Görünüm</summary><div className="two-cols">{selection.kind !== 'image' && <label>Dolgu<input type="color" value={selection.fill?.startsWith('#') ? selection.fill : '#7c3aed'} onChange={(event) => editorRef.current?.updateSelected({ fill: event.target.value })} /></label>}<label>Kontur<input type="color" value={selection.stroke?.startsWith('#') ? selection.stroke : '#312e81'} onChange={(event) => editorRef.current?.updateSelected({ stroke: event.target.value })} /></label><label>Kontur kalınlığı<input type="number" min="0" max="20" value={selection.strokeWidth ?? 0} onChange={(event) => editorRef.current?.updateSelected({ strokeWidth: Math.max(0, Math.min(20, Number(event.target.value))) })} /></label><label>Şeffaflık<input type="range" min="0" max="100" value={Math.round((selection.opacity ?? 1) * 100)} onChange={(event) => editorRef.current?.updateSelected({ opacity: Number(event.target.value) / 100 })} /> %{Math.round((selection.opacity ?? 1) * 100)}</label></div></details>}
          <details className="tool-section"><summary className="tool-section__summary"><ImagePlus /> Kendi görselin</summary><label className="upload-zone"><Upload /><b>{uploading ? 'HEIC görselin hazırlanıyor…' : 'Görsel yükle'}</b><span>PNG, JPG, WebP veya HEIC · maks. 10 MB</span><small>HEIC görseller cihazında dönüştürülür. SVG için hazır sembolleri kullan.</small><input type="file" disabled={uploading} accept=".png,.jpg,.jpeg,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={(event) => upload(event.target.files?.[0])} /></label>{notice && <div className="quality-note" role="status" aria-live="polite"><Info /> {notice}</div>}</details>
          {selection?.kind === 'image' && <details className="tool-section studio-image-tools"><summary className="tool-section__summary">Görsel düzenleme</summary><label className="studio-replace-image">Seçili görseli değiştir<input type="file" disabled={uploading} accept=".png,.jpg,.jpeg,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={(event) => void replaceImage(event.target.files?.[0])} /></label><label>Kenarları simetrik kırp · %{selection.cropPercent ?? 0}<input type="range" min="0" max="40" value={selection.cropPercent ?? 0} onChange={(event) => editorRef.current?.cropSelectedImage(Number(event.target.value))} /></label>{(['brightness', 'contrast', 'saturation'] as const).map((kind) => <label key={kind}>{kind === 'brightness' ? 'Parlaklık' : kind === 'contrast' ? 'Kontrast' : 'Doygunluk'} · {Math.round((selection.imageFilters?.[kind] ?? 0) * 100)}<input type="range" min="-100" max="100" value={Math.round((selection.imageFilters?.[kind] ?? 0) * 100)} onChange={(event) => editorRef.current?.setImageFilter(kind, Number(event.target.value) / 100)} /></label>)}<label className="studio-image-tools__check"><input type="checkbox" checked={selection.imageFilters?.grayscale ?? false} onChange={(event) => editorRef.current?.setImageFilter('grayscale', event.target.checked)} /> Siyah-beyaz</label><button type="button" onClick={() => { (['brightness', 'contrast', 'saturation'] as const).forEach((kind) => editorRef.current?.setImageFilter(kind, 0)); editorRef.current?.setImageFilter('grayscale', false); }}>Filtreleri sıfırla</button><p>Bu araçlar yüklediğin fotoğrafı düzenler; 200 PPI kalite sınırı korunur.</p></details>}
          <details className="tool-section object-tools"><summary className="tool-section__summary">Nesne düzenleme</summary><div className="object-tools__actions"><button disabled={!historyState.canUndo} onClick={() => editorRef.current?.undo()} title="Geri al"><Undo2 /> Geri al</button><button disabled={!historyState.canRedo} onClick={() => editorRef.current?.redo()} title="Yinele"><Redo2 /> Yinele</button><button disabled={!selection} onClick={() => void editorRef.current?.duplicateSelected()}><Copy /> Çoğalt</button><button disabled={!selection} onClick={() => editorRef.current?.bringForward()}><ArrowUpToLine /> Öne al</button><button disabled={!selection} onClick={() => editorRef.current?.sendBackward()}><ArrowDownToLine /> Arkaya al</button><button disabled={!selection} onClick={() => editorRef.current?.removeSelected()} className="danger"><Trash2 /> Sil</button></div><div className="object-tools__align"><button disabled={!selection} onClick={() => editorRef.current?.alignHorizontal()} title="Baskı alanında yatay ortala">Yatay ortala</button><button disabled={!selection} onClick={() => editorRef.current?.alignVertical()} title="Baskı alanında dikey ortala">Dikey ortala</button></div><details className="studio-shortcuts"><summary>Klavye kısayolları</summary><p>Ctrl/⌘+Z: geri al · Shift+Ctrl/⌘+Z: yinele · Ctrl/⌘+D: çoğalt · Delete: sil · Ok tuşları: 1 px taşı · Shift+ok: 10 px taşı · Esc: seçimi kaldır.</p></details></details>
          <details className="tool-section studio-layers"><summary className="tool-section__summary"><Layers /> Katmanlar</summary>{layers.length ? <ol>{layers.map((layer, index) => <li key={layer.id}><button type="button" className="studio-layers__name" onClick={() => editorRef.current?.selectLayer(layer.id)} disabled={!layer.visible || layer.locked}>{layer.label}</button><button type="button" onClick={() => editorRef.current?.toggleLayerVisibility(layer.id)} aria-label={`${layer.label} ${layer.visible ? 'gizle' : 'göster'}`}>{layer.visible ? <Eye /> : <EyeOff />}</button><button type="button" onClick={() => editorRef.current?.toggleLayerLock(layer.id)} aria-label={`${layer.label} ${layer.locked ? 'kilidini aç' : 'kilitle'}`}>{layer.locked ? <Lock /> : <Unlock />}</button><button type="button" disabled={index === 0} onClick={() => editorRef.current?.moveLayer(layer.id, 1)} aria-label={`${layer.label} öne taşı`}>↑</button><button type="button" disabled={index === layers.length - 1} onClick={() => editorRef.current?.moveLayer(layer.id, -1)} aria-label={`${layer.label} arkaya taşı`}>↓</button></li>)}</ol> : <p>Bu yüzde henüz nesne yok.</p>}<p>Birden fazla vektör nesneyi Shift ile seçip gruplayabilirsin. Görseller PPI kontrolünü korumak için gruplanmaz.</p><div className="object-tools__align"><button type="button" onClick={() => editorRef.current?.groupSelected()}>Grupla</button><button type="button" onClick={() => editorRef.current?.ungroupSelected()}>Grubu çöz</button></div></details>
          {liveCustomerHost && <details className="tool-section studio-account-save"><summary className="tool-section__summary"><Save /> Tasarımı kaydet</summary>{customerSession?.authenticated ? <><label>Tasarım adı<input value={accountDesignName} onChange={(event) => setAccountDesignName(event.target.value)} maxLength={80} /></label><button className="button button--ghost button--wide" type="button" disabled={accountSaveBusy} onClick={() => void saveCurrentDesignToAccount()}>{accountSaveBusy ? 'Kaydediliyor…' : 'Hesabıma kaydet'}</button></> : customerSession ? <p><Link to="/hesabim">Giriş yap</Link> ve tasarımına diğer cihazlarından ulaş.</p> : <p>Hesap kontrol ediliyor…</p>}{accountSaveNotice && <p role="status">{accountSaveNotice}</p>}</details>}
          {selection && <details className="selection-card selection-card--context"><summary>{selection.label}</summary><div className="measure-grid"><span><small>Merkez X / Y</small>{selection.measurement.xCm} / {selection.measurement.yCm} cm</span><span><small>G × Y</small>{selection.measurement.widthCm} × {selection.measurement.heightCm} cm</span><span><small>Dönüş</small>{selection.measurement.angle}°</span><span><small>Tür</small>{selection.kind === 'text' ? 'Metin' : selection.measurement.vector ? 'Vektör' : 'Raster'}</span></div><div className="studio-position-controls"><label>Merkez X (cm)<input type="number" min="0" max="30" step="0.1" value={selection.measurement.xCm} onChange={(event) => editorRef.current?.moveSelectedTo(Number(event.target.value), selection.measurement.yCm)} /></label><label>Merkez Y (cm)<input type="number" min="0" max="40" step="0.1" value={selection.measurement.yCm} onChange={(event) => editorRef.current?.moveSelectedTo(selection.measurement.xCm, Number(event.target.value))} /></label></div>{selection.measurement.estimatedPpi !== undefined && <div className={`ppi-badge ppi-badge--${selection.measurement.quality}`}><b>{selection.measurement.estimatedPpi} PPI</b><span>{qualityLabel[selection.measurement.quality!]}</span></div>}</details>}
        </aside>
        <div className="design-canvas" ref={canvasRef}>
          <button className="studio-mobile-jump" type="button" onClick={() => toolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Araçlara geç ↓</button>
          <div className="side-tabs" role="tablist" aria-label="Tişört yüzü"><button className={side === 'front' ? 'is-active' : ''} onClick={() => chooseSide('front')}>Ön yüz <span>{measurements.front.length}</span></button><button className={side === 'back' ? 'is-active' : ''} onClick={() => chooseSide('back')}>Arka yüz <span>{measurements.back.length}</span></button></div>
          <div className="studio-zoom-controls" aria-label="Tuval yakınlaştırma"><button type="button" onClick={() => setZoomPercent(Math.max(75, zoomPercent - 25))} aria-label="Uzaklaştır">−</button><input aria-label="Yakınlaştırma" type="range" min="75" max="150" step="25" value={zoomPercent} onChange={(event) => setZoomPercent(Number(event.target.value))} /><strong>%{zoomPercent}</strong><button type="button" onClick={() => setZoomPercent(Math.min(150, zoomPercent + 25))} aria-label="Yakınlaştır">+</button><button type="button" onClick={() => setZoomPercent(100)}>Tuvale sığdır</button><button className="clear-draft-button" type="button" onClick={resetDraft}><Trash2 size={15} /> Taslağı temizle</button></div>
          <div className="editor-stage"><div className="studio-zoom-frame"><div className="studio-zoom-surface" style={{ width: `${zoomPercent}%`, maxWidth: `${610 * zoomPercent / 100}px` }}><Mockup color={options.color} fit={options.fit} side={side} showGuide className="editor-realistic-mockup" editor={<FabricEditor key={`${side}-${draftRevision}`} ref={editorRef} side={side} document={documents[side]} template={templateMetadata[side]} onChange={updateSide} onSelection={setSelection} onHistoryChange={setHistoryState} onLayersChange={setLayers} />} /></div></div></div>
          <div className="canvas-hint"><RotateCcw /> Nesneyi seç; köşelerden ölçekle, üst noktadan döndür.</div>
          <div className="step-actions"><button className="button button--ghost" onClick={() => setStep('product')}><ArrowLeft /> Ürüne dön</button><button className="button button--ink" onClick={continueToPreview} aria-describedby={!canContinueDesign ? 'quality-blocker' : undefined}>Önizlemeye geç <ArrowRight /></button></div>
          {!canContinueDesign && <p className="quality-note" id="quality-blocker" role="alert"><Info /> {hasOverflowDesign ? 'Tasarım baskı alanının dışına taşıyor. Nesneyi alanın içine al.' : '200 PPI altındaki görsellerle önizlemeye ve sepete ilerleyemezsin.'}</p>}
        </div>
      </section>}

      {step === 'preview' && <section className="studio-step preview-step">
        <div className="preview-gallery"><div><span>ÖN / {measurements.front.length} NESNE</span><Mockup color={options.color} fit={options.fit} side="front" designUrl={previews.front} /></div><div><span>ARKA / {measurements.back.length} NESNE</span><Mockup color={options.color} fit={options.fit} side="back" designUrl={previews.back} /></div></div>
        <aside className="preview-summary"><span className="editorial-index">03 / ÖNİZLEME</span><h1>Son bir bakış.</h1><p>Mockup sunum içindir; üretim koordinatları 30 × 40 cm baskı state’inden ayrı hesaplanır.</p><dl><div><dt>Renk</dt><dd>{colorNames[options.color]}</dd></div><div><dt>Kesim</dt><dd>{options.fit === 'slim' ? 'Slim fit' : 'Oversize'}</dd></div><div><dt>Beden / Adet</dt><dd>{selectedSizes.map(({ size, quantity }) => `${size}: ${quantity}`).join(' · ')} ({options.quantity} adet)</dd></div><div><dt>Ön / Arka</dt><dd>{measurements.front.length} / {measurements.back.length} nesne</dd></div></dl><div className="preview-total"><span>Tahmini toplam</span><strong>{formatTRY(price.total)}</strong></div><small>Demo tahminidir; gerçek üretim teklifi değildir.</small><button className="button button--ink button--wide" onClick={addToCartWithQualityCheck}>Sepete ekle</button>{cartAdded && <div className="quality-note" role="status" aria-live="polite"><Info /> Tasarımın sepete eklendi. <a href="/sepet">Sepete git</a></div>}{notice && !cartAdded && <div className="quality-note" role="alert"><Info /> {notice}</div>}
          {liveCustomerHost && <section className="studio-account-save"><h2>Hesabına kaydet</h2>{customerSession?.authenticated ? <><label>Tasarım adı<input value={accountDesignName} onChange={(event) => setAccountDesignName(event.target.value)} maxLength={80} /></label><button className="button button--ghost button--wide" type="button" disabled={accountSaveBusy} onClick={() => void saveCurrentDesignToAccount()}><Save size={17} />{accountSaveBusy ? 'Kaydediliyor…' : 'Tasarımı hesabıma kaydet'}</button></> : customerSession ? <p><Link to="/hesabim">Hesabına giriş yap</Link> ve tasarımını cihazların arasında sakla.</p> : <p>Hesap oturumu kontrol ediliyor…</p>}{accountSaveNotice && <p role="status">{accountSaveNotice}</p>}</section>}
          <button className="button button--ghost button--wide" onClick={() => setShowSummary(true)}>Sipariş özetini aç</button><button className="button button--ghost button--wide" onClick={() => setStep('design')}>Tasarıma dön</button></aside>
      </section>}

      {showSummary && <SummaryModal options={options} price={price} previews={previews} measurements={allMeasurements} documents={documents} orderId={orderId} templateMetadata={templateMetadata} onClose={() => setShowSummary(false)} onEmail={() => {}} />}
      {templateConfirmation && <div className="template-confirmation-backdrop" role="presentation"><section className="template-confirmation" role="dialog" aria-modal="true" aria-labelledby="template-confirmation-title"><h2 id="template-confirmation-title">Mevcut tasarım değiştirilsin mi?</h2><p>“{templateConfirmation.name}” yalnızca aktif {side === 'front' ? 'ön' : 'arka'} yüzün içeriğini değiştirir. Diğer yüz korunur.</p><div><button className="button button--ghost" autoFocus onClick={() => { setTemplateConfirmation(null); setNotice('Şablon uygulanmadı; mevcut tasarımın korundu.'); }}>İptal</button><button className="button button--ink" onClick={() => { void applyTemplate(templateConfirmation); setTemplateConfirmation(null); }}>Şablonu uygula</button></div></section></div>}
    </main>
  );
}
