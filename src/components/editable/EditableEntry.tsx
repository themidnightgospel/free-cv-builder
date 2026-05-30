import React, { useRef, useState } from 'react';
import { EditPopover } from './EditPopover';
import { EditableWrapper } from './EditableWrapper';
import { EntryPopoverShell } from './EntryPopoverShell';

interface EditableEntryProps<T> {
  entry: T;
  onSave: (updated: T) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  FormComponent: React.ComponentType<{
    value: T;
    onChange: (next: T) => void;
  }>;
  popoverTitle: string;
  popoverWidth?: number;
  /** Controlled-open: parent owns the editing state. */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const EditableEntry = <T,>({
  entry,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  FormComponent,
  popoverTitle,
  popoverWidth = 560,
  isOpen,
  onOpenChange,
  children,
  ariaLabel,
}: EditableEntryProps<T>) => {
  const [internalEditing, setInternalEditing] = useState(false);
  const controlled = isOpen !== undefined;
  const editing = controlled ? Boolean(isOpen) : internalEditing;
  const anchorRef = useRef<HTMLDivElement>(null);

  const requestOpen = () => {
    if (controlled) onOpenChange?.(true);
    else setInternalEditing(true);
  };
  const requestClose = () => {
    if (controlled) onOpenChange?.(false);
    else setInternalEditing(false);
  };

  return (
    <div ref={anchorRef} className="relative">
      <EditableWrapper
        onEdit={requestOpen}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        ariaLabel={ariaLabel}
      >
        {children}
      </EditableWrapper>
      {editing && (
        <EditPopover
          anchorRef={anchorRef}
          onClose={requestClose}
          width={popoverWidth}
        >
          <EntryPopoverShell
            title={popoverTitle}
            onClose={requestClose}
            onDelete={onDelete}
          >
            <FormComponent value={entry} onChange={onSave} />
          </EntryPopoverShell>
        </EditPopover>
      )}
    </div>
  );
};
