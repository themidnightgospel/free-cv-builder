import React, { useState } from 'react';
import type { Skill, SkillLevel } from '../types';

export interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

export const SkillsForm: React.FC<SkillsFormProps> = ({ skills, onChange }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<SkillLevel | ''>('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: name.trim(),
      level: level || undefined,
    };
    onChange([...skills, newSkill]);
    setName('');
    setLevel('');
  };

  const handleRemove = (id: string) => {
    onChange(skills.filter((skill) => skill.id !== id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Skills</h2>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Add your skills. This section is never required, but at least one skill will mark it as complete.
      </p>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700">
            Skill
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="JavaScript, Communication, etc."
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-slate-700">
            Level
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={level}
            onChange={(e) => setLevel(e.target.value as SkillLevel | '')}
          >
            <option value="">Optional</option>
            {skillLevels.map((lvl) => (
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
        {skills.length === 0 && (
          <p className="text-xs text-slate-400">
            Add your skills to see them appear on your CV.
          </p>
        )}
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
          >
            <span>
              {skill.name}
              {skill.level ? ` – ${skill.level}` : ''}
            </span>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              onClick={() => handleRemove(skill.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
