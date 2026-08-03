import { useId } from 'react'

export function TextField({ label, value, onChange, placeholder, type = 'text', hint, ...rest }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="field-input"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  )
}

export function TextArea({ label, value, onChange, placeholder, rows, hint }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="field-textarea"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  )
}

export function SelectField({ label, value, onChange, options }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Three-state control used for ROS symptoms and exam systems. Rendered as a
 * radiogroup so screen readers announce which of the three is selected and
 * arrow keys move between them.
 */
export function TriState({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-md border border-ink-200">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title ?? opt.label}
            onClick={() => onChange(active ? undefined : opt.value)}
            className={[
              'px-2 py-1 text-xs font-medium transition-colors',
              active ? opt.activeClass : 'bg-white text-ink-400 hover:bg-ink-50',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
