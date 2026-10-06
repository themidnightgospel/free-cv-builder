/**
 * Short, readable text for a link: just its domain, without "www.".
 * Full addresses wrap badly in the narrow CV header, and the link itself still
 * carries the full address. Text that is not a URL is returned as typed.
 */
export const getLinkDisplayName = (value: string): string => {
  const trimmed = value.trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const { hostname } = new URL(withProtocol);
    if (!hostname.includes('.')) return trimmed;
    return hostname.replace(/^www\./i, '');
  } catch {
    return trimmed;
  }
};
