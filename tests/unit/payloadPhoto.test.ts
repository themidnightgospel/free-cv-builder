import { describe, expect, it } from 'vitest';
import {
  encodeCvPayloadForText,
  payloadDeclaresNoPhoto,
} from '../../src/pdf/encodeCvPayload';
import { createInitialCv } from '../../src/state/cvModel';

const encodeCvWithPhoto = (photoDataUrl: string | null) => {
  const cv = createInitialCv();
  return encodeCvPayloadForText({
    ...cv,
    personalInfo: { ...cv.personalInfo, photoDataUrl },
  });
};

describe('photo flag in the embedded CV payload', () => {
  it('records that a CV has a photo, without embedding the photo itself', () => {
    const text = encodeCvWithPhoto('data:image/jpeg;base64,AAAA');
    expect(JSON.parse(text).hasPhoto).toBe(true);
    expect(text).not.toContain('data:image');
    expect(payloadDeclaresNoPhoto(text)).toBe(false);
  });

  it('records that a CV has no photo', () => {
    const text = encodeCvWithPhoto(null);
    expect(JSON.parse(text).hasPhoto).toBe(false);
    expect(payloadDeclaresNoPhoto(text)).toBe(true);
  });
});

describe('payloadDeclaresNoPhoto', () => {
  it('is true only when the payload says there was no photo', () => {
    expect(payloadDeclaresNoPhoto('{"v":1,"hasPhoto":false}')).toBe(true);
    expect(payloadDeclaresNoPhoto('{"v":1,"hasPhoto":true}')).toBe(false);
  });

  it('is false for payloads from before the flag existed', () => {
    expect(payloadDeclaresNoPhoto('{"v":1}')).toBe(false);
  });

  it('is false for text that is not JSON', () => {
    expect(payloadDeclaresNoPhoto('not json')).toBe(false);
  });
});
