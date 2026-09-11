import {
  AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpToLine,
  Eye, ImagePlus, Info, Minus, Palette, Plus, Redo2, RotateCcw, Save, Shirt, Trash2, Type, Undo2, Upload, WandSparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { colorHex, colorNames, emptyDesign } from '../data/products';
import { cloneTemplateDocument, designTemplates } from '../data/designTemplates';
import { symbols } from '../data/symbols';
import { clearDraft, createEmptyDraft, loadDraft, saveDraft } from '../lib/draftStorage';
import { calculatePrice, formatTRY } from '../lib/pricing';
import { designHash } from '../lib/designIdentity';
import { sideHasDesignContent } from '../lib/templateApplication';
import { uploadIssueMessage, validateUploadFile } from '../lib/imageValidation';
import { canContinue, hasOverflow } from '../lib/qualityGate';
import type { CartItem, DesignDocument, DesignTemplate, ObjectMeasurement, OrderOptions, PreviewImages, ShirtColor, ShirtFit, ShirtSize, Side, TemplateMetadata } from '../types';
import { FabricEditor, type EditorHandle, type SelectionInfo } from './FabricEditor';
import { Mockup } from './Mockup';
import { EmailModal, SummaryModal } from './OrderModals';

type StudioStep = 'product' | 'design' | 'preview';
const steps: { id: StudioStep; label: string; icon: typeof Shirt }[] = [
  { id: 'product', label: 'Ürün', icon: Shirt }, { id: 'design', label: 'Tasarım', icon: Palette }, { id: 'preview', label: 'Önizleme', icon: Eye },
];
const qualityLabel = { suitable: 'Baskıya uygun', warning: 'Çözünürlük uyarısı', risk: 'Kalite riski' } as const;

export function Studio({ onBack, onAdd }: { onBack: () => void; onAdd: (item: CartItem) => void }) {
  const initialDraft = useRef(loadDraft());
  const editorRef = useRef<EditorHandle>(null);
  const skipNextSave = useRef(false);
  const [step, setStep] = useState<StudioStep>('product');
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
  const [uploading, setUploading] = useState(false);
  const [templateMetadata, setTemplateMetadata] = useState<Record<Side, TemplateMetadata | undefined>>(() => ({
    front: initialDraft.current.templateMetadata?.front ?? (initialDraft.current.templateSide === 'front' || (!initialDraft.current.templateSide && initialDraft.current.activeSide === 'front') ? initialDraft.current.templateId ? { id: initialDraft.current.templateId, name: designTemplates.find((template) => template.id === initialDraft.current.templateId)?.name ?? initialDraft.current.templateId } : undefined : undefined),
    back: initialDraft.current.templateMetadata?.back ?? (initialDraft.current.templateSide === 'back' || (!initialDraft.current.templateSide && initialDraft.current.activeSide === 'back') ? initialDraft.current.templateId ? { id: initialDraft.current.templateId, name: designTemplates.find((template) => template.id === initialDraft.current.templateId)?.name ?? initialDraft.current.templateId } : undefined : undefined),
  }));
  const [templateConfirmation, setTemplateConfirmation] = useState<DesignTemplate | null>(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const allMeasurements = [...measurements.front, ...measurements.back];
  const hasOverflowDesign = hasOverflow(allMeasurements);
  const canContinueDesign = canContinue(allMeasurements);
  const price = calculatePrice(options.quantity, measurements.front.length > 0, measurements.back.length > 0);
  const orderId = useMemo(() => `TL-${String(Math.floor(1000 + Math.random() * 9000))}`, []);
  const addCustomDesignToCart = () => {
    const hash = designHash(documents, options.fit);
    onAdd({
      id: `custom-${hash}-${options.color}-${options.size}`,
      designHash: hash,
      productId: 'custom-design',
      name: 'Kendin Tasarla',
      color: options.color,
      size: options.size,
      fit: options.fit,
      quantity: options.quantity,
      unitPrice: Math.round(price.total / options.quantity),
      artwork: 'typography',
      designPreview: previews.front || previews.back || undefined,
      isCustom: true,
    });
    setNotice('Özel tasarım sepete eklendi.');
  };

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
  const chooseSide = (next: Side) => { setSelection(null); setHistoryState({ canUndo: false, canRedo: false }); setSide(next); };
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
  const resetDraft = () => {
    if (!window.confirm('Bu tarayıcıdaki ön ve arka yüz taslağını kalıcı olarak temizlemek istiyor musun?')) return;
    skipNextSave.current = true; clearDraft(); const empty = createEmptyDraft();
    setDocuments({ front: emptyDesign(), back: emptyDesign() }); setMeasurements({ front: [], back: [] }); setPreviews({ front: '', back: '' });
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
    if (!canContinueDesign) return setNotice(hasOverflowDesign ? 'Tasarım baskı alanının dışına taşıyor. Devam etmek için nesneyi alanın içine al.' : 'Tasarımda 200 PPI altında bir görsel var. Önizlemeye geçmeden önce görseli küçült veya daha yüksek çözünürlüklü dosya yükle.');
    setStep('preview');
  };
  const chooseStep = (next: StudioStep) => {
    if (next === 'preview') return continueToPreview();
    setStep(next);
  };
  const addToCartWithQualityCheck = () => {
    if (!canContinueDesign) return setNotice(hasOverflowDesign ? 'Tasarım baskı alanının dışına taşıyor. Devam etmek için nesneyi alanın içine al.' : 'Tasarımda 200 PPI altında bir görsel var. Sepete eklemeden önce görseli küçült veya daha yüksek çözünürlüklü dosya yükle.');
    addCustomDesignToCart();
  };

  return (
    <main className="studio-page studio-page--steps">
      <header className="studio-topbar studio-topbar--quiet">
        <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Mağazaya dön</button>
        <div><b>TeeLab Stüdyo</b><span><Save size={11} /> {saveStatus}</span></div>
        <button className="clear-draft-button" onClick={resetDraft}>Taslağı temizle</button>
      </header>
      <nav className="studio-progress" aria-label="Tasarım adımları">
        {steps.map((item, index) => { const Icon = item.icon; return <button key={item.id} className={step === item.id ? 'is-active' : ''} onClick={() => chooseStep(item.id)} aria-current={step === item.id ? 'step' : undefined}><span>0{index + 1}</span><Icon /> <b>{item.label}</b></button>; })}
      </nav>

      {step === 'product' && <section className="studio-step product-step">
        <div className="step-copy"><span className="editorial-index">01 / ÜRÜN</span><h1>Tuvalini seç.</h1><p>Renk, beden ve adedi belirle. Tasarımın ön ve arka yüz için aynı 30 × 40 cm üretim alanını kullanır.</p>
          <div className="product-step-controls">
            <fieldset><legend>Kesim</legend><div className="sizes">{(['slim','oversize'] as ShirtFit[]).map((fit) => <button key={fit} className={options.fit === fit ? 'is-active' : ''} onClick={() => setOptions({ ...options, fit })}>{fit === 'slim' ? 'Slim fit' : 'Oversize'}</button>)}</div></fieldset>
            <fieldset><legend>Tişört rengi — <b>{colorNames[options.color]}</b></legend><div className="shirt-colors">{(['white','black'] as ShirtColor[]).map((color) => <button key={color} className={options.color === color ? 'is-active' : ''} onClick={() => setOptions({ ...options, color })}><i style={{ background: colorHex[color] }} />{colorNames[color]}</button>)}</div></fieldset>
            <fieldset><legend>Beden</legend><div className="sizes">{(['S','M','L','XL','XXL'] as ShirtSize[]).map((size) => <button key={size} className={options.size === size ? 'is-active' : ''} onClick={() => setOptions({ ...options, size })}>{size}</button>)}</div></fieldset>
            <fieldset><legend>Adet</legend><div className="stepper"><button onClick={() => setOptions({ ...options, quantity: Math.max(1, options.quantity - 1) })} aria-label="Adedi azalt"><Minus /></button><input aria-label="Adet" type="number" min="1" max="50" value={options.quantity} onChange={(event) => setOptions({ ...options, quantity: Math.min(50, Math.max(1, Number(event.target.value))) })} /><button onClick={() => setOptions({ ...options, quantity: Math.min(50, options.quantity + 1) })} aria-label="Adedi artır"><Plus /></button></div></fieldset>
          </div>
          <button className="button button--ink" onClick={() => setStep('design')}>Tasarıma geç <ArrowRight /></button>
        </div>
        <div className="product-step-mockups"><div><Mockup color={options.color} side="front" className="product-choice-mockup" /><span>ÖN</span></div><div><Mockup color={options.color} side="back" className="product-choice-mockup" /><span>ARKA</span></div></div>
      </section>}

      {step === 'design' && <section className="studio-step design-step">
        <aside className="design-tools">
          <div className="step-panel-heading"><span>02 / TASARIM</span><h2>Fikrini yerleştir.</h2><p>Bir araç seç, sonra baskı alanında düzenle.</p></div>
          <section className="tool-section"><h3><WandSparkles /> Tasarım şablonları</h3><div className="template-grid">{designTemplates.map((template) => <button key={template.id} className={templateMetadata[side]?.id === template.id ? 'is-active' : ''} aria-pressed={templateMetadata[side]?.id === template.id} onClick={() => requestTemplate(template.id)}><b>{template.name}</b><small>{template.description}</small></button>)}</div></section>
          <section className="tool-section"><h3><Type /> Metin</h3><button className="tool-action" onClick={() => editorRef.current?.addText()}><Plus /> Metin ekle</button>
            {selection?.kind === 'text' && <div className="text-controls"><label>Metin<textarea value={selection.text ?? ''} onChange={(event) => editorRef.current?.updateSelected({ text: event.target.value })} /></label><div className="two-cols"><label>Yazı tipi<select value={selection.fontFamily} onChange={(event) => editorRef.current?.updateSelected({ fontFamily: event.target.value })}><option value="Arial">Sans-serif</option><option value="Georgia">Serif</option><option value="Courier New">Monospace</option><option value="Impact">Display</option></select></label><label>Punto<input type="number" min="12" max="120" value={selection.fontSize ?? 34} onChange={(event) => editorRef.current?.updateSelected({ fontSize: Number(event.target.value) })} /></label></div><div className="inline-controls"><label>Renk<input type="color" value={selection.fill ?? '#0f172a'} onChange={(event) => editorRef.current?.updateSelected({ fill: event.target.value })} /></label><button className={selection.fontWeight === 700 ? 'is-active' : ''} onClick={() => editorRef.current?.updateSelected({ fontWeight: selection.fontWeight === 700 ? 400 : 700 })} aria-label="Kalın yazı">B</button><button onClick={() => editorRef.current?.updateSelected({ textAlign:'left' })} aria-label="Sola hizala"><AlignLeft /></button><button onClick={() => editorRef.current?.updateSelected({ textAlign:'center' })} aria-label="Ortala"><AlignCenter /></button><button onClick={() => editorRef.current?.updateSelected({ textAlign:'right' })} aria-label="Sağa hizala"><AlignRight /></button></div></div>}
          </section>
          <section className="tool-section"><h3><WandSparkles /> Hazır semboller</h3><div className="symbol-grid">{symbols.map((symbol) => { const active = measurements[side].some((item) => item.kind === 'symbol' && item.label === symbol.name); return <button key={symbol.name} className={active ? 'is-active' : ''} aria-pressed={active} onClick={() => editorRef.current?.toggleSymbol(symbol.svg, symbol.name)} title={active ? `${symbol.name} sembolünü kaldır` : `${symbol.name} sembolünü ekle`}><b>{symbol.icon}</b><small>{symbol.name}</small></button>; })}</div></section>
          <section className="tool-section"><h3><ImagePlus /> Kendi görselin</h3><label className="upload-zone"><Upload /><b>{uploading ? 'HEIC görselin hazırlanıyor…' : 'Görsel yükle'}</b><span>PNG, JPG, WebP veya HEIC · maks. 10 MB</span><small>HEIC görseller cihazında dönüştürülür. SVG için hazır sembolleri kullan.</small><input type="file" disabled={uploading} accept=".png,.jpg,.jpeg,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={(event) => upload(event.target.files?.[0])} /></label>{notice && <div className="quality-note" role="status" aria-live="polite"><Info /> {notice}</div>}</section>
          <section className="tool-section object-tools"><h3>Nesne düzenleme</h3><div className="object-tools__actions"><button disabled={!historyState.canUndo} onClick={() => editorRef.current?.undo()} title="Geri al"><Undo2 /> Geri al</button><button disabled={!historyState.canRedo} onClick={() => editorRef.current?.redo()} title="Yinele"><Redo2 /> Yinele</button><button disabled={!selection} onClick={() => editorRef.current?.bringForward()}><ArrowUpToLine /> Öne al</button><button disabled={!selection} onClick={() => editorRef.current?.sendBackward()}><ArrowDownToLine /> Arkaya al</button><button disabled={!selection} onClick={() => editorRef.current?.removeSelected()} className="danger"><Trash2 /> Sil</button></div><div className="object-tools__align"><button disabled={!selection} onClick={() => editorRef.current?.alignHorizontal()} title="Baskı alanında yatay ortala">Yatay ortala</button><button disabled={!selection} onClick={() => editorRef.current?.alignVertical()} title="Baskı alanında dikey ortala">Dikey ortala</button></div></section>
          {selection && <section className="selection-card selection-card--context"><b>{selection.label}</b><div className="measure-grid"><span><small>Merkez X / Y</small>{selection.measurement.xCm} / {selection.measurement.yCm} cm</span><span><small>G × Y</small>{selection.measurement.widthCm} × {selection.measurement.heightCm} cm</span><span><small>Dönüş</small>{selection.measurement.angle}°</span><span><small>Tür</small>{selection.kind === 'text' ? 'Metin' : selection.measurement.vector ? 'Vektör' : 'Raster'}</span></div>{selection.measurement.estimatedPpi !== undefined && <div className={`ppi-badge ppi-badge--${selection.measurement.quality}`}><b>{selection.measurement.estimatedPpi} PPI</b><span>{qualityLabel[selection.measurement.quality!]}</span></div>}</section>}
        </aside>
        <div className="design-canvas">
          <div className="side-tabs" role="tablist" aria-label="Tişört yüzü"><button className={side === 'front' ? 'is-active' : ''} onClick={() => chooseSide('front')}>Ön yüz <span>{measurements.front.length}</span></button><button className={side === 'back' ? 'is-active' : ''} onClick={() => chooseSide('back')}>Arka yüz <span>{measurements.back.length}</span></button></div>
          <div className="editor-stage"><Mockup color={options.color} side={side} showGuide className="editor-realistic-mockup" editor={<FabricEditor key={`${side}-${draftRevision}`} ref={editorRef} side={side} document={documents[side]} template={templateMetadata[side]} onChange={updateSide} onSelection={setSelection} onHistoryChange={setHistoryState} />} /></div>
          <div className="canvas-hint"><RotateCcw /> Nesneyi seç; köşelerden ölçekle, üst noktadan döndür.</div>
          <div className="step-actions"><button className="button button--ghost" onClick={() => setStep('product')}><ArrowLeft /> Ürüne dön</button><button className="button button--ink" onClick={continueToPreview} aria-describedby={!canContinueDesign ? 'quality-blocker' : undefined}>Önizlemeye geç <ArrowRight /></button></div>
          {!canContinueDesign && <p className="quality-note" id="quality-blocker" role="alert"><Info /> {hasOverflowDesign ? 'Tasarım baskı alanının dışına taşıyor. Nesneyi alanın içine al.' : '200 PPI altındaki görsellerle önizlemeye ve sepete ilerleyemezsin.'}</p>}
        </div>
      </section>}

      {step === 'preview' && <section className="studio-step preview-step">
        <div className="preview-gallery"><div><span>ÖN / {measurements.front.length} NESNE</span><Mockup color={options.color} side="front" designUrl={previews.front} /></div><div><span>ARKA / {measurements.back.length} NESNE</span><Mockup color={options.color} side="back" designUrl={previews.back} /></div></div>
        <aside className="preview-summary"><span className="editorial-index">03 / ÖNİZLEME</span><h1>Son bir bakış.</h1><p>Mockup sunum içindir; üretim koordinatları 30 × 40 cm baskı state’inden ayrı hesaplanır.</p><dl><div><dt>Renk</dt><dd>{colorNames[options.color]}</dd></div><div><dt>Kesim</dt><dd>{options.fit === 'slim' ? 'Slim fit' : 'Oversize'}</dd></div><div><dt>Beden / Adet</dt><dd>{options.size} / {options.quantity}</dd></div><div><dt>Ön / Arka</dt><dd>{measurements.front.length} / {measurements.back.length} nesne</dd></div></dl><div className="preview-total"><span>Tahmini toplam</span><strong>{formatTRY(price.total)}</strong></div><small>Demo tahminidir; gerçek üretim teklifi değildir.</small><button className="button button--ink button--wide" onClick={addToCartWithQualityCheck}>Sepete ekle</button><button className="button button--ghost button--wide" onClick={() => setShowSummary(true)}>Sipariş özetini aç</button><button className="button button--ghost button--wide" onClick={() => setStep('design')}>Tasarıma dön</button></aside>
      </section>}

      {showSummary && !showEmail && <SummaryModal options={options} price={price} previews={previews} measurements={allMeasurements} orderId={orderId} templateMetadata={templateMetadata} onClose={() => setShowSummary(false)} onEmail={() => setShowEmail(true)} />}
      {showEmail && <EmailModal options={options} price={price} previews={previews} measurements={allMeasurements} orderId={orderId} templateMetadata={templateMetadata} onClose={() => { setShowEmail(false); setShowSummary(false); }} />}
      {templateConfirmation && <div className="template-confirmation-backdrop" role="presentation"><section className="template-confirmation" role="dialog" aria-modal="true" aria-labelledby="template-confirmation-title"><h2 id="template-confirmation-title">Mevcut tasarım değiştirilsin mi?</h2><p>“{templateConfirmation.name}” yalnızca aktif {side === 'front' ? 'ön' : 'arka'} yüzün içeriğini değiştirir. Diğer yüz korunur.</p><div><button className="button button--ghost" autoFocus onClick={() => { setTemplateConfirmation(null); setNotice('Şablon uygulanmadı; mevcut tasarımın korundu.'); }}>İptal</button><button className="button button--ink" onClick={() => { void applyTemplate(templateConfirmation); setTemplateConfirmation(null); }}>Şablonu uygula</button></div></section></div>}
    </main>
  );
}
