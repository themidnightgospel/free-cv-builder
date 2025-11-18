import React from 'react';
import type { TalkEntry } from '../types';
import { useConfirmDialog } from './ConfirmDialogProvider';

export interface TalksFormProps {
  entries: TalkEntry[];
  onChange: (entries: TalkEntry[]) => void;
}

export const TalksForm: React.FC<TalksFormProps> = ({ entries, onChange }) => {
  const confirmDialog = useConfirmDialog();
  const updateEntry = (id: string, partial: Partial<TalkEntry>) => {
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
      title: 'Delete talk?',
      message: 'Delete this talk or event?',
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
        title: '',
        event: '',
        date: '',
        role: '',
        locationOrLink: '',
      },
    ]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Talks / Conferences / Workshops
        </h2>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          + Add talk
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Add talks, conference presentations, and workshops where you spoke or participated.
      </p>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">
                Talk #{index + 1}
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
                placeholder="Talk or session title"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Event
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.event}
                  onChange={(e) =>
                    updateEntry(entry.id, { event: e.target.value })
                  }
                  placeholder="Conference or meetup name"
                />
              </div>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  placeholder="Speaker, Panelist, Workshop host..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Location / Link
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.locationOrLink}
                  onChange={(e) =>
                    updateEntry(entry.id, { locationOrLink: e.target.value })
                  }
                  placeholder="City, Country or online link"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
