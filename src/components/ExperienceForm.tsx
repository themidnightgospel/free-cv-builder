import React from 'react';
import type { ExperienceEntry } from '../types';
import { getMonthInputValue } from '../utils/dateFields';
import { useConfirmDialog } from './ConfirmDialogProvider';
import { MarkdownHelp } from './MarkdownHelp';

export interface ExperienceFormProps {
  entries: ExperienceEntry[];
  onChange: (entries: ExperienceEntry[]) => void;
  createEmptyExperience: () => ExperienceEntry;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({
  entries,
  onChange,
  createEmptyExperience,
}) => {
  const confirmDialog = useConfirmDialog();
  const updateEntry = (id: string, partial: Partial<ExperienceEntry>) => {
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
        title: 'Delete experience entry?',
        message: 'Delete this experience entry? A new blank entry will be created.',
        confirmLabel: 'Delete',
        tone: 'danger',
      });
      if (!confirmed) return;
      onChange([createEmptyExperience()]);
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Delete experience entry?',
      message: 'Delete this experience entry?',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    const copy = [...entries];
    copy.splice(index, 1);
    onChange(copy);
  };

  const addEntry = () => {
    onChange([...entries, createEmptyExperience()]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Experience</h2>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          + Add experience
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Add your relevant roles. At least one entry with job title and company makes this section complete.
      </p>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">
                Experience #{index + 1}
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
                  Job Title
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.jobTitle}
                  onChange={(e) =>
                    updateEntry(entry.id, { jobTitle: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Company
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.company}
                  onChange={(e) =>
                    updateEntry(entry.id, { company: e.target.value })
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
                  Start Date
                </label>
                <input
                  type="month"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={getMonthInputValue(entry.startDate)}
                  onChange={(e) =>
                    updateEntry(entry.id, { startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  End Date
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="month"
                    className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    value={
                      entry.isCurrent ? '' : getMonthInputValue(entry.endDate)
                    }
                    onChange={(e) =>
                      updateEntry(entry.id, { endDate: e.target.value })
                    }
                    disabled={entry.isCurrent}
                  />
                </div>
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
                rows={6}
                value={entry.description}
                onChange={(e) =>
                  updateEntry(entry.id, { description: e.target.value })
                }
                placeholder="Describe your responsibilities and achievements. Markdown supported for bullets and emphasis."
              />
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                <span>
                  Tip: use {'*bullet points*'}, {'**bold**'}, and {'`code`'} with markdown.
                </span>
                <MarkdownHelp />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
