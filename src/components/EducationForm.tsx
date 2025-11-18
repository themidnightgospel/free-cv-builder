import React from 'react';
import type { EducationEntry } from '../types';
import { getMonthInputValue } from '../utils/dateFields';
import { useConfirmDialog } from './ConfirmDialogProvider';

export interface EducationFormProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
  createEmptyEducation: () => EducationEntry;
}

export const EducationForm: React.FC<EducationFormProps> = ({
  entries,
  onChange,
  createEmptyEducation,
}) => {
  const confirmDialog = useConfirmDialog();
  const updateEntry = (id: string, partial: Partial<EducationEntry>) => {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...partial } : entry)));
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
    if (entries.length === 1) {
      const confirmed = await confirmDialog({
        title: 'Delete education entry?',
        message: 'Delete this education entry? A new blank entry will be created.',
        confirmLabel: 'Delete',
        tone: 'danger',
      });
      if (!confirmed) return;
      onChange([createEmptyEducation()]);
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Delete education entry?',
      message: 'Delete this education entry?',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    const copy = [...entries];
    copy.splice(index, 1);
    onChange(copy);
  };

  const addEntry = () => {
    onChange([...entries, createEmptyEducation()]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Education</h2>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          + Add education
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Add your degrees or programs. At least one entry with degree and institution makes this section complete.
      </p>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">
                Education #{index + 1}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-[11px] text-slate-500 hover:text-slate-700 disabled:text-slate-300"
                  disabled={index === 0}
                  onClick={() => moveEntry(index, -1)}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className="text-[11px] text-slate-500 hover:text-slate-700 disabled:text-slate-300"
                  disabled={index === entries.length - 1}
                  onClick={() => moveEntry(index, 1)}
                >
                  Move down
                </button>
                <button
                  type="button"
                  className="text-[11px] text-red-500 hover:text-red-600"
                  onClick={() => deleteEntry(index)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Degree / Program
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.degree}
                  onChange={(e) =>
                    updateEntry(entry.id, { degree: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Institution
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.institution}
                  onChange={(e) =>
                    updateEntry(entry.id, { institution: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.location}
                  onChange={(e) =>
                    updateEntry(entry.id, { location: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Start Month
                </label>
                <input
                  type="month"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={getMonthInputValue(entry.startYear)}
                  onChange={(e) =>
                    updateEntry(entry.id, { startYear: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  End Month
                </label>
                <input
                  type="month"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  value={
                    entry.isCurrent ? '' : getMonthInputValue(entry.endYear)
                  }
                  onChange={(e) =>
                    updateEntry(entry.id, { endYear: e.target.value })
                  }
                  disabled={entry.isCurrent}
                />
                <label className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={entry.isCurrent}
                    onChange={(e) =>
                      updateEntry(entry.id, { isCurrent: e.target.checked })
                    }
                  />
                  Present
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Description
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={entry.description}
                onChange={(e) =>
                  updateEntry(entry.id, { description: e.target.value })
                }
                placeholder="Optional: honors, thesis, or coursework. Markdown supported."
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Tip: use {'*bullet points*'} and {'**bold**'} with markdown.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
