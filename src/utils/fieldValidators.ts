/**
 * Inline-field validators for the editor.
 * Each returns `null` when the value is acceptable (including empty),
 * or a short user-facing error string when invalid.
 */

const isEmpty = (value: string): boolean => value.trim().length === 0;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+\d\s().-]+$/;

export const validateOptionalEmail = (value: string): string | null => {
  if (isEmpty(value)) return null;
  if (!EMAIL_PATTERN.test(value.trim())) return 'Invalid email format';
  return null;
};

export const validateOptionalUrl = (value: string): string | null => {
  if (isEmpty(value)) return null;
  const trimmed = value.trim();
  const candidate = /^[a-z]+:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname.includes('.')) return 'Invalid URL';
    return null;
  } catch {
    return 'Invalid URL';
  }
};

export const validateOptionalLinkedIn = (value: string): string | null => {
  if (isEmpty(value)) return null;
  const urlError = validateOptionalUrl(value);
  if (urlError) return urlError;
  if (!/linkedin\.com/i.test(value)) return 'Should be a linkedin.com URL';
  return null;
};

export const validateOptionalPhone = (value: string): string | null => {
  if (isEmpty(value)) return null;
  const trimmed = value.trim();
  if (!PHONE_PATTERN.test(trimmed)) {
    return 'Use digits, +, -, (, ), spaces only';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return 'Phone number is too short';
  return null;
};
