"use client";

import { useId, type ReactNode } from "react";

type Opt = string | { value: string; label: string };
const ov = (o: Opt) => (typeof o === "string" ? o : o.value);
const ol = (o: Opt) => (typeof o === "string" ? o : o.label);

const inputCls =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm " +
  "focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30 aria-[invalid=true]:border-red-600";

function Wrapper({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
        {required && <span aria-hidden="true" className="text-red-700"> *</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-slate-600">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;

export function TextField(props: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  autoComplete?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Wrapper id={id} label={props.label} hint={props.hint} error={props.error} required={props.required}>
      <input
        id={id}
        name={props.name}
        type={props.type ?? "text"}
        inputMode={props.inputMode}
        autoComplete={props.autoComplete ?? "off"}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={!!props.error}
        aria-required={props.required}
        aria-describedby={describedBy(id, props.hint, props.error)}
        className={inputCls}
      />
    </Wrapper>
  );
}

export function TextArea(props: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Wrapper id={id} label={props.label} hint={props.hint} error={props.error} required={props.required}>
      <textarea
        id={id}
        name={props.name}
        rows={3}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={!!props.error}
        aria-required={props.required}
        aria-describedby={describedBy(id, props.hint, props.error)}
        className={inputCls}
      />
    </Wrapper>
  );
}

export function SelectField(props: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly Opt[];
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <Wrapper id={id} label={props.label} hint={props.hint} error={props.error} required={props.required}>
      <select
        id={id}
        name={props.name}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={!!props.error}
        aria-required={props.required}
        aria-describedby={describedBy(id, props.hint, props.error)}
        className={inputCls}
      >
        <option value="">Select…</option>
        {props.options.map((o) => (
          <option key={ov(o)} value={ov(o)}>
            {ol(o)}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function RadioGroup(props: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly Opt[];
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <fieldset
      className="mb-5"
      aria-invalid={!!props.error}
      aria-describedby={describedBy(id, props.hint, props.error)}
    >
      <legend className="block text-sm font-medium text-slate-800">
        {props.label}
        {props.required && <span aria-hidden="true" className="text-red-700"> *</span>}
      </legend>
      {props.hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-slate-600">
          {props.hint}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {props.options.map((o) => {
          const checked = props.value === ov(o);
          return (
            <label
              key={ov(o)}
              className={
                "flex min-h-11 cursor-pointer items-center rounded-lg border px-4 py-2 text-base " +
                (checked
                  ? "border-blue-700 bg-blue-50 font-medium text-blue-900"
                  : "border-slate-300 bg-white text-slate-800")
              }
            >
              <input
                type="radio"
                name={props.name}
                value={ov(o)}
                checked={checked}
                onChange={() => props.onChange(ov(o))}
                className="sr-only"
              />
              {ol(o)}
            </label>
          );
        })}
      </div>
      {props.error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-red-700">
          {props.error}
        </p>
      )}
    </fieldset>
  );
}

export function OrderedMultiSelect(props: {
  label: string;
  hint?: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  required?: boolean;
}) {
  const id = useId();
  const toggle = (c: string) =>
    props.onChange(props.value.includes(c) ? props.value.filter((x) => x !== c) : [...props.value, c]);
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...props.value];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    props.onChange(next);
  };
  return (
    <fieldset className="mb-5" aria-describedby={describedBy(id, props.hint, props.error)}>
      <legend className="block text-sm font-medium text-slate-800">
        {props.label}
        {props.required && <span aria-hidden="true" className="text-red-700"> *</span>}
      </legend>
      {props.hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-slate-600">
          {props.hint}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {props.options.map((c) => {
          const on = props.value.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c)}
              className={
                "min-h-11 rounded-full border px-4 py-2 text-base " +
                (on ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-800")
              }
            >
              {c}
            </button>
          );
        })}
      </div>
      {props.value.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-800">Your order of preference</p>
          <ol className="mt-2 space-y-2">
            {props.value.map((c, i) => (
              <li
                key={c}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-base text-slate-900">
                  {i + 1}. {c}
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    aria-label={`Move ${c} up`}
                    className="min-h-11 min-w-11 rounded-md text-slate-700 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    aria-label={`Remove ${c}`}
                    className="min-h-11 min-w-11 rounded-md text-slate-700"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {props.error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-red-700">
          {props.error}
        </p>
      )}
    </fieldset>
  );
}
