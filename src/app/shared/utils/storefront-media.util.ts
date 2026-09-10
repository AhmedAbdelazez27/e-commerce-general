import { resolveAttachmentUrlOptional } from '../../core/utils/attachment-url.util';

export type StorefrontMediaType = 'Image' | 'Video' | 'Model3D';

const MODEL_3D_FILE = /\.(glb|gltf|usdz)(\?|#|$)/i;
const GLB_FILE = /\.(glb|gltf)(\?|#|$)/i;
const USDZ_FILE = /\.usdz(\?|#|$)/i;

export function normalizeStorefrontMediaType(
  raw: string | null | undefined,
): StorefrontMediaType {
  const value = raw?.trim().toLowerCase() ?? '';
  if (value === 'video') {
    return 'Video';
  }
  if (value === 'model3d' || value === 'model-3d' || value === '3d') {
    return 'Model3D';
  }
  return 'Image';
}

export function isStorefront3DAssetUrl(url: string | null | undefined): boolean {
  return MODEL_3D_FILE.test(url?.trim() ?? '');
}

export function isStorefrontGlbUrl(url: string | null | undefined): boolean {
  return GLB_FILE.test(url?.trim() ?? '');
}

export function isStorefrontUsdzUrl(url: string | null | undefined): boolean {
  return USDZ_FILE.test(url?.trim() ?? '');
}

export function resolveStorefrontMediaUrl(
  mediaType: StorefrontMediaType,
  mediaUrl?: string | null,
  videoUrl?: string | null,
): string | undefined {
  if (mediaType === 'Image') {
    return undefined;
  }
  const value = mediaUrl?.trim() || videoUrl?.trim();
  return value || undefined;
}

/** Poster/thumbnail for lists, cards, and cart — never a GLB/GLTF/USDZ file. */
export function resolveProductPosterUrl(url?: string | null): string | undefined {
  const resolved = resolveAttachmentUrlOptional(url);
  if (!resolved || isStorefront3DAssetUrl(resolved)) {
    return undefined;
  }
  return resolved;
}

export interface Model3dViewerSources {
  /** Desktop/Android scene: `.glb` / `.gltf`. */
  src?: string;
  /** iOS AR Quick Look: `.usdz`. */
  iosSrc?: string;
}

/**
 * Pick 3D files by extension from the public media payload.
 * PNG/JPG posters are never used as the 3D scene.
 */
export function resolveModel3dViewerSources(input: {
  mediaUrl?: string | null;
  iosMediaUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
}): Model3dViewerSources {
  const urls = [input.mediaUrl, input.iosMediaUrl, input.imageUrl, input.videoUrl]
    .map((url) => resolveAttachmentUrlOptional(url))
    .filter((url): url is string => !!url);

  const glb = urls.find((url) => isStorefrontGlbUrl(url));
  const usdz = urls.find((url) => isStorefrontUsdzUrl(url));

  return {
    src: glb ? toSameOrigin3dUrl(glb) : undefined,
    iosSrc: usdz ? toSameOrigin3dUrl(usdz) : undefined,
  };
}

/** model-viewer fetches GLB/USDZ via XHR, so localhost needs a same-origin path. */
function toSameOrigin3dUrl(url: string): string {
  if (typeof window === 'undefined') {
    return url;
  }

  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return url;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (!isStorefront3DAssetUrl(parsed.pathname)) {
      return url;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}
