import { useEffect, useRef, useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { formatMonthForDisplay, getMonthInputValue } from '../../utils/dateFields';

interface EditableMonthProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const parseYearFromValue = (value: string): number => {
  const iso = getMonthInputValue(value);
  if (iso) {
    const yearPart = Number.parseInt(iso.slice(0, 4), 10);
    if (Number.isFinite(yearPart)) return yearPart;
  }
  return new Date().getFullYear();
};

const parseMonthFromValue = (value: string): string | null => {
  const iso = getMonthInputValue(value);
  return iso ? iso.slice(5, 7) : null;
};

export const EditableMonth: React.FC<EditableMonthProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  ariaLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState<number>(() => parseYearFromValue(value));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setYear(parseYearFromValue(value));
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    document.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  if (disabled) {
    return <span className={className}>{placeholder}</span>;
  }

  const display = value ? formatMonthForDisplay(value) : '';
  const hasValue = display.length > 0;
  const selectedMonth = parseMonthFromValue(value);
  const selectedYear = parseYearFromValue(value);

  const pickMonth = (monthValue: string) => {
    onChange(`${year}-${monthValue}`);
    setIsOpen(false);
  };

  const clearValue = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`group/edit inline-flex items-center gap-1 rounded-[3px] px-0.5 -mx-0.5 transition hover:bg-accent/8 hover:outline hover:outline-1 hover:outline-accent/20 ${
          hasValue ? '' : 'italic text-muted/70'
        } ${className}`}
      >
        <span>{hasValue ? display : placeholder}</span>
        <CalendarDaysIcon
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 text-accent opacity-0 transition group-hover/edit:opacity-100"
        />
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-label={ariaLabel ? `${ariaLabel} picker` : 'Date picker'}
          className="absolute right-0 top-full z-40 mt-1 w-[220px] rounded-xl border border-slate-200 bg-paper p-2 shadow-lift"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-slate-100 hover:text-ink"
            >
              ‹
            </button>
            <span className="text-[12px] font-semibold text-ink">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              aria-label="Next year"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-slate-100 hover:text-ink"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((month) => {
              const isSelected =
                selectedMonth === month.value && selectedYear === year;
              return (
                <button
                  key={month.value}
                  type="button"
                  onClick={() => pickMonth(month.value)}
                  aria-label={`${month.label} ${year}`}
                  className={`rounded-md px-1 py-1.5 text-[11px] font-medium transition ${
                    isSelected
                      ? 'bg-accent text-paper shadow-soft'
                      : 'text-slate-700 hover:bg-accent/10 hover:text-accent-dark'
                  }`}
                >
                  {month.label}
                </button>
              );
            })}
          </div>
          {hasValue && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={clearValue}
                className="w-full rounded-md px-1 py-1 text-[10px] font-medium text-muted transition hover:bg-red-50 hover:text-red-600"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
