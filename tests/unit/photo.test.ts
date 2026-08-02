import { describe, expect, it } from 'vitest';
import {
  PHOTO_MAX_DIMENSION,
  getPhotoOutputDimensions,
  getPhotoOutputSize,
} from '../../src/utils/photo';

describe('getPhotoOutputSize', () => {
  it('caps a phone-camera crop so the encoded photo stays small', () => {
    // A 12MP phone photo cropped square gives ~3024px of source pixels.
    expect(getPhotoOutputSize(3024, 3024)).toBe(PHOTO_MAX_DIMENSION);
  });

  it('caps using the larger of the two crop dimensions', () => {
    expect(getPhotoOutputSize(4000, 120)).toBe(PHOTO_MAX_DIMENSION);
  });

  it('never upscales a small crop', () => {
    expect(getPhotoOutputSize(200, 200)).toBe(200);
    expect(getPhotoOutputSize(120, 90)).toBe(120);
  });

  it('falls back to the cap for degenerate crop areas', () => {
    expect(getPhotoOutputSize(0, 0)).toBe(PHOTO_MAX_DIMENSION);
    expect(getPhotoOutputSize(Number.NaN, 10)).toBe(PHOTO_MAX_DIMENSION);
  });

  it('keeps the cap small enough to fit many CVs in localStorage', () => {
    expect(PHOTO_MAX_DIMENSION).toBeLessThanOrEqual(512);
  });
});

// Photos recovered from an imported PDF are whatever shape the source PDF
// embedded, so they cannot be squashed into a square.
describe('getPhotoOutputDimensions', () => {
  it('caps a large square image', () => {
    expect(getPhotoOutputDimensions(3000, 3000)).toEqual({
      width: PHOTO_MAX_DIMENSION,
      height: PHOTO_MAX_DIMENSION,
    });
  });

  it('preserves aspect ratio for a wide image', () => {
    expect(getPhotoOutputDimensions(4000, 2000)).toEqual({
      width: PHOTO_MAX_DIMENSION,
      height: PHOTO_MAX_DIMENSION / 2,
    });
  });

  it('preserves aspect ratio for a tall image', () => {
    expect(getPhotoOutputDimensions(2000, 4000)).toEqual({
      width: PHOTO_MAX_DIMENSION / 2,
      height: PHOTO_MAX_DIMENSION,
    });
  });

  it('never upscales an already-small image', () => {
    expect(getPhotoOutputDimensions(300, 200)).toEqual({
      width: 300,
      height: 200,
    });
  });

  it('never collapses a very thin image to zero', () => {
    const { width, height } = getPhotoOutputDimensions(4000, 3);
    expect(width).toBe(PHOTO_MAX_DIMENSION);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it('falls back to the cap for degenerate input', () => {
    expect(getPhotoOutputDimensions(0, 0)).toEqual({
      width: PHOTO_MAX_DIMENSION,
      height: PHOTO_MAX_DIMENSION,
    });
    expect(getPhotoOutputDimensions(Number.NaN, 10)).toEqual({
      width: PHOTO_MAX_DIMENSION,
      height: PHOTO_MAX_DIMENSION,
    });
  });
});
