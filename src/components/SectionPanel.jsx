import { useId } from 'react'

const LETTER_STYLES = {
  S: 'bg-clinic-600',
  O: 'bg-indigo-600',
  A: 'bg-amber-600',
  P: 'bg-rose-600',
}

/**
 * One collapsible SOAP panel. Uses a real button + aria-controls rather than
 * <details> so the open state can be lifted into the editor (expand-all,
 * jump-to-section, print-expands-everything).
 */
export default function SectionPanel({ letter, title, hint, filled, open, onToggle, children }) {
  const contentId = useId()

  return (
    <section className="card overflow-hidden">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50"
        >
          <span
            aria-hidden="true"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm font-bold text-white ${LETTER_STYLES[letter]}`}
          >
            {letter}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink-900">{title}</span>
            {hint ? <span className="block truncate text-xs text-ink-400">{hint}</span> : null}
          </span>
          {filled ? (
            <span className="chip shrink-0 bg-clinic-50 text-clinic-700">{filled}</span>
          ) : null}
          <span aria-hidden="true" className={`shrink-0 text-ink-400 transition-transform ${open ? 'rotate-90' : ''}`}>
            ▶
          </span>
        </button>
      </h2>
      <div id={contentId} hidden={!open} className="border-t border-ink-100 px-4 py-4">
        {children}
      </div>
    </section>
  )
}
