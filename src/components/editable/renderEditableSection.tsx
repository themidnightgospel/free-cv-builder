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
  title: string;
  entries: T[];
  /** Replaces the entries array with the given one. */
  onUpdateEntries: (next: T[]) => void;
  /** Build a new empty entry. The id should be unique. */
  createEmpty: () => T;
  FormComponent: React.ComponentType<{
    value: T;
    onChange: (next: T) => void;
  }>;
  popoverTitle: string;
  popoverWidth?: number;
  /** Render the read-only display markup for an entry. */
  renderEntry: (entry: T) => React.ReactNode;
  /** When not in editor mode, hide entries that don't satisfy this. */
  displayFilter?: (entry: T) => boolean;
  /** "Add experience", "Add education", etc. */
  addLabel: string;
  /** Editor flags from the parent CvPreview. */
  isEditor: boolean;
  openEntryId: string | null;
  setOpenEntryId: (id: string | null) => void;
  onMoveSection?: (sectionId: SectionId, direction: -1 | 1) => void;
  onRemoveSection?: (sectionId: SectionId) => void;
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
    FormComponent,
    popoverTitle,
    popoverWidth = 560,
    renderEntry,
    displayFilter,
    addLabel,
    isEditor,
    openEntryId,
    setOpenEntryId,
    onMoveSection,
    onRemoveSection,
  } = args;

  const visible = isEditor
    ? entries
    : displayFilter
    ? entries.filter(displayFilter)
    : entries;

  const sectionControls = isEditor && onMoveSection && onRemoveSection
    ? {
        editable: true,
        onMoveUp: () => onMoveSection(sectionId, -1),
        onMoveDown: () => onMoveSection(sectionId, 1),
        onDelete: () => onRemoveSection(sectionId),
        // First slot is personal; first movable section is sectionIndex 1.
        canMoveUp: sectionIndex > 1,
        canMoveDown: sectionIndex < sectionsOrderLength - 1,
      }
    : undefined;

  const total = entries.length;

  const handleAdd = () => {
    const newEntry = createEmpty();
    onUpdateEntries([...entries, newEntry]);
    setOpenEntryId(newEntry.id);
  };

  return (
    <section>
      <SectionHeader title={title} {...(sectionControls ?? {})} />
      <div className="space-y-2">
        {visible.map((entry, idx) => {
          if (!isEditor) {
            return <div key={entry.id}>{renderEntry(entry)}</div>;
          }
          const handleSave = (updated: T) => {
            onUpdateEntries(
              entries.map((it) => (it.id === entry.id ? updated : it)),
            );
          };
          const handleDelete = () => {
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
              entry={entry}
              onSave={handleSave}
              onDelete={handleDelete}
              onMoveUp={() => moveByDelta(-1)}
              onMoveDown={() => moveByDelta(1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < total - 1}
              FormComponent={FormComponent}
              popoverTitle={popoverTitle}
              popoverWidth={popoverWidth}
              isOpen={openEntryId === entry.id}
              onOpenChange={(open) => setOpenEntryId(open ? entry.id : null)}
            >
              {renderEntry(entry)}
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
