import React from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface SectionHeaderProps {
  title: React.ReactNode;
  editable?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  editable = false,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  if (!editable) {
    return (
      <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
    );
  }
  return (
    <div className="group/section relative mb-1 flex items-center justify-between">
      <h2 className="font-section-title font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-paper px-1 py-0.5 opacity-0 shadow-soft transition group-hover/section:opacity-100 hover:opacity-100 focus-within:opacity-100">
        {onMoveUp && (
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Move section up"
            title="Move section up"
          >
            <ChevronUpIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Move section down"
            title="Move section down"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete section"
            title="Delete section"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
