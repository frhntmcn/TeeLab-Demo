import { describe, expect, it } from 'vitest';
import { detectUploadFormat, qualityForPpi, validateDimensions } from './imageValidation';

describe('image upload validation', () => {
  it('accepts PNG and JPEG signatures', () => {
    expect(detectUploadFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(detectUploadFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
  });
  it('rejects GIF and unknown content', () => {
    expect(detectUploadFormat(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBe('gif');
    expect(detectUploadFormat(new Uint8Array([1, 2, 3]))).toBe('unknown');
  });
  it('recognizes WebP and HEIC signatures without trusting the file name', () => {
    expect(detectUploadFormat(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe('webp');
    expect(detectUploadFormat(new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]))).toBe('heic');
  });
  it('enforces image dimensions and quality thresholds', () => {
    expect(validateDimensions(8001, 20)).toBe('dimensions');
    expect(validateDimensions(8000, 5001)).toBe('dimensions');
    expect(validateDimensions(8000, 5000)).toBeUndefined();
    expect(qualityForPpi(300)).toBe('suitable');
    expect(qualityForPpi(200)).toBe('warning');
    expect(qualityForPpi(199)).toBe('risk');
  });
});
