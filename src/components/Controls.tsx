import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Term } from './Term';

interface FieldLabelProps {
  htmlFor?: string;
  children: ReactNode;
  term?: string;
}

export function FieldLabel({ htmlFor, children, term }: FieldLabelProps) {
  return (
    <span className="field-label-row">
      {htmlFor ? <label htmlFor={htmlFor}>{children}</label> : <span>{children}</span>}
      {term ? <Term term={term} showText={false} /> : null}
    </span>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  term?: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function NumberField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  term,
  hint,
  disabled,
  onChange,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  return (
    <div className={`field${disabled ? ' is-disabled' : ''}`}>
      <FieldLabel htmlFor={id} term={term}>
        {label}
      </FieldLabel>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        disabled={disabled}
        onFocus={() => setEditing(true)}
        onBlur={() => {
          setEditing(false);
          const parsed = Number(draft);
          const next =
            draft.trim() === '' || !Number.isFinite(parsed)
              ? value
              : Math.min(max, Math.max(min, parsed));
          setDraft(String(next));
          if (next !== value) onChange(next);
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const next = Number(raw);
          if (raw.trim() !== '' && Number.isFinite(next)) {
            onChange(Math.min(max, Math.max(min, next)));
          }
        }}
      />
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

interface RangeFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  term?: string;
  hint?: string;
  disabled?: boolean;
  valueLabel?: string;
  onChange: (value: number) => void;
}

export function RangeField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  term,
  hint,
  disabled,
  valueLabel,
  onChange,
}: RangeFieldProps) {
  return (
    <div className={`field${disabled ? ' is-disabled' : ''}`}>
      <span className="field-label-row is-split">
        <FieldLabel htmlFor={id} term={term}>
          {label}
        </FieldLabel>
        <output className="range-value" htmlFor={id}>
          {valueLabel ?? value}
        </output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  term?: string;
  hint?: string;
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  term,
  hint,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <div className="field">
      <FieldLabel htmlFor={id} term={term}>
        {label}
      </FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  legend: string;
  value: T;
  options: { value: T; label: string; detail?: string }[];
  term?: string;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  legend,
  value,
  options,
  term,
  onChange,
}: SegmentedProps<T>) {
  const id = useId();
  return (
    <fieldset className="field segmented-field">
      <legend className="field-label-row">
        <span>{legend}</span>
        {term ? <Term term={term} showText={false} /> : null}
      </legend>
      <div className="segmented" role="group" aria-labelledby={id}>
        <span id={id} className="sr-only">
          {legend}
        </span>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="segment"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            title={option.detail}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface ToggleFieldProps {
  id: string;
  label: string;
  checked: boolean;
  term?: string;
  hint?: string;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ id, label, checked, term, hint, onChange }: ToggleFieldProps) {
  return (
    <div className="field">
      <div className="toggle-row">
        <label htmlFor={id}>{label}</label>
        <span className="toggle-wrap">
          <input
            id={id}
            type="checkbox"
            role="switch"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className="toggle-track" aria-hidden="true">
            <span className="toggle-thumb" />
          </span>
        </span>
        {term ? <Term term={term} showText={false} /> : null}
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

interface ControlSectionProps {
  title: string;
  summary?: string;
  defaultOpen: boolean;
  children: ReactNode;
}

export function ControlSection({ title, summary, defaultOpen, children }: ControlSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <section className={`control-section${open ? ' is-open' : ''}`}>
      <h3 className="control-heading">
        <button
          type="button"
          className="control-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            {title}
            {summary ? <small>{summary}</small> : null}
          </span>
          <span className="control-chevron" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </button>
      </h3>
      {open ? <div className="control-body">{children}</div> : null}
    </section>
  );
}
