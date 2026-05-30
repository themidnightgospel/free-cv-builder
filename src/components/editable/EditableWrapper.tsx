import React from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

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
  return (
    <div
      ref={anchorRef}
      className={`group relative ${padded ? 'rounded-md' : ''}`}
      aria-label={ariaLabel}
    >
      {/* Hover frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-md ring-1 ring-transparent transition group-hover:bg-accent/[0.04] group-hover:ring-accent/30"
      />
      {/* Floating control cluster — always interactive so clicks survive the hover gap between entry and cluster. */}
      <div className="absolute -top-3 right-0 z-10 flex items-center gap-0.5 rounded-full border border-slate-200 bg-paper px-1 py-0.5 opacity-0 shadow-soft transition group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100">
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
      <div className="relative">{children}</div>
    </div>
  );
};
