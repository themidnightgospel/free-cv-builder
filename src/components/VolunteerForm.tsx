import React from 'react';
import type { VolunteerExperienceEntry } from '../types';
import { useConfirmDialog } from './ConfirmDialogProvider';

export interface VolunteerFormProps {
  entries: VolunteerExperienceEntry[];
  onChange: (entries: VolunteerExperienceEntry[]) => void;
}

export const VolunteerForm: React.FC<VolunteerFormProps> = ({
  entries,
  onChange,
}) => {
  const confirmDialog = useConfirmDialog();
  const updateEntry = (
    id: string,
    partial: Partial<VolunteerExperienceEntry>,
  ) => {
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
      title: 'Delete volunteer experience?',
      message: 'Delete this volunteer experience?',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    const copy = [...entries];
    copy.splice(index, 1);
    onChange(copy);
  };

  const addEntry = () => {
    const id = crypto.randomUUID();
    onChange([
      ...entries,
      {
        id,
        organization: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        responsibilities: '',
      },
    ]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Volunteer Experience
        </h2>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          + Add volunteer role
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Same structure as experience, but clearly marked as volunteer work.
      </p>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">
                Volunteer #{index + 1}
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
                  Organization
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.organization}
                  onChange={(e) =>
                    updateEntry(entry.id, { organization: e.target.value })
                  }
                  placeholder="Non-profit, community group..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Role
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.role}
                  onChange={(e) =>
                    updateEntry(entry.id, { role: e.target.value })
                  }
                  placeholder="Volunteer coordinator, Mentor..."
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
                  placeholder="City, Country or remote"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Start Date
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.startDate}
                  onChange={(e) =>
                    updateEntry(entry.id, { startDate: e.target.value })
                  }
                  placeholder="Jan 2023"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  End Date
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  value={entry.isCurrent ? '' : entry.endDate}
                  onChange={(e) =>
                    updateEntry(entry.id, { endDate: e.target.value })
                  }
                  placeholder="Dec 2023"
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
                Responsibilities / impact
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={entry.responsibilities}
                onChange={(e) =>
                  updateEntry(entry.id, { responsibilities: e.target.value })
                }
                placeholder="Describe what you did and the impact you had."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
