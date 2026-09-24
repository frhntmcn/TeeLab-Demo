# Maymoon Studio profesyonelleştirme — yerel uygulama raporu

Tarih: 23 Eylül 2026
Dal: `codex/maymoon-brand-foundation`
Durum: Yerel geliştirme; commit, push ve canlı yayın yapılmadı.

## 1. Başlangıç ve kapsam

Beş karşılaştırma raporu mevcut kaynak koduyla karşılaştırıldı. Raporlardaki eski veya yalnız HTML'de görülen iddialar doğrudan özellik kabul edilmedi. Üç adımlı ürün–tasarım–önizleme akışı, ön/arka yüz ayrımı, 30 × 40 cm baskı alanı, 200 PPI kalite kapısı ve mevcut kullanıcı değişiklikleri korundu. Bu tur mevcut tişört modellerine odaklanır.

Çalışma ağacı başlangıçta zaten kirliydi. Önceki katalog, yönetim, hesap, WordPress eklentisi ve doküman değişiklikleri sıfırlanmadı veya üzerine eski branch kodu taşınmadı.

## 2. Tamamlanan yerel iyileştirmeler

### Sipariş ve fiyat

- S–XXL için ayrı ayrı adet girilebilen matris eklendi; eski tek beden taslakları yeni yapıya okunarak aktarılıyor.
- Toplam adet en fazla 999 olacak şekilde sınırlandırılıyor; en az bir adet seçilmeden ilerlenmiyor.
- Tek tasarımın bedenleri sepette ayrı satırlar olarak tutuluyor ve bir tasarım grubu kimliğiyle bağlanıyor. Adet indirimi bedenlerin toplamına göre hesaplanıyor; sepet satırlarına paylaştırılan indirim toplamı kuruş/yuvarlama kaybı oluşturmuyor.
- Tasarım ekranında ürün, ön/arka baskı, toplam adet, indirim ve demo toplamı canlı görünüyor. Önizleme ve özet çoklu beden dağılımını gösteriyor.

### Düzenleyici ve mobil kullanım

- Katman listesi, seçme, gizleme/gösterme, kilitleme/açma, öne/arkaya taşıma, çoğaltma ve vektör nesneleri gruplama/grup çözme eklendi.
- Raster görsellerin gruplanması özellikle kapalı: grup ölçeklemesinin çocuk görsellerin PPI hesabını atlatmasına izin verilmiyor.
- Ctrl/⌘+Z, Shift+Ctrl/⌘+Z, Ctrl/⌘+D, Delete, ok tuşları ve Esc kısayolları ile kısa yardım eklendi. Sayısal merkez X/Y alanları ve mevcut ortalama düğmeleri bulunuyor.
- %75–150 görüntü yakınlaştırma ve tuvale sığdırma eklendi. Bu, baskı ölçüsü veya tasarım belgesini değiştirmiyor.
- Mobilde tuvalden araçlara ve geri hızlı geçiş sağlandı. Çerez panelinin beyaz üstüne beyaz düğme kontrastı düzeltildi ve yüksekliği sınırlandı. Studio araç yazıları büyütüldü; Maymoon'un sakin renk ve bileşen dili korundu.

### Yaratıcı araçlar

- Sekiz aranabilir vektör şekil, dolgu/kontur/kalınlık/şeffaflık ayarları ve fırça kalınlığı/renk seçilebilen serbest çizim eklendi.
- Türkçe karakter alt kümelerini de içeren, kendi sunucumuzdan yüklenen altı SIL Open Font License yazı tipi eklendi; önceki dört yazı tipi ve eski tasarımlar korunuyor. Lisans metinleri build çıktısına `studio-font-licenses.txt` olarak ekleniyor.
- Harf aralığı, satır yüksekliği ve ayarlanabilir metin kavisi eklendi.
- Yüklenen görseli yerinde değiştirme, simetrik kırpma, parlaklık/kontrast/doygunluk ve siyah-beyaz filtresi eklendi. Kırpılan görünür piksel boyutu PPI hesabına katılıyor; düşük çözünürlükte önizleme/sepete geçiş engelleniyor.

