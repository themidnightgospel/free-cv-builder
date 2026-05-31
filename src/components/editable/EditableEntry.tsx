import React from 'react';
import { EditableWrapper } from './EditableWrapper';

interface EditableEntryProps {
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Lightweight chrome around an entry that exposes inline delete / move
 * controls. Editing happens directly on the children, not in a popover.
 */
export const EditableEntry: React.FC<EditableEntryProps> = ({
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  ariaLabel,
  children,
}) => (
  <EditableWrapper
    onDelete={onDelete}
    onMoveUp={onMoveUp}
    onMoveDown={onMoveDown}
    canMoveUp={canMoveUp}
    canMoveDown={canMoveDown}
    ariaLabel={ariaLabel}
  >
    {children}
  </EditableWrapper>
);
