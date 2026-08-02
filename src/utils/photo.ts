/**
 * A profile photo is stored inside the CV record in localStorage, which has a
 * ~4MB ceiling in practice. Two paths can produce an oversized photo:
 *
 *  - cropping an upload, where `react-easy-crop` reports the crop area in
 *    *source image* pixels, so a phone photo yields a ~3000px canvas;
 *  - recovering a photo from an imported PDF, which is whatever resolution the
 *    source PDF embedded.
 *
 * Encoding either at full resolution overflows the quota, the write fails, and
 * the user's work silently stops persisting. The photo only ever renders in a
 * 64px circle, so capping the encoded size costs nothing visually.
 */
export const PHOTO_MAX_DIMENSION = 512;

export const PHOTO_MIME_TYPE = 'image/jpeg';

export const PHOTO_QUALITY = 0.85;

export interface PhotoDimensions {
  width: number;
  height: number;
}

const isUsable = (value: number) => Number.isFinite(value) && value > 0;

/**
 * Caps the longest side at {@link PHOTO_MAX_DIMENSION}, preserving aspect
 * ratio. Never upscales.
 */
export const getPhotoOutputDimensions = (
  width: number,
  height: number,
): PhotoDimensions => {
  if (!isUsable(width) || !isUsable(height)) {
    return { width: PHOTO_MAX_DIMENSION, height: PHOTO_MAX_DIMENSION };
  }
  const longest = Math.max(width, height);
  if (longest <= PHOTO_MAX_DIMENSION) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = PHOTO_MAX_DIMENSION / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/**
 * Square edge length to encode a crop at. The crop modal is square by
 * construction, so a single dimension is enough there.
 */
export const getPhotoOutputSize = (
  cropWidth: number,
  cropHeight: number,
): number => {
  const source = Math.max(cropWidth, cropHeight);
  if (!isUsable(source)) return PHOTO_MAX_DIMENSION;
  return getPhotoOutputDimensions(source, source).width;
};

/**
 * Encodes a canvas as a compact photo data URL, downscaling first when it
 * exceeds the cap. JPEG carries no alpha, so transparent areas become white.
 */
export const encodeCanvasAsPhoto = (source: HTMLCanvasElement): string => {
  const { width, height } = getPhotoOutputDimensions(
    source.width,
    source.height,
  );
  const target = document.createElement('canvas');
  target.width = width;
  target.height = height;
  const context = target.getContext('2d');
  // Without a context there is no way to flatten alpha; encoding the source
  // directly is the only remaining option.
  if (!context) return source.toDataURL(PHOTO_MIME_TYPE, PHOTO_QUALITY);
  // Always composite onto white, even when no downscale is needed: JPEG has no
  // alpha channel and would otherwise render transparent areas black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(
    source,
    0,
    0,
    source.width,
    source.height,
    0,
    0,
    width,
    height,
  );
  return target.toDataURL(PHOTO_MIME_TYPE, PHOTO_QUALITY);
};
