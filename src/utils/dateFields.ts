const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const FULL_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const getMonthInputValue = (value: string): string => {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (MONTH_REGEX.test(trimmed)) {
    return trimmed;
  }
  if (FULL_ISO_REGEX.test(trimmed)) {
    return trimmed.slice(0, 7);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const formatMonthForDisplay = (value: string): string => {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const isoMonth = MONTH_REGEX.test(trimmed)
    ? `${trimmed}-01`
    : FULL_ISO_REGEX.test(trimmed)
    ? trimmed
    : '';
  if (isoMonth) {
    const parsed = new Date(isoMonth);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      });
    }
  }
  return trimmed;
};
