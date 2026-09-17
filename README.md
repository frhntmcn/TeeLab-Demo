# Maymoon Demo

Maymoon için hazırlanmış, yerelde çalışan React tabanlı tişört e-ticaret ve tasarım stüdyosu demosu.

## Marka yapılandırması

Marka adı, alan adı, iletişim adresi ve sosyal kullanıcı adı [src/config/brand.ts](src/config/brand.ts) dosyasında tutulur. İlk kurumsal iletişim adresi `info@maymoon.com.tr`, alan adı `maymoon.com.tr` ve planlanan sosyal kullanıcı adı `@maymoontr` olarak tanımlıdır. DNS veya gerçek e-posta gönderimi bu demo kapsamında kurulmaz.

## Çalıştırma

Gereksinim: Node.js 18 veya üzeri.

```bash
npm install
npm run dev
```

Bu bilgisayarda `http://127.0.0.1:5173` adresini açın. Aynı yerel ağdaki başka bir cihazdan bilgisayarın güncel LAN IP adresi ve `5173` portu ile erişilebilir: `http://<LAN-IP>:5173`. Windows'ta güncel adres `ipconfig` komutundaki etkin ağ bağdaştırıcısının “IPv4 Address” satırından görülebilir.

Üretim derlemesi:

```bash
npm run lint
npm run build
npm test
npm run preview
```

## Özellikler

- Responsive ana sayfa, dört ürünlü katalog ve ürün detay akışı
- React Router tabanlı gerçek URL'ler: `/`, `/koleksiyon/:Türkçe-slug`, `/studio`, `/sepet`
- Kalıcı demo sepeti, teslimat formu ve açıkça simüle edilen sipariş tamamlama adımı
- Route bazlı lazy loading; Fabric.js yalnızca stüdyo açıldığında yüklenir
- Favicon, Open Graph/Twitter kartları ve ürün sayfalarında state'ten üretilen Product JSON-LD
- Özgün, yüksek çözünürlüklü raster baskı görselleriyle ön ve arka ürün sunumu
- Dört koleksiyon için ImageGen ile üretilmiş, web-optimize yüksek çözünürlüklü raster baskı artwork'leri
- Sakin editorial ana sayfa, ön/arka eşit ürün sunumu ve fotoğraf odaklı 2×2 koleksiyon düzeni
- Customizer'da `Ürün → Tasarım → Önizleme` adımları; aynı anda yalnızca ilgili görev paneli
- Fabric.js ile ön/arka yüz için ayrı tasarım alanları
- Metin, altı hazır SVG sembol ve yerel PNG/JPG/SVG yükleme
- Sürükleme, ölçekleme, döndürme, katman sırası ve silme
- 30 × 40 cm baskı alanı ve merkez referanslı santimetre yerleşim modeli
- Raster görseller için seçili fiziksel baskı boyutundan hesaplanan tahmini PPI
- Görünür fiyat formülü ve adet indirimi simülasyonu
- Sipariş özeti, mockup önizlemeleri, üretim tablosu ve state'ten türetilen JSON paketi
- İmalathane e-postası ve demo dosya indirme simülasyonu
- Ön/arka tasarım, ürün seçenekleri ve önizlemeler için `localStorage` tabanlı otomatik taslak kaydı
- Onaylı “Taslağı temizle” akışı

## Fotogerçekçi mockup sistemi

Customizer, sipariş özeti, e-posta önizlemesi ve ürün sunumları üç katmanlı bir mockup yapısı kullanır:

1. Fotogerçekçi tişört taban görseli
2. Fabric.js tarafından üretilen şeffaf tasarım/baskı katmanı
3. Kontrollü düşük opaklıklı ışık ve kumaş dokusu katmanı

Her yüz için mockup üzerindeki sunum dikdörtgeni ayrı konfigürasyonda tanımlıdır ve Fabric canvas'ın tamamını fiziksel 30 × 40 cm alana eşler. Mockup yerleşimi yalnızca sunumu etkiler; üretim koordinatlarını değiştirmez. Kumaşın fiziksel deformasyonu simüle edilmez.

### Mockup varlıkları ve kullanım notu

`src/assets/mockups/` altındaki sekiz WebP varlığı (beyaz, siyah, bej ve mor; ön ve arka), OpenAI ImageGen ile yalnızca bu Maymoon demosu için özgün olarak üretildi. Harici hotlink, üçüncü taraf marka, logo veya telifli tasarım kullanılmadı. Kullanım, kullanıcı ile OpenAI arasındaki geçerli hizmet koşullarına tabidir.

`src/assets/artworks/` altındaki Gece Yörüngesi, Anadolu Form, Mor Sinyal ve İyi Fikir WebP baskı artwork'leri de OpenAI ImageGen ile bu demo için özgün olarak üretildi. Bunlar gerçek üretim/prepress dosyası değil, marka ve mockup sunumu için optimize edilmiş demo görselleridir.

## Baskı koordinat modeli

- Baskı alanı: 30 × 40 cm
- X/Y referansı: baskı alanının sol üst köşesi
- Nesne referansı: nesnenin merkezi
- Genişlik/yükseklik: nesnenin döndürülmemiş, ölçeklenmiş fiziksel boyutu
- Dönüş: saat yönünde derece
- Döndürülmüş nesnenin sınır kontrolü: ekrandaki eksen hizalı dış sınırı baskı alanı içinde tutulur
- Raster kalite eşikleri: 300 PPI ve üzeri uygun, 200–299 PPI uyarı, 200 PPI altı risk
- SVG kaynakları vektör olarak işaretlenir

## Taslak kaydı

Ön/arka Fabric dokümanları, ürün rengi, beden, adet, aktif yüz ve mockup önizlemeleri tarayıcının `localStorage` alanında saklanır. Sayfa yenilendiğinde taslak geri yüklenir. Depolama kullanılamazsa uygulama çalışmaya devam eder. “Taslağı temizle” yalnızca bu tarayıcıdaki Maymoon demo taslağını siler.

Taslak kayıtları şema sürümü 2 ile saklanır; v1 kayıtları yükleme sırasında v2 yapısına taşınır. Sepet satırları `productId + renk + beden + designHash` anahtarıyla birleştirilir; farklı özel tasarımlar ayrı satırda kalır. `npm test` sepet kimliği, fiyatlandırma ve tasarım hash davranışlarını doğrular.

## Demo sınırları

Bu proje bir demo/MVP'dir. Sepet ve teslimat formu yalnızca tarayıcı içi deneyimdir; gerçek ödeme, kullanıcı hesabı, veritabanı, WhatsApp, e-posta gönderimi veya üretim entegrasyonu içermez. Yüklenen görseller yalnızca kullanıcının tarayıcısında işlenir; herhangi bir sunucuya gönderilmez. Mockup görselleri, üretim tablosu ve indirilen demo dosyaları gerçek baskı çıktısı değildir. PPI değeri kaynak piksel ölçüsü ile seçilen fiziksel boyuttan türetilen tahmini bir kontroldür; profesyonel prepress onayı yerine geçmez.
