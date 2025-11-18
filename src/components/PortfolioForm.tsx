import React, { useState } from 'react';
import type { PortfolioLink } from '../types';

export interface PortfolioFormProps {
  links: PortfolioLink[];
  onChange: (links: PortfolioLink[]) => void;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  links,
  onChange,
}) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) return;
    const link: PortfolioLink = {
      id: crypto.randomUUID(),
      label: label.trim(),
      url: url.trim(),
    };
    onChange([...links, link]);
    setLabel('');
    setUrl('');
  };

  const handleRemove = (id: string) => {
    onChange(links.filter((link) => link.id !== id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Portfolio / Links
        </h2>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Add links to GitHub, Behance, Dribbble, personal site, or other profiles.
      </p>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700">
            Label
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="GitHub, Behance, Portfolio site..."
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700">
            URL
          </label>
          <input
            type="url"
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
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
        {links.length === 0 && (
          <p className="text-xs text-slate-400">
            Add portfolio links to show them on your CV.
          </p>
        )}
        {links.map((link) => (
          <div
            key={link.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
          >
            <span className="max-w-[160px] truncate">
              {link.label} – {link.url}
            </span>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              onClick={() => handleRemove(link.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

