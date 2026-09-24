# Maymoon — Yerel teknik uygulama raporu

Tarih: 22 Eylül 2026
Kapsam: karşılaştırma raporlarındaki geliştirme önerilerinin yerelde uygulanabilir ve doğrulanabilir kısımları.
Yayın durumu: **yalnızca yerel çalışma ağacı**. GitHub'a push/merge ve canlıya yayın yapılmadı.

## Yönetici özeti

Proje satışa hazır bir WooCommerce/iyzico mağazasına dönüştürülmüş değildir. Bu turda mağaza ve yönetim deneyiminin güvenli yerel temeli, bilgi/müşteri/stüdyo ekranlarının entegrasyon hazırlığı, katalog araması, erişilebilir beden rehberi, SEO temel dosyaları ve üretim önizleme çıktıları tamamlandı. Gerçek ödeme ve sipariş açma bilerek kapalı bırakıldı; doğrulanmamış gateway uyumluluğu, kargo/vergi/hukuk bilgisi veya üretim gereksinimleri varmış gibi gösterilmedi.

## Aşamalar ve sonuçlar

### 1. Mağaza güvenilirliği ve katalog deneyimi

- Katalog arama artık ürün adı/açıklamasında Türkçe normalizasyonla filtreliyor; fiyat artan/azalan sıralama eklendi.
- Beden rehberi, S–XXL aralığıyla erişilebilir modal olarak açılıp kapanıyor. Tedarikçi tarafından doğrulanmayan mevcut örnek ölçülerin taahhüt olmadığı belirtiliyor.
- Ürün detayındaki doğrulanmamış gramaj, baskı yöntemi ve teslim süresi gibi iddialar kaldırıldı; metinler bilinen arayüz davranışlarına ve açık belirsizlik notlarına çekildi.
- Ana sayfa, hakkımızda, iletişim, SSS ve kurumsal teklif rotalarının navigasyonu tamamlandı. Teklif formu boy/adet matrisi üretip kullanıcının e-posta uygulamasında taslak açar; sunucuya otomatik göndermez.
- Görünen kurumsal iletişim yalnızca yapılandırılmış marka e-postasına dayanıyor; telefon/adres uydurulmadı.

### 2. Müşteri hesabı ve tasarımları

- WordPress bridge eklentisine hesap kayıt/giriş/çıkış, oturum, profil-adres, sipariş geçmişi ve parola sıfırlama isteklerinin React tarafı bağlandı.
- REST nonce, oturum ve korumalı isteklerde aktarılıyor; parola React/localStorage içine yazılmıyor.
- Müşteri tasarım listesi, silme ve stüdyoda tekrar açma eklendi. WordPress eklentisi tasarımları oturum açmış kullanıcıya özel user meta'da sınırlı sayıda/boyutta saklıyor.
- Yalnız WordPress oturumu ve ilgili yetkili rolü, bridge API'de işlem yapabilir. Gerçek Natro ortamında bu eklenti kurulup sınanmadı.

### 3. WooCommerce teklif ve sipariş yönetimi hazırlığı

- Sepet sayfası, gerçek alan adında standart katalog ürünleri için WooCommerce'den sunucu tarafı fiyat/stok teklifi isteyip toplamı gösteriyor.
- Özel tasarımlı ürünlerde sipariş API'si hazır olmadığı için canlı sipariş oluşturma sunulmuyor; yerel/demo akışı gerçek siparişmiş gibi sunulmuyor.
- Bridge, yetkili mağaza yöneticisi için gerçek WooCommerce siparişlerini listeleme ve desteklenen durumları güncelleme uçlarını sağlıyor. Canlı hostname'deki admin paneli bu uçları kullanacak şekilde bağlandı.
- Gerçek WooCommerce sipariş durumu `paid` olarak izleniyor; canlı satış özeti gün içindeki ödenmiş siparişlerden hesaplanıyor.
- React panelinden canlı ürün, stok ve fiyat yazımı özellikle yok. Ürün/stok için WooCommerce tek gerçek kaynak olarak kalmalı.

### 4. Tasarım dosyası ve üretime hazırlık

- Ön/arka Fabric tasarım JSON'ları ve ölçüm bilgileri `productionSnapshot` olarak korunacak şekilde mevcut tasarım sipariş meta hazırlığı eklendi.
- Stüdyodan giriş yapan müşteri named design kaydedip hesabından geri açabiliyor.
- Yönetim/sipariş penceresinden ön ve arka yüz ayrı PNG dışa aktarımı eklendi: 30×40 cm, 300 DPI hedefi (3543×4724 px), PNG pHYs çözünürlük metaverisi yazılıyor.
- Bu çıktılar şu an tarayıcıya indirilir; siparişe yüklenmez ve kalıcı üretim depolaması değildir. ICC renk profili, bleed/taşma, baskı kalıbı veya üretici teknik kabulü garanti edilmez.
- Üretim kuyruğu, otomatik atölye e-postası, takip numarası ve durum orkestrasyonu canlı iş akışına bağlanmadı.

