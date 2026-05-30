import React, { useState } from 'react';
import type { AdvancedSettings, FontSettings } from '../types';
import {
  DEFAULT_ADVANCED_SETTINGS,
  DEFAULT_FONT_SETTINGS,
} from '../state/cvModel';

interface AdvancedPanelProps {
  fontSettings: FontSettings;
  advancedSettings: AdvancedSettings;
  onChangeFont: (next: FontSettings) => void;
  onChangeAdvanced: (next: AdvancedSettings) => void;
}

interface FontControl {
  key: keyof FontSettings;
  label: string;
  min: number;
  max: number;
}

const FONT_GROUPS: { title: string; controls: FontControl[] }[] = [
  {
    title: 'Header',
    controls: [
      { key: 'fullName', label: 'Full name', min: 14, max: 48 },
      { key: 'jobTitle', label: 'Job title', min: 8, max: 24 },
      { key: 'contactDetail', label: 'Contact details', min: 8, max: 18 },
    ],
  },
  {
    title: 'Sections',
    controls: [
      { key: 'sectionTitle', label: 'Section title', min: 8, max: 24 },
      { key: 'sectionItemTitle', label: 'Item title', min: 8, max: 22 },
      { key: 'sectionDetail', label: 'Item details', min: 8, max: 18 },
    ],
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const NumberStepper: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ariaLabel: string;
  onChange: (next: number) => void;
}> = ({ value, min, max, step = 1, unit = 'px', ariaLabel, onChange }) => (
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      className="h-7 w-7 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={`Decrease ${ariaLabel}`}
      disabled={value <= min}
      onClick={() => onChange(clamp(value - step, min, max))}
    >
      −
    </button>
    <input
      type="number"
      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/40"
      value={value}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
      onChange={(event) => {
        const next = Number.parseFloat(event.target.value);
        if (!Number.isFinite(next)) return;
        onChange(clamp(next, min, max));
      }}
    />
    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
      {unit}
    </span>
    <button
      type="button"
      className="h-7 w-7 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={`Increase ${ariaLabel}`}
      disabled={value >= max}
      onClick={() => onChange(clamp(value + step, min, max))}
    >
      +
    </button>
  </div>
);

export const AdvancedPanel: React.FC<AdvancedPanelProps> = ({
  fontSettings,
  advancedSettings,
  onChangeFont,
  onChangeAdvanced,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const setFont = (key: keyof FontSettings, value: number) => {
    onChangeFont({ ...fontSettings, [key]: value });
  };

  const setAdvanced = <K extends keyof AdvancedSettings>(
    key: K,
    value: AdvancedSettings[K],
  ) => {
    onChangeAdvanced({ ...advancedSettings, [key]: value });
  };

  const resetAll = () => {
    onChangeFont({ ...DEFAULT_FONT_SETTINGS });
    onChangeAdvanced({ ...DEFAULT_ADVANCED_SETTINGS });
  };

  return (
    <section
      data-testid="advanced-panel"
      className="mt-6 rounded-2xl border border-slate-200 bg-paper shadow-soft print:hidden"
    >
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Advanced settings</h2>
          <p className="text-[11px] text-muted">
            Fine-tune typography, spacing and accent color.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-[11px] font-medium text-accent hover:text-accent-dark"
            onClick={resetAll}
            data-testid="advanced-reset"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="advanced-panel-body"
            data-testid="advanced-toggle"
            className="rounded-md border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            {isOpen ? 'Hide' : 'Show'}
          </button>
        </div>
      </header>

      {isOpen && (
        <div
          id="advanced-panel-body"
          className="grid gap-6 border-t border-slate-200 px-5 py-5 sm:grid-cols-2"
        >
          {FONT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {group.title}
              </p>
              {group.controls.map((control) => (
                <div
                  key={control.key}
                  className="flex items-center justify-between gap-3"
                >
                  <label
                    className="text-[12px] text-slate-700"
                    htmlFor={`font-${control.key}`}
                  >
                    {control.label}
                  </label>
                  <NumberStepper
                    value={fontSettings[control.key]}
                    min={control.min}
                    max={control.max}
                    ariaLabel={control.label}
                    onChange={(next) => setFont(control.key, next)}
                  />
                </div>
              ))}
            </div>
          ))}

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Spacing
            </p>
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] text-slate-700">
                Section gap
              </label>
              <NumberStepper
                value={advancedSettings.sectionGapPx}
                min={4}
                max={48}
                ariaLabel="Section gap"
                onChange={(next) => setAdvanced('sectionGapPx', next)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] text-slate-700">
                Paragraph spacing
              </label>
              <NumberStepper
                value={advancedSettings.paragraphSpacingPx}
                min={0}
                max={24}
                ariaLabel="Paragraph spacing"
                onChange={(next) => setAdvanced('paragraphSpacingPx', next)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] text-slate-700">Line height</label>
              <NumberStepper
                value={advancedSettings.lineHeight}
                min={1.0}
                max={2.2}
                step={0.05}
                unit="x"
                ariaLabel="Line height"
                onChange={(next) =>
                  setAdvanced('lineHeight', Math.round(next * 100) / 100)
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Page
            </p>
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] text-slate-700">
                Horizontal padding
              </label>
              <NumberStepper
                value={advancedSettings.pagePaddingXPx}
                min={0}
                max={80}
                ariaLabel="Horizontal padding"
                onChange={(next) => setAdvanced('pagePaddingXPx', next)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] text-slate-700">
                Vertical padding
              </label>
              <NumberStepper
                value={advancedSettings.pagePaddingYPx}
                min={0}
                max={80}
                ariaLabel="Vertical padding"
                onChange={(next) => setAdvanced('pagePaddingYPx', next)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] text-slate-700">
                Section dividers
              </label>
              <label className="inline-flex items-center gap-2 text-[12px] text-slate-700">
                <input
                  type="checkbox"
                  data-testid="advanced-show-dividers"
                  checked={advancedSettings.showSectionDividers}
                  onChange={(event) =>
                    setAdvanced('showSectionDividers', event.target.checked)
                  }
                />
                Show
              </label>
            </div>
          </div>

          <div className="space-y-3 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Color
            </p>
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] text-slate-700">
                Accent color (links)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-12 cursor-pointer rounded-md border border-slate-300"
                  value={advancedSettings.accentColor}
                  data-testid="advanced-accent-color"
                  onChange={(event) =>
                    setAdvanced('accentColor', event.target.value)
                  }
                  aria-label="Accent color"
                />
                <code className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                  {advancedSettings.accentColor}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
