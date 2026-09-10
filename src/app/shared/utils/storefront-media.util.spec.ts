import { describe, expect, it } from 'vitest';

import {
  normalizeStorefrontMediaType,
  resolveStorefrontMediaUrl,
} from './storefront-media.util';

describe('storefront-media.util', () => {
  it('normalizes media type strings', () => {
    expect(normalizeStorefrontMediaType(null)).toBe('Image');
    expect(normalizeStorefrontMediaType('video')).toBe('Video');
    expect(normalizeStorefrontMediaType('Model3D')).toBe('Model3D');
    expect(normalizeStorefrontMediaType('image')).toBe('Image');
  });

  it('resolves media URLs for video and 3D only', () => {
    expect(resolveStorefrontMediaUrl('Image', 'http://x/a.glb', 'http://x/a.mp4')).toBeUndefined();
    expect(resolveStorefrontMediaUrl('Video', null, 'http://x/a.mp4')).toBe('http://x/a.mp4');
    expect(resolveStorefrontMediaUrl('Model3D', 'http://x/a.glb', null)).toBe('http://x/a.glb');
  });
});
