import React from 'react';
import type { PublicationEntry } from '../types';
import { getMonthInputValue } from '../utils/dateFields';
import { useConfirmDialog } from './ConfirmDialogProvider';
import { generateId } from '../utils/uuid';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  sectionEntryIconButtonDanger,
  sectionEntryIconButtonNeutral,
} from './iconButtonStyles';

export interface PublicationsFormProps {
  entries: PublicationEntry[];
  onChange: (entries: PublicationEntry[]) => void;
}

export const PublicationsForm: React.FC<PublicationsFormProps> = ({
  entries,
  onChange,
}) => {
  const confirmDialog = useConfirmDialog();
  const updateEntry = (id: string, partial: Partial<PublicationEntry>) => {
    onChange(
      entries.map((entry) => (entry.id === id ? { ...entry, ...partial } : entry)),
    );
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= entries.length) return;
    const copy = [...entries];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIndex, 0, moved);
    onChange(copy);
  };

  const deleteEntry = async (index: number) => {
    const confirmed = await confirmDialog({
      title: 'Delete publication?',
      message: 'Delete this publication?',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    const copy = [...entries];
    copy.splice(index, 1);
    onChange(copy);
  };

  const addEntry = () => {
    const id = generateId();
    onChange([
      ...entries,
      {
        id,
        title: '',
        venue: '',
        year: '',
        coAuthors: '',
        link: '',
      },
    ]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Publications</h2>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          + Add publication
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        List journal or conference publications relevant to your profile.
      </p>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">
                Publication #{index + 1}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={sectionEntryIconButtonNeutral}
                  disabled={index === 0}
                  onClick={() => moveEntry(index, -1)}
                  aria-label="Move entry up"
                  title="Move up"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={sectionEntryIconButtonNeutral}
                  disabled={index === entries.length - 1}
                  onClick={() => moveEntry(index, 1)}
                  aria-label="Move entry down"
                  title="Move down"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={sectionEntryIconButtonDanger}
                  onClick={() => deleteEntry(index)}
                  aria-label="Delete entry"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Title
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={entry.title}
                onChange={(e) =>
                  updateEntry(entry.id, { title: e.target.value })
                }
                placeholder="Paper or article title"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Venue
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.venue}
                  onChange={(e) =>
                    updateEntry(entry.id, { venue: e.target.value })
                  }
                  placeholder="Journal or conference name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Published Month
                </label>
                <input
                  type="month"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={getMonthInputValue(entry.year)}
                  onChange={(e) =>
                    updateEntry(entry.id, { year: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Co-authors
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={entry.coAuthors}
                onChange={(e) =>
                  updateEntry(entry.id, { coAuthors: e.target.value })
                }
                placeholder="List co-authors (optional)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Link / DOI
              </label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={entry.link}
                onChange={(e) =>
                  updateEntry(entry.id, { link: e.target.value })
                }
                placeholder="https://doi.org/..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
