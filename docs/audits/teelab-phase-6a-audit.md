# TeeLab — Faz 6A Son Ürün ve Görsel Kalite Audit’i

## 1. Audit commit/branch bilgisi

- İncelenen başlangıç SHA: `1e06521d3ca027108c1f568e20dcaa9b09173761`
- Audit branch: `codex/teelab-phase-6a`
- Uygulama kodu değiştirilmedi. Bu dosya audit artefact’ıdır.

## 2. İncelenen route’lar

- `/`
- `/koleksiyon/gece-yörüngesi`
- `/koleksiyon/anadolu-form`
- `/koleksiyon/mor-sinyal`
- `/studio`
- `/sepet`

## 3. Viewport kanıtları

| Viewport | Route kanıtı | innerWidth × innerHeight | clientWidth / scrollWidth | Console error |
| --- | --- | --- | --- | --- |
| 390×844 | Ana sayfa, ürün detay, Studio, sepet | 390×844 | 375 / 375 | 0 |
| 768×1024 | Ana sayfa, ürün detay, sepet | 768×1024 | 753 / 753 | 0 |
| 1280×844 | Ana sayfa, ürün detay, sepet | 1280×844 | 1265 / 1265 | 0 |

Tüm ölçülen route’larda yatay taşma görülmedi.

Tarayıcı kanıtları: `CUA-01` mobil hero, `CUA-02` mobil ürün detay, `CUA-03` Studio önizleme, `CUA-04` sepet/checkout, `CUA-05` mobil menü, `CUA-06` tablet hero, `CUA-07` desktop Mor Sinyal ürün detayı.

## 4. Ürün akışı bulguları

Hazır ürün akışı mobilde renk, beden, adet ve sepete ekleme ile çalıştı. Beyaz/XL seçilip adet 2 yapıldığında ürün fiyatı `₺1.298` oldu; ekleme sonrası canlı durum mesajı ve sepet sayacı güncellendi.

Studio’da şablon değişim onayı, iptal koruması, aktif yüz izolasyonu ve undo/redo durumları gözlendi. Özel tasarım önizleme ve sipariş özeti açıldı. Geçersiz checkout, alan bazlı hata mesajları ve ilk hataya odaklanma ile çalıştı.

## 5. Görsel kalite bulguları

### F6A-001

- Kategori: UX / Trust
- Öncelik: P1
- Route: `/studio`, `/sepet`
- Viewport: 768×1024
- Bulgu: Studio’daki adet alanı 50’ye kadar kabul ediyor; ancak sepet sınırı 25. Studio önizlemesi XL/Oversize için `50` adet ve `₺14.080` gösterdi, Sepete ekle sonrası sepet aynı satırı `25` adet ve birim `₺282` olarak gösterdi.
- Kanıt: `CUA-08`; Studio `input[max=50]`, `src/components/Studio.tsx:150`; sepet `MAX_CART_QUANTITY = 25` ve `mergeCartItem` clamp’i, `src/lib/cart.ts`.
- Kullanıcı etkisi: Kullanıcı özet ekranında gördüğü adet/fiyat ile sepetteki adet/fiyatın farklı olması nedeniyle sipariş güvenini kaybeder.
- Önerilen düzeltme: Studio adet üst sınırını ortak `MAX_CART_QUANTITY` değerine bağla veya 50 desteklenecekse sepet invariantını ve fiyat/merge yolunu uçtan uca aynı sınıra taşı.
- Kapsam riski: Medium

### F6A-002

- Kategori: UX / Content
- Öncelik: P2
- Route: `/studio`, `/koleksiyon/<slug>`
- Viewport: 390×844 / 1280×844
- Bulgu: Studio ürün seçiminde `XXL` var; hazır ürün detayında sadece S, M, L ve XL sunuluyor. Bu, aynı tişört ürünü için beden kullanılabilirliğini akışa göre değiştiriyor.
- Kanıt: `CUA-02` hazır ürün kontrol grubu S/M/L/XL; `CUA-03` Studio ürün grubu S/M/L/XL/XXL; `src/components/Studio.tsx:149`.
- Kullanıcı etkisi: Katalogdan Studio’ya geçen kullanıcı, beden kataloğunun hangisinin geçerli olduğunu anlayamaz.
- Önerilen düzeltme: Onaylı ortak beden kaynağını kullan; XXL ölçüsü doğrulanmış değilse Studio’dan kaldır.
- Kapsam riski: Low

### F6A-003

- Kategori: UX / Accessibility
- Öncelik: P2
- Route: `/studio`
- Viewport: 390×844
- Bulgu: Studio önizlemesindeki `Sepete ekle` eylemi başarılı olduğunda görünür veya canlı bir başarı geri bildirimi vermiyor ve Studio’da header sepet sayacı bulunmuyor.
- Kanıt: `CUA-03`; buton etkinleştirildiğinde aynı ekran aynı durumda kaldı, eklenen özel tasarım daha sonra `/sepet`te görüldü. Hazır ürün detayındaki karşılık eylem ise `role=status` mesajı gösteriyor.
- Kullanıcı etkisi: Kullanıcı eylemin tamamlanıp tamamlanmadığını anlayamadığı için tekrar ekleme yapabilir veya sepeti terk edebilir.
- Önerilen düzeltme: Studio’ya erişilebilir başarı durumu ve sepeti açan/özetleyen net bir sonraki adım ekle.
- Kapsam riski: Low

## 6. Responsive bulguları

Ölçülen 390×844, 768×1024 ve 1280×844 route’larında yatay taşma ya da console error yok. Faz 5C tablet hero düzeltmesi 768px’te görseli 661px container genişliği içinde tuttu.

## 7. Accessibility/trust bulguları

- Şablon değiştirme uygulama içi onay modalı ile açıkça açıklanıyor; iptal sonrası mevcut tasarım korunuyor.
- Hero ve mobil menü kontrolleri erişilebilir isimlerle görünür.
- Checkout ekranı, ödeme ve dış sisteme mesaj gönderilmediğini açıkça belirtiyor.
- F6A-003, Studio’daki eksik başarılı işlem geri bildirimi nedeniyle açık accessibility/UX bulgusudur.

## 8. Öncelik dağılımı

- P0: 0
- P1: 1
- P2: 2
- P3: 0

## 9. Önerilen Faz 6B kapsamı

1. Studio ve sepet için tek adet sınırı/fiyat kaynağı oluşturmak.
2. Studio ve hazır ürünler için tek beden kullanılabilirliği kaynağı oluşturmak.
3. Studio özel tasarım sepete ekleme sonrası erişilebilir başarı geri bildirimi ve net sonraki adım eklemek.

## 10. Kapsam dışı maddeler

- Gerçek ödeme, sipariş iletimi veya backend.
- Yeni ürün renkleri, yeni template’ler veya katalog genişletme.
- Faz 5A/5B/5C’nin tamamlanmış responsive, header ve carousel davranışlarının yeniden tasarımı.

## 11. Açık veya BLOCKED kanıtlar

- `prefers-reduced-motion: reduce` emülasyonu bu browser yüzeyinde desteklenmiyor; bu auditte gerçek emülasyon tekrarlanamadı. Kod yolu önceki Faz 5C incelemesinde mevcut olarak doğrulandı.
- Geçerli demo checkout’un son submit adımı, browser-local sepeti temizlediği için çalıştırılmadı. Bu yerel veri silme eylemi ayrıca açık onay gerektirir. Geçersiz form ve alan hata kanıtı alındı.