### Saklama ve üretim

- Mevcut hesaba kaydetme bağlantısı canlı alan adında tasarım adımından da ulaşılabilir kılındı. Yerel taslaklar yeni nesne özelliklerini saklıyor; eski taslaklar okunabiliyor.
- Müşteri sipariş özetinden yüksek çözünürlüklü üretim dosyası indirme girişi kaldırıldı. Üretim dosyası yönetim/atölye iş akışında kalmalı; gerçek yetki kontrolü canlı sipariş entegrasyonunda sunucu tarafında uygulanacak.
- Mevcut PNG dışa aktarımı tarayıcı testinde 3543 × 4724 piksel, 300 DPI pHYs kaydı ve saydam arka planla doğrulandı. Yeni fontlar yönetim çıktısında da yükleniyor.

## 3. Doğrulama

- `npm run lint`: başarılı.
- `npm test`: 25 dosyada 74 test başarılı.
- `npm run build` ve `npm run build:studio`: başarılı. Büyük `heic2any` parçası için Vite boyut uyarısı sürüyor; build hatası değil.
- `npm run test:e2e`: Chrome üzerinde çoklu beden–sepet indirimi, 390 px mobil taşma, katman/şekil/görsel kalite kapısı, üretim PNG'si, eğri metin+font taslak geri yükleme, grup/grup çözme ve 1440 px masaüstü kontrolü başarıyla çalıştı.
- Font bağımlılıklarını kurarken `npm audit` dört mevcut geliştirme bağımlılığı uyarısı bildirdi (`@vitest/mocker`, `js-yaml`, `nanoid`, `vitest`). Otomatik toplu yükseltme yapılmadı; ayrı sürüm/güvenlik incelemesi gerekir.

## 4. Bilinçli olarak sonraki teslimatlara kalanlar

1. Maske, QR kod ve arka plan kaldırma: özellikle arka plan kaldırma için müşteri görsellerinin üçüncü tarafa gönderilip gönderilmeyeceği ve işlem maliyeti kararlaştırılmalı. Şüpheli kalite veren tek tıkla silme eklenmedi.
2. Hesaba kaydetmenin farklı cihazda geri açılması: API ve kullanıcı oturumu canlı alan adına bağlı. Kod mevcut olsa da yerel test canlı hesap davranışını kanıtlamaz; ayrı staging/canlı kabul testi gerekir.
3. Yeni ürünler ve kol baskısı: tedarikçinin gerçek ürünleri, onaylı mockup'ları, her alanın fiziksel baskı ölçüsü, stok ve fiyat kuralları olmadan uydurulmadı.
4. WooCommerce/iyzico ve gerçek sipariş: bu turda bağlanmadı. Demo fiyat ve yerel sepet gerçek satış olarak sunulmamalı; sunucu tarafı doğrulama ve uçtan uca ödeme testi ayrı canlıya geçiş fazıdır.
5. Taslak kotası/IndexedDB geçişi ve daha geniş filtre/font kataloğu bu paketin dışında. Mevcut localStorage kaydı kota dolduğunda uyarı verir.

## 5. Kullanıcı incelemesi için adımlar

Yerel geliştirme sunucusu açıksa `http://192.168.3.10:5174/studio` üzerinden aynı ağdaki diğer bilgisayardan incelenebilir. Önce farklı beden adetleriyle sepeti, sonra katman/şekil/metin/görsel araçlarını ve 390 px mobil düzeni kontrol edin. Bu sunucu kapanırsa depo klasöründe `npm run dev` komutuyla tekrar açılır; Vite'ın gösterdiği güncel ağ adresi kullanılmalıdır.

İnceleme ve sonraki teslimatların onayı gelmeden commit, GitHub push, FTP aktarımı veya canlı site değişikliği yapılmayacak.