### 5. SEO, gizlilik ve güven sınırları

- Route bazında başlık/açıklama/canonical/OG/Twitter metadata eklendi.
- `robots.txt` yönetim, hesap, sepet ve stüdyo gibi özel rotaları engelliyor; `sitemap.xml` ana, ürün ve bilgi rotalarını listeliyor.
- React SPA olduğundan metadata ve ürün yapılandırılmış verisi istemci tarafında kalır; SSR/prerender ve dinamik WooCommerce sitemap senkronizasyonu yoktur.
- Hukuki/mahremiyet sayfaları taslak olarak işaretli; çerez tercihleri saklanıyor ve rıza verilmeden analitik/pazarlama izleyicisi başlatılmıyor.
- Gerçek şirket kimliği, adres, telefon, teslimat/iade taahhüdü veya hukuki metin oluşturulmadı.

### 6. Test otomasyonu ve dokümantasyon

- GitHub Actions kalite workflow'una WordPress eklentisi için PHP sözdizim kontrol işi eklendi. Bu workflow remote'da çalıştırılmadı; push yapılmadı.
- PHP 7.4 uyumluluğu yerelde parser ile kontrol edildi. Yerel ortamda tam PHP/WordPress çalışma zamanı olmadığı için bu yalnızca gramer kontrolüdür.
- `docs/COMMERCE_TRANSITION_READINESS.md` yerel teslimin ve canlı önkoşullarının güncel gerçekliğiyle yenilendi.

## Canlı ödeme/sipariş neden tamamlandı sayılmıyor?

WooCommerce Store API dokümanı sepet/checkout uçlarını tanımlar; bu tek başına kurulu iyzico eklentisinin Store API checkout ve 3D Secure dönüşleriyle uyumlu olduğunu ispatlamaz. Test hesabı/anahtarı ve hostingde staging erişimi olmadan sipariş açmak; ücret, stok, yasal kabul ve sipariş durumunu hatalı kaydedebilir. Bu nedenle kart verisi React uygulamasına alınmadı, iyzico anahtarları koda/repository'ye yazılmadı ve uçtan uca doğrulanmış ödeme yokken gerçek sipariş submit düğmesi açılmadı.

Canlı ödeme için iyzico WooCommerce eklentisinin staging/test modu, Store API uyumluluk testi, 3DS başarı/başarısızlık, webhook tekrarı/idempotency, sipariş e-postası, vergi/kargo ve stok iadesi kabul senaryoları gerekir.

## Test ve doğrulama

- `npm run lint` — başarılı.
- `npm test` — 25 test dosyası, 72 test başarılı.
- `npm run build` — başarılı; `heic2any` dönüştürme chunk'ı 1.35 MB için Vite uyarısı veriyor. Paket ilgili görsel akışında yüklenir; build başarısız değil.
- WordPress eklenti dosyası PHP 7.4 grameriyle ayrıştırıldı — başarılı. WordPress/WooCommerce runtime, REST izin/nonce ve hosting uyumluluk testi yapılmadı.
- `dist/robots.txt` ve `dist/sitemap.xml` build'de yer aldı.
- `git diff --check` — whitespace hata bulmadı.

## Sonraki adım / işletme ve dış sistemlerden gerekenler

1. Yerel diff ve raporu kullanıcıyla gözden geçir; kullanıcı onayı olmadan push yapma.
2. Natro yedeğiyle staging kopyası hazırla ve bridge eklentisini önce orada kur/etkinleştir.
3. WooCommerce'de ürün/varyasyon/fiyat/stok/görselleri kur; kargo, vergi ve SMTP'yi işletme verisiyle tamamla.
4. iyzico test hesabında gateway uyumunu ve e2e ödeme akışını doğrula.
5. Hukuk danışmanı/marka sahibinden gerçek şirket ve sözleşme metinlerini al; ölçü/kumaş/baskı/kargo iddialarını tedarikçi ile teyit et.
6. Tasarım dosyası kalıcı depolama/üretim kuyruğu ve yetkilerini kararlaştırıp staging'de sınamak; sonrasında canlıya geçiş için ayrıca onay almak.

## Sınırlar

Bu rapor teknik kod değişikliklerini özetler; hukuk, ödeme kuruluşu, Natro çalışma zamanı veya ticari operasyonlar için uygunluk/onay beyanı değildir. Bu turda canlı WordPress'e erişilmedi, dosya yüklenmedi, veri değiştirilmedi, GitHub'a commit/push/merge yapılmadı ve Vercel/Natro'ya deploy edilmedi.
