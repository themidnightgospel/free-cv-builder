import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const MARKDOWN_EXAMPLES = [
  {
    label: 'Bulleted list',
    example: `- Led frontend migration\n- Improved conversion rate`,
  },
  {
    label: 'Numbered steps',
    example: `1. Gather requirements\n2. Implement feature`,
  },
  {
    label: 'Emphasis',
    example: `**Bold important metrics** and *italicize context*.`,
  },
  {
    label: 'Links & code',
    example: `[Portfolio](https://example.com) and \`npm start\`.`,
  },
  {
    label: 'Multiple paragraphs',
    example: `First paragraph with summary.\n\nSecond paragraph with details.`,
  },
];

export function MarkdownHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Show supported markdown"
        className="text-slate-400 transition hover:text-slate-600"
        onClick={() => setIsOpen(true)}
      >
        <InformationCircleIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Markdown support
                </p>
                <h3 className="text-base font-semibold text-slate-900">
                  Format descriptions quickly
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setIsOpen(false)}
                aria-label="Close markdown help"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              These inputs use CommonMark. Mix and match the examples below.
            </p>
            <div className="space-y-3">
              {MARKDOWN_EXAMPLES.map((example) => (
                <div key={example.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {example.label}
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-800">
                    {example.example}
                  </pre>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
