import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * How long the toolbar stays put after the pointer leaves the entry. Long
 * enough to cover a pointer crossing the gap, short enough that moving to a
 * neighbouring entry does not show two toolbars at once for a noticeable beat.
 */
const TOOLBAR_LINGER_MS = 150;

interface EditableWrapperProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Adds extra padding inside the hover frame. */
  padded?: boolean;
  /** Anchor used by the parent to position a popover, etc. */
  anchorRef?: React.Ref<HTMLDivElement>;
  ariaLabel?: string;
  children: React.ReactNode;
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  padded = false,
  anchorRef,
  ariaLabel,
  children,
}) => {
  const [isActive, setIsActive] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    cancelHide();
    setIsActive(true);
  }, [cancelHide]);

  /**
   * The toolbar floats above the entry with a gap between them. Crossing that
   * gap briefly leaves the entry's subtree, so hiding immediately would pull
   * the toolbar away exactly as the pointer reaches for it. Lingering covers
   * the crossing; entering the toolbar (a descendant) re-fires mouseenter here
   * and cancels the pending hide.
   */
  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimerRef.current = window.setTimeout(() => {
      setIsActive(false);
      hideTimerRef.current = null;
    }, TOOLBAR_LINGER_MS);
  }, [cancelHide]);

  useEffect(() => cancelHide, [cancelHide]);

  return (
    <div
      ref={anchorRef}
      className={`group relative ${padded ? 'rounded-md' : ''}`}
      aria-label={ariaLabel}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={scheduleHide}
    >
      {/* Hover frame */}
      {/* Tracks hover directly rather than the lingering toolbar state, so
          moving between entries never leaves two frames lit at once. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-md ring-1 ring-transparent transition group-hover:bg-accent/[0.04] group-hover:ring-accent/30"
      />
      {/* Floating control cluster — absolute, zero layout height so builder
          pagination matches the PDF exactly. The offset is padding rather than
          a margin so the toolbar's own hit box reaches down to the entry. */}
      <div
        data-entry-toolbar
        className={`absolute bottom-full right-0 z-10 pb-1 transition ${
          isActive
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-paper px-1 py-0.5 shadow-soft">
        {onMoveUp && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (canMoveUp) onMoveUp();
            }}
            disabled={!canMoveUp}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Move up"
            title="Move up"
          >
            <ChevronUpIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (canMoveDown) onMoveDown();
            }}
            disabled={!canMoveDown}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Move down"
            title="Move down"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-accent-soft hover:text-accent"
            aria-label="Edit"
            title="Edit"
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete"
            title="Delete"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
};
