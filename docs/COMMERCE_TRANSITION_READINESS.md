# Maymoon gerçek e-ticarete geçiş: yerel teslim kontrolü

Bu belge, repository'deki yerel uygulamayı canlıya geçişte gereken dış sistem ve işletme kararlarından ayırır. Eklenti ve frontend bu turda **yerel hazırlanmıştır; canlıya yüklenmemiş/etkinleştirilmemiştir**.

## Yerel olarak hazır

- Ürün koleksiyonunda Türkçe arama ve fiyat sıralama; ürün detayında klavyeyle kullanılabilen beden rehberi.
- Ana sayfa, bilgi/SSS/kurumsal sayfalar ve dinamik route metadata; robots.txt ve sitemap.xml. SPA yapısı nedeniyle arama motoru ön-render/SSR değildir.
- Müşteri hesabı UI'sı; WordPress eklentisi uçlarında kayıt, giriş/çıkış, oturum, adres/profil, sipariş geçmişi, şifre sıfırlama talebi ve kullanıcıya özel tasarım saklama.
- WooCommerce ürün/varyasyon fiyatı ve stok için sunucu tarafı teklif doğrulaması. Fiyat gösterimi sunucu teklifine dayanabilir, ama gerçek sepet/sipariş/ödeme gönderimi henüz yoktur.
- Yönetici girişi için WordPress rol kontrolü; canlı host'ta gerçek WooCommerce siparişlerini okuma ve durum güncelleme API'si. Demo/local yönetim ile canlı mağaza yazmaları ayrıdır; React panelinden ürün/stock/fiyat değiştirme henüz yoktur.
- Tasarım belgelerinin müşteri hesabına kaydı ve tekrar açılması; özel tasarım JSON/ölçümünü sipariş üretim snapshot'ı olarak hazırlama.
- Tasarım ön/arka üretim PNG'lerini 30×40 cm, 300 DPI (3543×4724) olarak yerel dışa aktarma ve PNG çözünürlük metadata'sı.
- Belirli hesap/izin alanlarında satış durdurma; demo tarayıcı siparişini canlı sipariş gibi göstermeme. Çerez tercihi ve taslak bilgi/hukuk sayfaları.

## Henüz canlı satışa hazır değil

- Gerçek Store API sepeti, sipariş oluşturma, kargo/vergi toplamı, ödeme sağlayıcısı başlatma/3D Secure dönüşü/webhook/idempotency ve iptal/iade akışı.
- WooCommerce/iyzico eklentisinin ödeme checkout desteği ve test anahtarlarıyla uçtan uca kabulü. Gateway'in Store API uyumluluğu ayrıca doğrulanmalı; bu React arayüzü kart verisi almaz.
- Tasarım dosyasını siparişe kalıcı, yetki kontrollü depolama ve üretim kuyruğuna teslim etme. Şu an PNG yalnızca müşterinin cihazına iner; siparişe bağlı değildir, ayrıca renk profili, taşma ve üreticiye özel kalıp garantisi yoktur.
- Yönetici panelinden ürün/variasyon/stok/fiyat yazma; WooCommerce yönetici arayüzü bu alanların gerçek kaynağı olmalıdır.
- Gerçek SMTP, sipariş e-postaları, yasal metinlerin onayı, gizlilik/çerez politikası, şirket/mesafeli satış bilgileri, kargo/iade süreleri ve üretim iddiaları.
- Ürün ölçü tablosu, kumaş/gramaj/üretim iddiaları ve beden tabloları marka/tedarikçi tarafından doğrulanmalı; mevcut örnek ölçüler taahhüt değildir.

## Canlıya geçişten önce sıralı kapılar

1. Güvenli yedek al; eklentiyi staging WordPress/WooCommerce'e kur. Önce session/account/admin nonce/rol sınırlarını staging'de doğrula.
2. WooCommerce'de yayınlanmış değişken ürünleri, her renk × beden varyasyonunu, gerçek fiyat/stoku ve görselleri oluştur. WooCommerce tek ürün-stok kaynağı olsun.
3. Kargo, vergi, e-posta/SMTP ve yasal ticari metinleri işletme/uzman bilgisiyle yapılandır.
4. iyzico test ortamında Store API/gateway uyumunu doğrula. Başarılı/başarısız ödeme, 3DS dönüşü, yinelenen webhook, sipariş durumu, stok iadesi ve e-posta kabul testini geçmeden canlı ödeme düğmesini açma.
5. Tasarım snapshot/PNG için kalıcı özel dosya saklama, sipariş ilişkilendirme, yetki, saklama süresi ve üretim indirme akışını belirle; teknik olarak staging'de test et.
6. Müşteri ve yönetici uçtan uca staging testi, mobil/erişilebilirlik ve yedekten geri dönüş testi.
7. Yalnızca açık deploy onayıyla canlıya taşı; sonra izleme ve geri dönüş planını çalıştır.

## Bu yerel turda yapılmayanlar

- WordPress eklentisi Natro'ya yüklenmedi ve etkinleştirilmedi; canlı veritabanı/ürün/sipariş değişmedi.
- GitHub'a commit/push, PR/merge veya Vercel/live deploy yapılmadı.
- Gerçek iyzico/SMTP anahtarları, şirket kimliği/iletişim, ücret/iade/kargo veya üretim vaatleri eklenmedi.
- Yasal taslaklar hukuki uygunluk iddiası taşımaz.

## Doğrulama

- `npm run lint`: başarılı.
- `npm test`: 25 test dosyası, 72 test başarılı.
- `npm run build`: başarılı; `heic2any` chunk boyutu uyarısı mevcut (işlevsel başarısızlık değil).
- WordPress eklentisi PHP 7.4 grameri ile ayrıştırıldı; tam WordPress/WooCommerce runtime testi yerine geçmez.
- `public/robots.txt` ve `public/sitemap.xml` build çıktısında mevcut.
