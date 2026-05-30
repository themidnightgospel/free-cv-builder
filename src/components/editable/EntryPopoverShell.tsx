import React from 'react';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EntryPopoverShellProps {
  title: string;
  onClose: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export const EntryPopoverShell: React.FC<EntryPopoverShellProps> = ({
  title,
  onClose,
  onDelete,
  children,
}) => (
  <div className="flex flex-col">
    {/* Header */}
    <div className="-mx-4 -mt-4 mb-4 flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <h3 className="text-[14px] font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <button
        type="button"
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink"
        aria-label="Close"
        title="Close"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>

    {/* Body */}
    <div className="space-y-3">{children}</div>

    {/* Footer */}
    <div className="-mx-4 -mb-4 mt-5 flex items-center justify-between border-t border-slate-200 px-4 py-3">
      {onDelete ? (
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-red-700 transition hover:bg-red-50"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg bg-ink px-3 py-1.5 text-[13px] font-medium text-paper shadow-soft transition hover:bg-accent-dark"
      >
        Done
      </button>
    </div>
  </div>
);
