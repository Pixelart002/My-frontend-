import { describe, expect, it } from 'vitest';
import { qrCodeImageSource } from './AdminMfaGate';

describe('qrCodeImageSource', () => {
  it('converts Supabase raw SVG QR output into an image data URL', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';

    expect(qrCodeImageSource(svg)).toBe(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );
  });

  it('keeps an existing image data URL unchanged', () => {
    const dataUrl = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E';

    expect(qrCodeImageSource(dataUrl)).toBe(dataUrl);
  });
});
