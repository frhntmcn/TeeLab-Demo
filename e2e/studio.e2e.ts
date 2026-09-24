import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('fit changes front and back mockups in every studio step', async ({ page }) => {
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  const front = page.locator('.product-step-mockups .mockup-base').first();
  const slimImage = await front.getAttribute('src');
  await page.getByRole('button', { name: 'Oversize' }).click();
  await expect(front).not.toHaveAttribute('src', slimImage!);
  await expect(front).toHaveAttribute('src', /front-white-oversize/);
  await page.getByRole('spinbutton', { name: 'S beden adedi' }).fill('1');
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await expect(page.locator('.design-canvas .mockup-base')).toHaveAttribute('src', /front-white-oversize/);
  await page.getByRole('button', { name: 'Arka yüz' }).click();
  await expect(page.locator('.design-canvas .mockup-base')).toHaveAttribute('src', /back-white-oversize/);
  await page.getByRole('button', { name: 'Önizlemeye geç' }).click();
  await expect(page.locator('.preview-gallery .mockup-base').first()).toHaveAttribute('src', /front-white-oversize/);
});

test('cart works when randomUUID is unavailable on an insecure local-network origin', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true }); });
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  await page.getByRole('spinbutton', { name: 'M beden adedi' }).fill('1');
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.getByRole('button', { name: 'Önizlemeye geç' }).click();
  await page.getByRole('button', { name: 'Sepete ekle' }).click();
  await expect(page.getByRole('link', { name: 'Sepete git' })).toBeVisible();
  await page.getByRole('link', { name: 'Sepete git' }).click();
  await expect(page.locator('.cart-line')).toHaveCount(1);
});

test('long uploaded filenames wrap without horizontal tool-panel scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.getByText('Kendi görselin', { exact: true }).click();
  const filename = `${'cok-uzun-dosya-adi-'.repeat(8)}.png`;
  await page.locator('.upload-zone input[type="file"]').setInputFiles({ name: filename, mimeType: 'image/png', buffer: readFileSync('public/og-card.png') });
  await expect(page.locator('.selection-card--context summary')).toHaveText(filename);
  const panel = await page.locator('.design-tools').evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(panel.scroll).toBeLessThanOrEqual(panel.client + 1);
});

test('one design supports multiple sizes and a pooled cart discount', async ({ page }) => {
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  await page.getByRole('spinbutton', { name: 'M beden adedi' }).fill('3');
  await page.getByRole('spinbutton', { name: 'XL beden adedi', exact: true }).fill('2');
  await expect(page.getByText('Toplam: 5 adet')).toBeVisible();
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.locator('.tool-section__summary').getByText('Metin', { exact: true }).click();
  await page.getByRole('button', { name: 'Metin ekle' }).click();
  await page.getByRole('button', { name: 'Önizlemeye geç' }).click();
  await expect(page.getByText('M: 3 · XL: 2 (5 adet)')).toBeVisible();
  await page.getByRole('button', { name: 'Sepete ekle' }).click();
  await page.getByRole('link', { name: 'Sepete git' }).click();
  await expect(page.locator('.cart-line')).toHaveCount(2);
  await expect(page.locator('.checkout-total')).toContainText('₺');
});

