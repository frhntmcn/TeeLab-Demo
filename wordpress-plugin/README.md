# Maymoon Commerce Bridge

Bu eklenti, React mağazası ile aynı alan adındaki WordPress/WooCommerce oturumunu birbirine bağlamak için hazırlanmıştır.

## Bu sürüm ne yapar?

- `/yonetim` için yalnızca `shop_manager` veya yönetici yetkisi olan kullanıcıların girişini doğrular.
- Canlı alan adında müşteri kaydı, giriş, oturum kontrolü, profil/adres, kendi sipariş geçmişi ve parola sıfırlama uçları sağlar.
- Müşteri tasarımlarını kullanıcı hesabına özel WordPress kullanıcı verisinde saklar (25 tasarım, 2 MB/tasarım sınırı).
- Sepet teklifini WooCommerce ürün/varyant fiyatı ve stok üzerinden sunucuda doğrular.
- React yönetim paneline mağaza yöneticisi oturumu ile WooCommerce siparişlerini okuma ve durum güncelleme uçları sağlar.
- Store API uyumlu WordPress REST nonce aktarımını oturum yanıtlarına ekler.
- React uygulaması ödeme entegrasyonu ve uçtan uca kabul testleri tamamlanmadan canlıda sipariş/ödeme oluşturmaz.

## Kurulum

1. `maymoon-commerce-bridge.php` dosyasını `wp-content/plugins/maymoon-commerce-bridge/` klasörüne yükleyin.
2. WordPress Yönetim Paneli → Eklentiler bölümünden **Maymoon Commerce Bridge** eklentisini etkinleştirin.
3. Gizli sekmede şu iki adresi kontrol edin:
   - `https://maymoon.com.tr/wp-json/maymoon/v1/session`
   - `https://maymoon.com.tr/wp-json/maymoon/v1/account/session`
4. Her ikisinin de `{"authenticated":false}` dönmesi beklenir. Bu, eklentinin çalıştığını; fakat ziyaretçinin oturum açmadığını gösterir.
5. Yetkili yönetici girişi sonrasında `/wp-json/maymoon/v1/admin/orders` WooCommerce siparişlerini JSON olarak döndürmelidir.

## Güvenli çalışma notları

- iyzico anahtarları, SMTP şifresi veya WooCommerce API anahtarları bu dosyaya ya da React projesine yazılmaz.
- Bu eklenti WordPress'in kendi parola saklama ve çerez oturum sistemini kullanır; parola kaydetmez.
- Şifre sıfırlama e-postasının gerçekten ulaşması, WooCommerce/WordPress e-posta ayarları ve güvenilir SMTP kurulmadan kabul edilmiş sayılmaz.
- Canlıya yüklemeden önce yedek alınmalı ve yönetici girişi ayrı bir gizli pencereyle test edilmelidir.

## Henüz bu sürüme dahil olmayanlar

- iyzico ödeme başlatma, 3D Secure dönüşü ve webhook/idempotency doğrulaması
- WooCommerce Store API üzerinden gerçek ödeme/checkout gönderimi ve sevkiyat hesaplama
- e-posta doğrulama
- React yönetim panelinden WooCommerce ürün/stok/fiyat yazma
- sipariş tasarımının kalıcı dosya deposuna ve üretim kuyruğuna aktarımı

PHP eklentisi canlıya taşınmadan önce PHP 7.4+ sözdizim kontrolü, WordPress/WooCommerce test ortamı ve rol/nonce testleri çalıştırılmalıdır. React testleri PHP çalışma zamanını doğrulamaz.

Bu özellikler yalnızca ilgili ödeme, SMTP ve WooCommerce testleri tamamlandıktan sonra açılacaktır.
