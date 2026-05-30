import React, { useEffect, useRef, useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  /** If true, omit the hover frame (use for already-styled containers). */
  noFrame?: boolean;
  /** Visual size override for placeholder italic muting. */
  placeholderClassName?: string;
  ariaLabel?: string;
  /** Returns null when value is acceptable, or an error message string. */
  validate?: (value: string) => string | null;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  placeholder = 'Click to edit',
  multiline = false,
  className = '',
  inputClassName = '',
  noFrame = false,
  placeholderClassName = 'italic text-muted/70',
  ariaLabel,
  validate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) inputRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    if (draft !== value) onChange(draft);
    setIsEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  if (isEditing) {
    const onChangeHandler = (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setDraft(event.target.value);
    const onKeyDownHandler = (
      event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
      if (event.key === 'Enter' && !multiline) {
        event.preventDefault();
        commit();
      }
      if (event.key === 'Enter' && multiline && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        commit();
      }
    };

    const draftError = validate ? validate(draft) : null;
    const ringClass = draftError
      ? 'ring-red-400/60 focus:ring-red-500/80'
      : 'ring-accent/30 focus:ring-accent/60';
    const bgClass = draftError ? 'bg-red-50' : 'bg-accent/5';
    const baseEditClass = `border-0 outline-none rounded-[3px] ring-1 ${ringClass} ${bgClass}`;

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          aria-label={ariaLabel}
          aria-invalid={Boolean(draftError)}
          title={draftError ?? undefined}
          onChange={onChangeHandler}
          onBlur={commit}
          onKeyDown={onKeyDownHandler}
          rows={Math.max(2, draft.split('\n').length)}
          className={`${className} ${inputClassName} ${baseEditClass} block w-full resize-none px-1 py-0.5`}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        aria-label={ariaLabel}
        aria-invalid={Boolean(draftError)}
        title={draftError ?? undefined}
        onChange={onChangeHandler}
        onBlur={commit}
        onKeyDown={onKeyDownHandler}
        size={Math.max(draft.length + 2, 8)}
        className={`${className} ${inputClassName} ${baseEditClass} inline-block max-w-full px-1 -mx-1`}
      />
    );
  }

  const hasValue = value.trim().length > 0;
  const displayValue = hasValue ? value : placeholder;
  const displayError = hasValue && validate ? validate(value) : null;
  const frameClass = noFrame
    ? 'cursor-text rounded-[3px] transition hover:bg-accent/5'
    : 'cursor-text rounded-[3px] px-0.5 -mx-0.5 transition hover:bg-accent/8 hover:outline hover:outline-1 hover:outline-accent/20';
  const valueClass = hasValue ? '' : placeholderClassName;
  const errorClass = displayError
    ? '[text-decoration:underline_wavy_#dc2626] underline-offset-[3px]'
    : '';

  const handleStart = () => setIsEditing(true);
  const handleKeyboardStart = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsEditing(true);
    }
  };

  if (multiline) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleStart}
        onKeyDown={handleKeyboardStart}
        title={displayError ?? undefined}
        aria-invalid={Boolean(displayError)}
        className={`group/edit relative ${className} ${frameClass} ${valueClass} ${errorClass} whitespace-pre-wrap`}
        aria-label={ariaLabel}
      >
        {displayValue}
        <PencilSquareIcon
          aria-hidden
          className="pointer-events-none absolute right-1.5 top-1.5 h-5 w-5 text-accent opacity-0 transition group-hover/edit:opacity-100"
        />
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleStart}
      onKeyDown={handleKeyboardStart}
      title={displayError ?? undefined}
      aria-invalid={Boolean(displayError)}
      className={`group/edit ${className} ${frameClass} ${valueClass} ${errorClass} inline-flex items-center gap-1`}
      aria-label={ariaLabel}
    >
      <span>{displayValue}</span>
      <PencilSquareIcon
        aria-hidden
        className="h-4 w-4 shrink-0 text-accent opacity-0 transition group-hover/edit:opacity-100"
      />
    </span>
  );
};