test('studio has usable mobile width and design tools', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await expect(page.getByRole('button', { name: 'Araçlara geç' })).toBeVisible();
  await expect(page.locator('.studio-layers')).not.toHaveAttribute('open', '');
  await page.getByText('Katmanlar', { exact: true }).click();
  await expect(page.locator('.studio-layers')).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Yakınlaştır', exact: true }).click();
  await expect(page.getByText('%125')).toBeVisible();
  await page.getByRole('button', { name: 'Tuvale sığdır' }).click();
  await expect(page.getByText('%100')).toBeVisible();
  await page.screenshot({ path: 'test-results/studio-mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('layers, shapes, image crop and filters keep the quality gate', async ({ page }) => {
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.getByText('Şekiller', { exact: true }).click();
  await page.getByRole('button', { name: 'Daire', exact: true }).click();
  await page.getByText('Katmanlar', { exact: true }).click();
  await expect(page.locator('.studio-layers li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Daire gizle' }).click();
  await expect(page.getByText('Ön yüz').first()).toBeVisible();
  await page.getByRole('button', { name: 'Daire göster' }).click();
  await page.getByRole('button', { name: 'Daire', exact: true }).last().click();
  await page.getByText('Nesne düzenleme', { exact: true }).click();
  await page.getByRole('button', { name: 'Çoğalt' }).click();
  await expect(page.locator('.studio-layers li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Geri al' }).click();
  await expect(page.locator('.studio-layers li')).toHaveCount(1);
  await page.locator('.upload-zone input[type="file"]').setInputFiles('public/og-card.png');
  await page.getByText('Görsel düzenleme', { exact: true }).click();
  await expect(page.locator('.studio-image-tools')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Siyah-beyaz' }).check();
  await expect(page.getByRole('checkbox', { name: 'Siyah-beyaz' })).toBeChecked();
  await page.locator('.studio-image-tools input[type="range"]').first().fill('10');
  await expect(page.getByText('Kenarları simetrik kırp · %10')).toBeVisible();
  await page.locator('.studio-image-tools input[type="range"]').first().fill('40');
  await page.getByRole('button', { name: 'Önizlemeye geç' }).click();
  await expect(page.getByRole('alert')).toContainText('200 PPI');
});

test('production PNG keeps the physical print dimensions and transparency', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/studio');
  const result = await page.evaluate(async () => {
    const importer = new Function('url', 'return import(url)') as (url: string) => Promise<{ exportProductionPng: (document: unknown) => Promise<Blob> }>;
    const { exportProductionPng } = await importer('/src/lib/productionExport.ts');
    const blob = await exportProductionPng({ version: '7.4.0', objects: [{ type: 'Rect', width: 60, height: 60, left: 100, top: 100, fill: '#7c3aed' }] });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const width = new DataView(bytes.buffer).getUint32(16);
    const height = new DataView(bytes.buffer).getUint32(20);
    const resolutionChunk = new TextDecoder().decode(bytes.slice(37, 41));
    const image = await createImageBitmap(blob);
    const sample = document.createElement('canvas'); sample.width = 1; sample.height = 1;
    const context = sample.getContext('2d')!; context.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 1);
    return { width, height, resolutionChunk, mime: blob.type, topLeftAlpha: context.getImageData(0, 0, 1, 1).data[3] };
  });
  expect(result).toEqual({ width: 3543, height: 4724, resolutionChunk: 'pHYs', mime: 'image/png', topLeftAlpha: 0 });
});

test('curved text is saved and restored in the local draft', async ({ page }) => {
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.locator('.tool-section__summary').getByText('Metin', { exact: true }).click();
  await page.getByRole('button', { name: 'Metin ekle' }).click();
  await page.getByRole('combobox', { name: 'Yazı tipi' }).selectOption('Montserrat');
  await page.getByLabel(/Metin kavisi/).fill('40');
  await expect(page.getByText('Metin kavisi · 40')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const key = Object.keys(localStorage).find((entry) => entry.endsWith('.demo.draft.v1'));
    if (!key) return undefined;
    return JSON.parse(localStorage.getItem(key) ?? '{}').documents?.front?.objects?.[0]?.textCurve;
  })).toBe(40);
  await page.reload();
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.getByText('Katmanlar', { exact: true }).click();
  await page.locator('.studio-layers__name').first().click();
  await page.locator('.tool-section__summary').getByText('Metin', { exact: true }).click();
  await expect(page.getByText('Metin kavisi · 40')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Yazı tipi' })).toHaveValue('Montserrat');
});

test('vector layers can be grouped and ungrouped', async ({ page }) => {
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.getByText('Şekiller', { exact: true }).click();
  await page.getByRole('button', { name: 'Daire', exact: true }).click();
  for (let index = 0; index < 9; index += 1) await page.keyboard.press('Shift+ArrowLeft');
  await page.getByRole('button', { name: 'Üçgen', exact: true }).click();
  const canvas = page.locator('.upper-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await canvas.click({ position: { x: box!.width * 0.25, y: box!.height * 0.5 } });
  await canvas.click({ position: { x: box!.width * 0.5, y: box!.height * 0.5 }, modifiers: ['Shift'] });
  await page.getByText('Katmanlar', { exact: true }).click();
  await page.getByRole('button', { name: 'Grupla', exact: true }).click();
  await expect(page.locator('.studio-layers li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Grubu çöz' }).click();
  await expect(page.locator('.studio-layers li')).toHaveCount(2);
});

test('desktop editor remains within a 1440 px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Yalnızca gerekli' }).click();
  await page.getByRole('button', { name: 'Tasarıma geç' }).click();
  await page.locator('.tool-section__summary').getByText('Metin', { exact: true }).click();
  await page.getByRole('button', { name: 'Metin ekle' }).click();
  await expect(page.locator('.studio-live-price')).toContainText('₺');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'test-results/studio-desktop.png' });
});
