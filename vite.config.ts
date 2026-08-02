import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const GITHUB_REPO_SLUG = 'themidnightgospel/free-cv-builder';

// Resolved once at build time and inlined, so the star buttons never make a
// request to api.github.com from a visitor's browser. The count therefore only
// refreshes on deploy, which is the trade we want for not leaking visitor IPs.
const fetchStarCount = async (): Promise<number | null> => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_SLUG}`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === 'number'
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
};

export default defineConfig(async () => {
  const stars = await fetchStarCount();
  if (stars === null) {
    console.warn(
      '[vite] GitHub star count unavailable — star buttons will render without a count.',
    );
  }

  return {
    plugins: [react()],
    // Must match the GitHub repo name for project pages
    base: '/',
    define: {
      __GITHUB_STARS__: JSON.stringify(stars),
    },
  };
});
