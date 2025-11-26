import React from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { ProjectEntry } from '../types';
import { useConfirmDialog } from './ConfirmDialogProvider';
import { MarkdownHelp } from './MarkdownHelp';
import {
  sectionEntryIconButtonDanger,
  sectionEntryIconButtonNeutral,
} from './iconButtonStyles';

export interface ProjectsFormProps {
  entries: ProjectEntry[];
  onChange: (entries: ProjectEntry[]) => void;
  createEmptyProject: () => ProjectEntry;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({
  entries,
  onChange,
  createEmptyProject,
}) => {
  const confirmDialog = useConfirmDialog();
  const updateEntry = (id: string, partial: Partial<ProjectEntry>) => {
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
        title: 'Delete project entry?',
        message: 'Delete this project entry? A new blank entry will be created.',
        confirmLabel: 'Delete',
        tone: 'danger',
      });
      if (!confirmed) return;
      onChange([createEmptyProject()]);
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Delete project entry?',
      message: 'Delete this project entry?',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    const copy = [...entries];
    copy.splice(index, 1);
    onChange(copy);
  };

  const addEntry = () => {
    onChange([...entries, createEmptyProject()]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Projects</h2>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          + Add project
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Great for developers, students, and freelancers. Add projects with your role, stack, and key achievements.
      </p>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">
                Project #{index + 1}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Project name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.name}
                  onChange={(e) =>
                    updateEntry(entry.id, { name: e.target.value })
                  }
                  placeholder="Portfolio website, Todo API, etc."
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
                  placeholder="Solo developer, Backend dev, etc."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Tech stack
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={entry.techStack}
                onChange={(e) =>
                  updateEntry(entry.id, { techStack: e.target.value })
                }
                placeholder="React, TypeScript, Node.js, PostgreSQL"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Short description
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={entry.description}
                onChange={(e) =>
                  updateEntry(entry.id, { description: e.target.value })
                }
                placeholder="One or two sentences describing the project."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Key achievements (markdown)
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={entry.achievements}
                onChange={(e) =>
                  updateEntry(entry.id, { achievements: e.target.value })
                }
                placeholder="- Implemented X\n- Improved Y by 30%..."
              />
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                <span>Tip: use markdown bullets for clear, scannable achievements.</span>
                <MarkdownHelp />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Link (GitHub / demo)
              </label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={entry.link}
                onChange={(e) =>
                  updateEntry(entry.id, { link: e.target.value })
                }
                placeholder="https://github.com/you/project or live demo URL"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
