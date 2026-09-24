import { describe, expect, it } from 'vitest';

import {
  qrCodeImageSource,
} from './AdminMfaGate';

describe('qrCodeImageSource', () => {
  it('converts raw SVG QR output into an image data URL', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
    
    expect(
      qrCodeImageSource(svg),
    ).toBe(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );
  });
  
  it('converts XML-declared SVG QR output into an image data URL', () => {
    const svg =
      '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
    
    expect(
      qrCodeImageSource(svg),
    ).toBe(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );
  });
  
  it('keeps an existing image data URL unchanged', () => {
    const dataUrl =
      'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E';
    
    expect(
      qrCodeImageSource(dataUrl),
    ).toBe(dataUrl);
  });
  
  it('trims surrounding whitespace before processing', () => {
    const svg =
      '  <svg><rect width="10" height="10"/></svg>  ';
    
    expect(
      qrCodeImageSource(svg),
    ).toBe(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svg.trim(),
      )}`,
    );
  });
  
  it('returns an empty string for empty input', () => {
    expect(
      qrCodeImageSource(''),
    ).toBe('');
    
    expect(
      qrCodeImageSource('   '),
    ).toBe('');
  });
  
  it('returns an empty string for non-string input', () => {
    expect(
      qrCodeImageSource(null),
    ).toBe('');
    
    expect(
      qrCodeImageSource(undefined),
    ).toBe('');
    
    expect(
      qrCodeImageSource({}),
    ).toBe('');
    
    expect(
      qrCodeImageSource(123),
    ).toBe('');
  });
  
  it('preserves a normal QR image URL', () => {
    const url =
      'https://example.com/qr-code.svg';
    
    expect(
      qrCodeImageSource(url),
    ).toBe(url);
  });
  
  it('preserves an existing raster image data URL', () => {
    const dataUrl =
      'data:image/png;base64,abc123';
    
    expect(
      qrCodeImageSource(dataUrl),
    ).toBe(dataUrl);
  });
});