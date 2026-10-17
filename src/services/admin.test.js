import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('../api/client', () => ({
  request: mocks.request,
}));

import { adminService } from './admin';

describe('admin product image upload queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads every selected image sequentially and reports successful progress', async () => {
    let active = 0;
    let maxActive = 0;
    const uploadedNames = [];

    mocks.request.mockImplementation(async (_method, _path, form) => {
      active += 1;
      maxActive = Math.max(maxActive, active);

      const file = form.get('files');
      uploadedNames.push(file.name);
      await new Promise((resolve) => setTimeout(resolve, 1));

      active -= 1;
      return { ok: true, name: file.name };
    });

    const files = [
      new File(['one'], 'one.png', { type: 'image/png' }),
      new File(['two'], 'two.png', { type: 'image/png' }),
      new File(['three'], 'three.png', { type: 'image/png' }),
    ];
    const progress = [];

    const results = await adminService.uploadProductImages(
      'product-123',
      files,
      (entry) => progress.push({
        completed: entry.completed,
        total: entry.total,
        name: entry.file.name,
      }),
    );

    expect(maxActive).toBe(1);
    expect(uploadedNames).toEqual(['one.png', 'two.png', 'three.png']);
    expect(results).toHaveLength(3);
    expect(progress).toEqual([
      { completed: 1, total: 3, name: 'one.png' },
      { completed: 2, total: 3, name: 'two.png' },
      { completed: 3, total: 3, name: 'three.png' },
    ]);
    expect(mocks.request).toHaveBeenCalledTimes(3);
    expect(mocks.request).toHaveBeenNthCalledWith(
      1,
      'POST',
      '/products/product-123/images',
      expect.any(FormData),
    );
  });

  it('does not upload later files after a queue item fails', async () => {
    mocks.request
      .mockResolvedValueOnce({ ok: true, name: 'one.png' })
      .mockRejectedValueOnce(new Error('Storage temporarily unavailable'));

    const files = [
      new File(['one'], 'one.png', { type: 'image/png' }),
      new File(['two'], 'two.png', { type: 'image/png' }),
      new File(['three'], 'three.png', { type: 'image/png' }),
    ];
    const progress = [];

    await expect(
      adminService.uploadProductImages(
        'product-123',
        files,
        (entry) => progress.push(entry.file.name),
      ),
    ).rejects.toThrow('Storage temporarily unavailable');

    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(progress).toEqual(['one.png']);
    expect(mocks.request).toHaveBeenNthCalledWith(
      2,
      'POST',
      '/products/product-123/images',
      expect.any(FormData),
    );
  });

  it('does not issue requests for an empty queue', async () => {
    await expect(adminService.uploadProductImages('product-123', [])).resolves.toEqual([]);
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
