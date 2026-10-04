import type {InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes} from 'react'

/**
 * Small, consistent form primitives. Every control shows its own error right
 * underneath it and is wired up for screen readers.
 */

interface FieldShellProps {
  readonly id: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly optional?: boolean
  readonly children: ReactNode
}

export function FieldShell({id, label, error, hint, optional, children}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-faint">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-sale" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const controlClass =
  'w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none aria-[invalid=true]:border-sale'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> & {
  readonly id: string
  readonly name: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly optional?: boolean
}

export function TextField({id, name, label, error, hint, optional, ...rest}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={controlClass}
        {...rest}
      />
    </FieldShell>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name'> & {
  readonly id: string
  readonly name: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly optional?: boolean
}

export function TextAreaField({id, name, label, error, hint, optional, ...rest}: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${controlClass} min-h-28 resize-y`}
        {...rest}
      />
    </FieldShell>
  )
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'name'> & {
  readonly id: string
  readonly name: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly optional?: boolean
  readonly options: readonly {readonly value: string; readonly label: string}[]
  readonly placeholder?: string
}

export function SelectField({id, name, label, error, hint, optional, options, placeholder, ...rest}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        className={controlClass}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

export function RadioCard({
  name,
  value,
  label,
  description,
  defaultChecked,
}: {
  readonly name: string
  readonly value: string
  readonly label: string
  readonly description?: string
  readonly defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 accent-[var(--color-accent)]" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-xs text-ink-muted">{description}</span>}
      </span>
    </label>
  )
}

export function SubmitButton({children, pending}: {children: ReactNode; pending: boolean}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? 'Sending…' : children}
    </button>
  )
}

export function FormNotice({status, message}: {status: 'idle' | 'success' | 'error'; message: string | null}) {
  if (status === 'idle' || !message) return null
  const tone =
    status === 'success' ? 'border-success/30 bg-success-soft text-success' : 'border-sale/30 bg-sale-soft text-sale'
  return (
    <p role={status === 'error' ? 'alert' : 'status'} className={`rounded-control border px-3.5 py-2.5 text-sm ${tone}`}>
      {message}
    </p>
  )
}

/** Invisible to people, irresistible to bots. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor="website">Website</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}
