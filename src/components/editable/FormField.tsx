import React, { useId } from 'react';
import { getMonthInputValue } from '../../utils/dateFields';

const fieldLabelClass = 'block text-[11px] font-medium uppercase tracking-wider text-muted mb-1';
const inputClass =
  'block w-full rounded-lg border border-slate-200 bg-paper px-2.5 py-1.5 text-[13px] text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

const FieldIdContext = React.createContext<string | undefined>(undefined);

interface FieldProps {
  label: string;
  children: React.ReactNode;
  /** Span both columns in a 2-col grid. */
  fullWidth?: boolean;
}

export const Field: React.FC<FieldProps> = ({ label, children, fullWidth }) => {
  const reactId = useId();
  const id = `field-${reactId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
    </div>
  );
};

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'email' | 'tel';
  'aria-label'?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  'aria-label': ariaLabel,
}) => {
  const id = React.useContext(FieldIdContext);
  return (
    <input
      id={id}
      type={type}
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  );
};

interface TextAreaFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
}) => {
  const id = React.useContext(FieldIdContext);
  return (
    <textarea
      id={id}
      className={`${inputClass} resize-y`}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};

interface MonthFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const MonthField: React.FC<MonthFieldProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const id = React.useContext(FieldIdContext);
  return (
    <input
      id={id}
      type="month"
      className={`${inputClass} disabled:bg-slate-100 disabled:text-muted`}
      value={getMonthInputValue(value)}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  checked,
  onChange,
  label,
}) => (
  <label className="flex items-center gap-2 text-[12px] text-ink">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
    />
    {label}
  </label>
);

interface SelectFieldProps<T extends string> {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}

export const SelectField = <T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps<T>) => {
  const id = React.useContext(FieldIdContext);
  return (
    <select
      id={id}
      className={`${inputClass} appearance-none`}
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value as T) || undefined)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
