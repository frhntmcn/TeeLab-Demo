import { describe, expect, it } from 'vitest';
import { cloneTemplateDocument, designTemplates } from './designTemplates';

describe('design templates', () => {
  it('defines the six approved Fabric templates without external assets', () => {
    expect(designTemplates.map((template) => template.name)).toEqual([
      'Büyük Başlık', 'İki Satır Mesaj', 'Merkez Sembol', 'Rozet Kompozisyonu', 'Ön Cep / Arka Mesaj', 'Tipografik Poster',
    ]);
    expect(designTemplates.every((template) => template.document.version === '7.4.0')).toBe(true);
    expect(designTemplates.every((template) => template.document.objects.length > 0)).toBe(true);
    expect(JSON.stringify(designTemplates)).not.toMatch(/https?:|<svg/i);
  });

  it('clones template documents before editing', () => {
    const clone = cloneTemplateDocument(designTemplates[0]);
    (clone.objects[0] as { text: string }).text = 'Değişti';
    expect((designTemplates[0].document.objects[0] as { text: string }).text).toBe('KENDİN OL');
  });
});
