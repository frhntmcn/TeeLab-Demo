import { Check, Download, FileArchive, Mail, X } from 'lucide-react';
import { colorNames } from '../data/products';
import { formatTRY } from '../lib/pricing';
import type { ObjectMeasurement, OrderOptions, PreviewImages, PriceBreakdown, Side, TemplateMetadata } from '../types';
import { ShirtVisual } from './Artwork';

interface SharedProps {
  options: OrderOptions;
  price: PriceBreakdown;
  previews: PreviewImages;
  measurements: ObjectMeasurement[];
  orderId: string;
  templateMetadata?: Partial<Record<Side, TemplateMetadata>>;
}

function templateSummary(metadata?: TemplateMetadata) {
  return metadata?.name ?? 'Özel tasarım';
}

export function SummaryModal(props: SharedProps & { onClose: () => void; onEmail: () => void }) {
  const frontCount = props.measurements.filter((item) => item.side === 'front').length;
  const backCount = props.measurements.filter((item) => item.side === 'back').length;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal summary-modal" role="dialog" aria-modal="true" aria-labelledby="summary-title">
        <button className="modal-close" onClick={props.onClose} aria-label="Özeti kapat"><X /></button>
        <div className="modal-heading"><span className="success-icon"><Check /></span><span className="eyebrow">TASARIM HAZIR</span><h2 id="summary-title">Fikrini üretime hazırladık.</h2><p>Siparişe geçmeden önce ürününü ve baskı detaylarını kontrol et.</p></div>
        <div className="summary-content">
          <div className="mockup-pair">
            <div><span>ÖN · {frontCount} NESNE</span><ShirtVisual color={props.options.color} side="front" designUrl={props.previews.front} /></div>
            <div><span>ARKA · {backCount} NESNE</span><ShirtVisual color={props.options.color} side="back" designUrl={props.previews.back} /></div>
            <p className="mockup-disclaimer">Fotogerçekçi mockup yalnızca sunum amaçlıdır; kumaş deformasyonu simüle edilmez ve üretim dosyası değildir.</p>
          </div>
          <div className="order-card">
            <span className="eyebrow">SİPARİŞ ÖZETİ</span>
            <dl><div><dt>Ürün</dt><dd>Premium Unisex Tişört</dd></div><div><dt>Renk</dt><dd>{colorNames[props.options.color]}</dd></div><div><dt>Kesim</dt><dd>{props.options.fit === 'slim' ? 'Slim fit' : 'Oversize'}</dd></div><div><dt>Beden / Adet</dt><dd>{props.options.size} / {props.options.quantity}</dd></div><div><dt>Ön şablon</dt><dd>{templateSummary(props.templateMetadata?.front)}</dd></div><div><dt>Arka şablon</dt><dd>{templateSummary(props.templateMetadata?.back)}</dd></div><div><dt>Ön baskı</dt><dd>{frontCount ? `${frontCount} nesne` : 'Yok'}</dd></div><div><dt>Arka baskı</dt><dd>{backCount ? `${backCount} nesne` : 'Yok'}</dd></div></dl>
            <div className="summary-total"><span>Tahmini toplam</span><strong>{formatTRY(props.price.total)}</strong></div>
            <small>KDV dahil demo fiyatıdır. Kargo dahil değildir.</small>
            <button className="button button--primary button--wide" onClick={props.onEmail}><Mail size={18} /> İmalathane e-postasını önizle</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function EmailModal(props: SharedProps & { onClose: () => void }) {
  const now = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
  const productionPackage = {
    schema: 'teelab.production.v2',
    orderId: props.orderId,
    createdAt: new Date().toISOString(),
    demoOnly: true,
    product: { sku: 'TL-PREMIUM-UNI', name: 'Premium Unisex Tişört', color: colorNames[props.options.color], fit: props.options.fit, size: props.options.size, quantity: props.options.quantity },
    templates: (['front', 'back'] as const).map((side) => ({ side, ...props.templateMetadata?.[side] })),
    printAreaCm: { width: 30, height: 40 },
    coordinateReference: 'Baskı alanının sol üst köşesinden ölçülen X/Y; nesnenin merkezi referans alınır.',
    previewPolicy: 'Mockup görselleri sunum amaçlıdır; baskı/üretim dosyası değildir.',
    price: { currency: 'TRY', total: props.price.total, demoEstimate: true },
    surfaces: (['front', 'back'] as const).map((side) => ({
      side,
      items: props.measurements.filter((item) => item.side === side).map((item) => ({
        id: item.id,
        type: item.kind,
        name: item.label,
        positionCm: { x: item.xCm, y: item.yCm, anchor: 'center' },
        sizeCm: { width: item.widthCm, height: item.heightCm },
        rotationDeg: item.angle,
        source: item.detail,
        output: item.vector ? 'vector' : 'raster',
        rasterQuality: item.vector ? undefined : { sourcePixels: item.sourcePixels, estimatedPpi: item.estimatedPpi, status: item.quality },
      })),
    })),
  };

  const simulateDownload = (name: string) => {
    const content = name.endsWith('.json') ? JSON.stringify(productionPackage, null, 2) : 'TeeLab demo baskı dosyası — gerçek üretim çıktısı değildir.';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal email-modal" role="dialog" aria-modal="true" aria-labelledby="email-title">
        <button className="modal-close" onClick={props.onClose} aria-label="E-posta önizlemesini kapat"><X /></button>
        <div className="demo-banner">DEMO ÖNİZLEME · Bu e-posta gönderilmedi, üretim kaydı oluşturulmadı.</div>
        <div className="email-header"><div className="email-icon"><Mail /></div><div><span>İmalathane e-postası</span><h2 id="email-title">[TeeLab] Yeni Baskı Siparişi — {props.orderId}</h2><p><b>Kime:</b> uretim@teelab.demo &nbsp; · &nbsp; <b>Kimden:</b> siparis@teelab.demo</p></div></div>
        <div className="email-body">
          <p>Merhaba Üretim Ekibi,</p><p><b>{props.orderId}</b> numaralı siparişin demo baskı paketi aşağıdadır. Lütfen yerleşim ve kaynak türlerini üretim öncesinde kontrol edin.</p>
          <div className="email-order-grid"><span><small>SİPARİŞ NO</small><b>{props.orderId}</b></span><span><small>TARİH</small><b>{now}</b></span><span><small>ÜRÜN</small><b>Premium Unisex / {colorNames[props.options.color]} / {props.options.fit === 'slim' ? 'Slim fit' : 'Oversize'}</b></span><span><small>BEDEN / ADET</small><b>{props.options.size} / {props.options.quantity}</b></span><span><small>ŞABLONLAR</small><b>Ön: {templateSummary(props.templateMetadata?.front)} · Arka: {templateSummary(props.templateMetadata?.back)}</b></span><span><small>TOPLAM</small><b>{formatTRY(props.price.total)}</b></span></div>
          <h3>Mockup önizlemeleri</h3><div className="email-mockups"><div><span>ÖN YÜZ</span><ShirtVisual color={props.options.color} side="front" designUrl={props.previews.front} /></div><div><span>ARKA YÜZ</span><ShirtVisual color={props.options.color} side="back" designUrl={props.previews.back} /></div></div>
          <p className="mockup-disclaimer">Mockup yalnızca yerleşim sunumudur; kumaşın fiziksel deformasyonunu veya gerçek baskı çıktısını temsil etmez.</p>
          <h3>Üretim yerleşim tablosu</h3>
          <p className="coordinate-reference">Koordinat referansı: Baskı alanının sol üst köşesinden ölçülen X/Y; nesnenin merkezi referans alınır.</p>
          <div className="table-wrap"><table><thead><tr><th>Yüz</th><th>Alan</th><th>Nesne / Tür</th><th>Merkez X / Y</th><th>G × Y</th><th>Açı</th><th>PPI</th><th>Kaynak</th></tr></thead><tbody>{props.measurements.length ? props.measurements.map((item) => <tr key={`${item.side}-${item.id}`}><td>{item.side === 'front' ? 'Ön' : 'Arka'}</td><td>30 × 40 cm</td><td><b>{item.label}</b><small>{item.kind === 'text' ? 'Metin' : item.kind === 'symbol' ? 'Hazır sembol' : 'Yüklenen görsel'}</small></td><td>{item.xCm} / {item.yCm} cm</td><td>{item.widthCm} × {item.heightCm} cm</td><td>{item.angle}°</td><td>{item.vector ? 'Vektör' : item.estimatedPpi ? `${item.estimatedPpi} PPI` : '—'}<small>{item.quality === 'suitable' ? 'Uygun' : item.quality === 'warning' ? 'Uyarı' : item.quality === 'risk' ? 'Risk' : ''}</small></td><td>{item.detail}<small>{item.vector ? 'Vektör bilgi korunur' : 'Raster · fiziksel boyuta göre hesaplandı'}</small></td></tr>) : <tr><td colSpan={8}>Baskı nesnesi bulunmuyor.</td></tr>}</tbody></table></div>
          <h3>Üretim paketi JSON</h3><pre>{JSON.stringify(productionPackage, null, 2)}</pre>
          <h3>Baskı dosyaları</h3><div className="file-list"><button onClick={() => simulateDownload(`${props.orderId}_production.json`)}><FileArchive /><span><b>{props.orderId}_production.json</b><small>Yerleşim ve sipariş verisi · demo</small></span><Download /></button>{(['front', 'back'] as const).filter((side) => props.measurements.some((item) => item.side === side)).map((side) => <button key={side} onClick={() => simulateDownload(`${props.orderId}_${side}_print-demo.txt`)}><FileArchive /><span><b>{props.orderId}_{side}_print-demo.txt</b><small>Demo indirme · gerçek baskı dosyası değil</small></span><Download /></button>)}</div>
          <div className="production-note"><b>Baskı notu:</b> SVG kaynakları vektör olarak temsil edilir. PNG/JPG kalitesi, seçilen fiziksel genişlik ve yükseklik üzerinden tahmini PPI ile değerlendirilir. Mockup görselleri ve demo indirmeleri üretim dosyası değildir.</div>
        </div>
      </section>
    </div>
  );
}
