import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface EditableToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  ariaLabel?: string;
  className?: string;
}

export const EditableToggle: React.FC<EditableToggleProps> = ({
  checked,
  onChange,
  label,
  ariaLabel,
  className = '',
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel ?? label}
    onClick={() => onChange(!checked)}
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${
      checked
        ? 'border-accent/40 bg-accent-soft text-accent-dark'
        : 'border-slate-200 bg-paper text-muted hover:border-slate-300 hover:text-ink'
    } ${className}`}
  >
    <span
      className={`flex h-3 w-3 items-center justify-center rounded-full border ${
        checked
          ? 'border-accent bg-accent text-paper'
          : 'border-slate-300 bg-paper'
      }`}
    >
      {checked && (
        <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
      )}
    </span>
    {label}
  </button>
);
