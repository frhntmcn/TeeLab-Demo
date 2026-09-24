import { Link, useParams } from 'react-router-dom';
import { brand } from '../config/brand';

const documents: Record<string, { title: string; intro: string; sections: [string, string][] }> = {
  'on-bilgilendirme': { title: 'Ön Bilgilendirme Formu', intro: 'Bu sayfa, satışa açılmadan önce şirket bilgileri ve hukuk danışmanı onayıyla tamamlanacak taslaktır.', sections: [['Satıcı bilgileri', 'Ticari unvan, MERSİS numarası, vergi bilgileri, tebligat adresi ve telefon bilgileri canlıya alınmadan önce girilecektir.'], ['Ürün ve teslimat', 'Ürün, toplam bedel, üretim süresi, kargo bedeli ve teslimat koşulları ödeme adımında siparişe özel olarak gösterilecektir.']] },
  'mesafeli-satis': { title: 'Mesafeli Satış Sözleşmesi', intro: 'Bu sözleşme taslağı gerçek satış öncesinde hukuk danışmanı tarafından onaylanmalıdır.', sections: [['Sipariş özeti', 'Ödeme öncesinde ürün/varyasyon, adet, KDV, kargo ve toplam tutar yeniden hesaplanarak gösterilecektir.'], ['Cayma ve istisnalar', 'Kişiselleştirilmiş ürünlere ilişkin koşullar, ilgili mevzuat ve hukuk danışmanı onayı doğrultusunda burada yer alacaktır.']] },
  kvkk: { title: 'KVKK Aydınlatma Metni', intro: 'Kişisel verilerin işlenmesine ilişkin aydınlatma metni, veri sorumlusu bilgileri kesinleştiğinde yayınlanacaktır.', sections: [['İşlenen veriler', 'Hesap, teslimat, fatura ve sipariş üretim süreçleri için gerekli veriler; amaç, süre ve hukuki sebep bazında açıklanacaktır.'], ['Başvuru hakları', 'KVKK kapsamındaki başvuru kanalı ve cevap süresi, şirketin doğrulanmış iletişim bilgileriyle eklenecektir.']] },
  gizlilik: { title: 'Gizlilik Politikası', intro: 'Hesap ve sipariş verilerinin nasıl korunduğunu anlatan taslak sayfadır.', sections: [['Hesap güvenliği', 'Parolalar WordPress/WooCommerce tarafından güvenli biçimde işlenir; uygulama parolayı saklamaz.'], ['Paylaşım', 'Ödeme, kargo ve yasal yükümlülük sağlayıcılarıyla veri paylaşımının kapsamı canlı yapılandırma sonrasında açıkça belirtilecektir.']] },
  'teslimat-iade': { title: 'Teslimat, İade ve İptal', intro: 'Üretim ve lojistik süreçleri belirlendiğinde gerçek süre ve koşullarla güncellenecek taslaktır.', sections: [['Üretim durumu', 'Siparişler ödeme sonrasında yönetici üretim onayına düşecek; müşteri durum değişikliklerinden haberdar edilecektir.'], ['Kargo ve iade', 'Kargo firması, takip yöntemi, iade adresi ve süreçleri doğrulanmış işletme kararlarıyla eklenecektir.']] },
};

export function LegalPage() {
  const { document } = useParams();
  const page = documents[document ?? ''];
  if (!page) return <main className="legal-page"><section><h1>Sayfa bulunamadı.</h1><Link to="/">Ana sayfaya dön</Link></section></main>;
  return <main className="legal-page"><section><p className="eyebrow">MAYMOON / HUKUKİ BİLGİLENDİRME</p><h1>{page.title}</h1><p className="legal-page__notice">{page.intro}</p>{page.sections.map(([heading, copy]) => <article key={heading}><h2>{heading}</h2><p>{copy}</p></article>)}<p className="legal-page__contact">Bu metinle ilgili soru için: <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a></p></section></main>;
}
