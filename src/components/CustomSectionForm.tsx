import React from 'react';
import type { CustomSection } from '../types';

export interface CustomSectionFormProps {
  section: CustomSection;
  onChange: (updated: CustomSection) => void;
  onDelete: () => void;
}

export const CustomSectionForm: React.FC<CustomSectionFormProps> = ({
  section,
  onChange,
  onDelete,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Custom section
        </h2>
        <button
          type="button"
          className="text-xs text-red-500 hover:text-red-600"
          onClick={() => {
            if (
              confirm(
                `Delete section "${section.title || 'Untitled section'}"?`,
              )
            ) {
              onDelete();
            }
          }}
        >
          Delete section
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Section title
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={section.title}
            onChange={(e) =>
              onChange({
                ...section,
                title: e.target.value,
              })
            }
            placeholder="Projects, Summary, Languages, etc."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Content
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={section.body}
            onChange={(e) =>
              onChange({
                ...section,
                body: e.target.value,
              })
            }
            placeholder="Add text for this section. Markdown supported for bullets, headings, and emphasis."
          />
          <p className="mt-1 text-[10px] text-slate-400">
            Tip: use {'# Heading'}, {'- bullet'}, {'**bold**'}, {'*italic*'}.
          </p>
        </div>
      </div>
    </div>
  );
};
