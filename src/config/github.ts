export const GITHUB_REPO_SLUG = 'themidnightgospel/free-cv-builder';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_SLUG}`;

// Injected by Vite's `define` at build time (see vite.config.ts) so visitors
// never hit api.github.com from the browser. Typed as `unknown` because the
// replacement is absent under Vitest, where the identifier stays unbound.
declare const __GITHUB_STARS__: unknown;

const resolveStarCount = (): number | null => {
  // `typeof` on an unbound identifier is safe; a bare reference would throw.
  if (typeof __GITHUB_STARS__ !== 'number') return null;
  return __GITHUB_STARS__;
};

export const GITHUB_STAR_COUNT = resolveStarCount();

export const formatStarCount = (count: number): string =>
  count >= 1000
    ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : String(count);
