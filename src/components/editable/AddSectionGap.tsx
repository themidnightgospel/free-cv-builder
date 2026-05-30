import React, { useRef, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { EditPopover } from './EditPopover';

export interface AddSectionOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface AddSectionGapProps {
  options: AddSectionOption[];
  onSelect: (optionId: string) => void;
  /** Vertical breathing height. */
  size?: 'sm' | 'md';
}

export const AddSectionGap: React.FC<AddSectionGapProps> = ({
  options,
  onSelect,
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const heightClass = size === 'sm' ? 'h-4' : 'h-6';

  return (
    <div className={`group relative my-1 flex w-full items-center ${heightClass}`}>
      <div
        aria-hidden
        className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-accent/0 transition ${
          open ? 'bg-accent/40' : 'group-hover:bg-accent/40'
        }`}
      />
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`absolute left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-accent bg-paper text-accent shadow-soft transition ${
          open
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
        } hover:bg-accent hover:text-paper`}
        aria-label="Add section here"
        title="Add section here"
      >
        <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      {open && (
        <EditPopover anchorRef={buttonRef} onClose={() => setOpen(false)} width={240}>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
            Add a section
          </div>
          <div className="space-y-0.5">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  onSelect(option.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] transition ${
                  option.disabled
                    ? 'cursor-not-allowed text-muted'
                    : 'text-ink hover:bg-slate-100'
                }`}
              >
                <span>{option.label}</span>
                {option.disabled && (
                  <span className="text-[10px] font-medium text-accent">
                    Added
                  </span>
                )}
              </button>
            ))}
          </div>
        </EditPopover>
      )}
    </div>
  );
};
