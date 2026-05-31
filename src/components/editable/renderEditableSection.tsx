import React from 'react';
import { EditableEntry } from './EditableEntry';
import { SectionHeader } from './SectionHeader';
import type { SectionId } from '../../types';

interface EntryWithId {
  id: string;
}

interface RenderEditableSectionArgs<T extends EntryWithId> {
  sectionId: SectionId;
  sectionIndex: number;
  sectionsOrderLength: number;
  title: React.ReactNode;
  entries: T[];
  /** Replaces the entries array with the given one. */
  onUpdateEntries: (next: T[]) => void;
  /** Build a new empty entry. The id should be unique. */
  createEmpty: () => T;
  /** Render the entry; in editor mode the caller should render inline editable
   *  primitives directly and call onUpdate to persist field changes. */
  renderEntry: (entry: T, onUpdate: (next: T) => void) => React.ReactNode;
  /** When not in editor mode, hide entries that don't satisfy this. */
  displayFilter?: (entry: T) => boolean;
  /** "Add experience", "Add education", etc. */
  addLabel: string;
  /** Singular label of a single entry (e.g. "experience"). Used by the
   *  delete confirmation prompt. */
  entryLabel?: string;
  /** Editor flags from the parent CvPreview. */
  isEditor: boolean;
  onMoveSection?: (sectionId: SectionId, direction: -1 | 1) => void;
  onRemoveSection?: (sectionId: SectionId) => void;
  /** Resolves to true if the user confirmed; false otherwise. */
  confirmDelete?: (message: string) => Promise<boolean>;
}

export function renderEditableSection<T extends EntryWithId>(
  args: RenderEditableSectionArgs<T>,
): React.ReactNode {
  const {
    sectionId,
    sectionIndex,
    sectionsOrderLength,
    title,
    entries,
    onUpdateEntries,
    createEmpty,
    renderEntry,
    displayFilter,
    addLabel,
    entryLabel,
    isEditor,
    onMoveSection,
    onRemoveSection,
    confirmDelete,
  } = args;

  const visible = isEditor
    ? entries
    : displayFilter
    ? entries.filter(displayFilter)
    : entries;

  const sectionControls =
    isEditor && onMoveSection && onRemoveSection
      ? {
          editable: true,
          onMoveUp: () => onMoveSection(sectionId, -1),
          onMoveDown: () => onMoveSection(sectionId, 1),
          onDelete: () => onRemoveSection(sectionId),
          canMoveUp: sectionIndex > 1,
          canMoveDown: sectionIndex < sectionsOrderLength - 1,
        }
      : undefined;

  const total = entries.length;

  const handleAdd = () => {
    const newEntry = createEmpty();
    onUpdateEntries([...entries, newEntry]);
  };

  return (
    <section>
      <SectionHeader title={title} {...(sectionControls ?? {})} />
      <div className="space-y-2">
        {visible.map((entry, idx) => {
          if (!isEditor) {
            return <div key={entry.id}>{renderEntry(entry, () => {})}</div>;
          }
          const handleUpdate = (updated: T) => {
            onUpdateEntries(
              entries.map((it) => (it.id === entry.id ? updated : it)),
            );
          };
          const handleDelete = async () => {
            if (confirmDelete) {
              const label = entryLabel ?? 'item';
              const ok = await confirmDelete(
                `Delete this ${label}? This cannot be undone.`,
              );
              if (!ok) return;
            }
            onUpdateEntries(entries.filter((it) => it.id !== entry.id));
          };
          const moveByDelta = (delta: -1 | 1) => {
            const target = idx + delta;
            if (target < 0 || target >= total) return;
            const copy = [...entries];
            const [moved] = copy.splice(idx, 1);
            copy.splice(target, 0, moved);
            onUpdateEntries(copy);
          };
          return (
            <EditableEntry
              key={entry.id}
              onDelete={handleDelete}
              onMoveUp={() => moveByDelta(-1)}
              onMoveDown={() => moveByDelta(1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < total - 1}
            >
              {renderEntry(entry, handleUpdate)}
            </EditableEntry>
          );
        })}
        {isEditor && (
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-accent hover:bg-accent-soft hover:text-accent"
          >
            + {addLabel}
          </button>
        )}
      </div>
    </section>
  );
}
