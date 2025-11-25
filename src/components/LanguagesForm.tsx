import React, { useState } from 'react';
import type { Language, LanguageLevel } from '../types';
import { generateId } from '../utils/uuid';

export interface LanguagesFormProps {
  languages: Language[];
  onChange: (languages: Language[]) => void;
}

const languageLevels: LanguageLevel[] = [
  'Native',
  'Fluent',
  'Professional',
  'Intermediate',
  'Basic',
];

export const LanguagesForm: React.FC<LanguagesFormProps> = ({
  languages,
  onChange,
}) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<LanguageLevel>('Fluent');

  const handleAdd = () => {
    if (!name.trim()) return;
    const language: Language = {
      id: generateId(),
      name: name.trim(),
      level,
    };
    onChange([...languages, language]);
    setName('');
    setLevel('Fluent');
  };

  const handleRemove = (id: string) => {
    onChange(languages.filter((language) => language.id !== id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Languages</h2>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Add languages and proficiency. This helps international or multilingual roles stand out.
      </p>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700">
            Language
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="English, Spanish, German, etc."
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-slate-700">
            Level
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={level}
            onChange={(e) => setLevel(e.target.value as LanguageLevel)}
          >
            {languageLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
          >
            Add
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.length === 0 && (
          <p className="text-xs text-slate-400">
            Add languages to show them on your CV.
          </p>
        )}
        {languages.map((language) => (
          <div
            key={language.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
          >
            <span>
              {language.name} – {language.level}
            </span>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              onClick={() => handleRemove(language.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
