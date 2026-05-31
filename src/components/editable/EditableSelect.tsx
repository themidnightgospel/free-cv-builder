import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface EditableSelectOption<T extends string> {
  value: T;
  label: string;
}

interface EditableSelectProps<T extends string> {
  value: T | '' | undefined;
  options: EditableSelectOption<T>[];
  onChange: (next: T | undefined) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  /** Allow the value to be cleared via a leading blank option. */
  allowEmpty?: boolean;
}

export const EditableSelect = <T extends string>({
  value,
  options,
  onChange,
  placeholder = 'Choose',
  ariaLabel,
  className = '',
  allowEmpty = false,
}: EditableSelectProps<T>) => {
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value ?? ''}
        aria-label={ariaLabel}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === '' ? undefined : (next as T));
        }}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            setIsEditing(false);
          }
        }}
        className={`rounded-[3px] bg-accent/5 px-1 py-0.5 text-[11px] outline-none ring-1 ring-accent/30 focus:ring-accent/60 ${className}`}
      >
        {allowEmpty && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const current = options.find((option) => option.value === value);
  const hasValue = Boolean(current);

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      aria-label={ariaLabel}
      className={`group/edit inline-flex items-center gap-1 rounded-[3px] px-0.5 -mx-0.5 transition hover:bg-accent/8 hover:outline hover:outline-1 hover:outline-accent/20 ${
        hasValue ? '' : 'italic text-muted/70'
      } ${className}`}
    >
      <span>{current ? current.label : placeholder}</span>
      <ChevronDownIcon
        aria-hidden
        className="h-3 w-3 shrink-0 text-accent opacity-0 transition group-hover/edit:opacity-100"
      />
    </button>
  );
};
