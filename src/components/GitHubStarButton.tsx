import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  GITHUB_REPO_URL,
  GITHUB_STAR_COUNT,
  formatStarCount,
} from '../config/github';

type StarButtonVariant = 'hero' | 'footer' | 'header';

const BASE_CLASSNAMES =
  'group inline-flex shrink-0 items-center font-medium transition hover:border-accent/40 hover:bg-accent-soft/60';

const VARIANT_CLASSNAMES: Record<StarButtonVariant, string> = {
  hero: 'gap-2 rounded-full border border-slate-200 bg-paper/70 px-3.5 py-1.5 text-[12px] text-ink shadow-soft backdrop-blur',
  footer:
    'gap-1.5 rounded-full border border-slate-200 bg-paper px-3 py-1 text-[12px] text-ink',
  header:
    'gap-1.5 rounded-full border border-slate-200 bg-paper px-2.5 py-1 text-[11px] text-ink',
};

const ICON_CLASSNAMES: Record<StarButtonVariant, string> = {
  hero: 'h-3.5 w-3.5',
  footer: 'h-3.5 w-3.5',
  header: 'h-3 w-3',
};

interface GitHubStarButtonProps {
  variant: StarButtonVariant;
  /** Drops the label below `sm`, where the builder header runs out of room. */
  hideLabelOnMobile?: boolean;
}

export const GitHubStarButton: React.FC<GitHubStarButtonProps> = ({
  variant,
  hideLabelOnMobile = false,
}) => {
  const starLabel =
    GITHUB_STAR_COUNT === null
      ? 'Star Free CV Builder on GitHub'
      : `Star Free CV Builder on GitHub, ${GITHUB_STAR_COUNT} stars so far`;

  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={starLabel}
      title={starLabel}
      className={`${BASE_CLASSNAMES} ${VARIANT_CLASSNAMES[variant]}`}
    >
      <StarIcon
        className={`text-accent transition group-hover:scale-110 ${ICON_CLASSNAMES[variant]}`}
        aria-hidden
      />
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : undefined}>
        Star on GitHub
      </span>
      {GITHUB_STAR_COUNT !== null && (
        <>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-muted">
            {formatStarCount(GITHUB_STAR_COUNT)}
          </span>
        </>
      )}
    </a>
  );
};
