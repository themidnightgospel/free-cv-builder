import React from 'react';
import type { AchievementEntry } from '../types';
import { useConfirmDialog } from './ConfirmDialogProvider';

export interface AchievementsFormProps {
  entries: AchievementEntry[];
  onChange: (entries: AchievementEntry[]) => void;
  createEmptyAchievement: () => AchievementEntry;
}

export const AchievementsForm: React.FC<AchievementsFormProps> = ({
  entries,
  onChange,
  createEmptyAchievement,
}) => {
  const confirmDialog = useConfirmDialog();
  const updateEntry = (id: string, partial: Partial<AchievementEntry>) => {
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
    if (entries.length === 1) {
      const confirmed = await confirmDialog({
        title: 'Delete achievement?',
        message: 'Delete this achievement? A new blank entry will be created.',
        confirmLabel: 'Delete',
        tone: 'danger',
      });
      if (!confirmed) return;
      onChange([createEmptyAchievement()]);
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Delete achievement?',
      message: 'Delete this achievement or award?',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    const copy = [...entries];
    copy.splice(index, 1);
    onChange(copy);
  };

  const addEntry = () => {
    onChange([...entries, createEmptyAchievement()]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Achievements / Awards
        </h2>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          + Add achievement
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Highlight scholarships, awards, and recognitions relevant to your career.
      </p>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">
                Achievement #{index + 1}
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
                  Award name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.name}
                  onChange={(e) =>
                    updateEntry(entry.id, { name: e.target.value })
                  }
                  placeholder="Best Student Award, Hackathon Winner"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Organization
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.organization}
                  onChange={(e) =>
                    updateEntry(entry.id, { organization: e.target.value })
                  }
                  placeholder="University, Company, Conference"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.date}
                  onChange={(e) =>
                    updateEntry(entry.id, { date: e.target.value })
                  }
                  placeholder="Mar 2024"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Brief context
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={entry.context}
                onChange={(e) =>
                  updateEntry(entry.id, { context: e.target.value })
                }
                placeholder="Why you received this award and what it recognizes."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
