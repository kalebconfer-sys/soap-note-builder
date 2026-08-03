import { useMemo, useState } from 'react'
import { searchICD10 } from '../../lib/clinical.js'
import { createDiagnosis } from '../../lib/note.js'
import { TextArea } from '../fields.jsx'

const MAX_DIAGNOSES = 6 // primary + 5 secondary, per the spec

/**
 * Offline ICD-10 picker. Searching the bundled code list keeps diagnosis
 * lookup instant and free — no API key, no quota, works on campus wifi that
 * blocks everything.
 */
function DiagnosisSearch({ onPick, disabled }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchICD10(query), [query])

  function pick(entry) {
    onPick(createDiagnosis({ code: entry.code, name: entry.name }))
    setQuery('')
  }

  function addFreeText() {
    const name = query.trim()
    if (!name) return
    onPick(createDiagnosis({ name }))
    setQuery('')
  }

  return (
    <div className="relative">
      <label htmlFor="dx-search" className="field-label">
        Add diagnosis
      </label>
      <input
        id="dx-search"
        className="field-input"
        value={query}
        disabled={disabled}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls="dx-results"
        aria-autocomplete="list"
        placeholder={disabled ? 'Maximum of 6 diagnoses' : 'Search by name, code, or shorthand — "htn", "I10", "uti"'}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (results.length) pick(results[0])
          else addFreeText()
        }}
      />
      {query.trim() ? (
        <ul id="dx-results" className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-ink-200 bg-white shadow-lg">
          {results.map((entry) => (
            <li key={entry.code}>
              <button
                type="button"
                onClick={() => pick(entry)}
                className="flex w-full items-baseline gap-3 px-3 py-2 text-left hover:bg-clinic-50"
              >
                <span className="font-mono text-xs font-semibold text-clinic-700">{entry.code}</span>
                <span className="text-sm text-ink-700">{entry.name}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-ink-100">
            <button
              type="button"
              onClick={addFreeText}
              className="w-full px-3 py-2 text-left text-sm text-ink-500 hover:bg-ink-50"
            >
              Add “{query.trim()}” without a code
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  )
}

export default function AssessmentSection({ data, patch, onAddDiagnosis }) {
  const { diagnoses } = data

  function setDiagnoses(next) {
    patch({ diagnoses: next })
  }

  function move(index, delta) {
    const target = index + delta
    if (target < 0 || target >= diagnoses.length) return
    const next = [...diagnoses]
    ;[next[index], next[target]] = [next[target], next[index]]
    setDiagnoses(next)
  }

  return (
    <div className="space-y-5">
      <DiagnosisSearch disabled={diagnoses.length >= MAX_DIAGNOSES} onPick={onAddDiagnosis} />
      <p className="-mt-3 text-xs text-ink-400">
        Adding a diagnosis also builds its Plan block — orders, education, follow-up, and a first-line
        prescription checked against the allergies you documented.
      </p>

      {diagnoses.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink-200 px-3 py-6 text-center text-sm text-ink-400">
          No diagnoses yet. The first one you add becomes the primary.
        </p>
      ) : (
        <ol className="space-y-3">
          {diagnoses.map((dx, index) => (
            <li key={dx.id} className="rounded-md border border-ink-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`chip ${index === 0 ? 'bg-amber-100 text-amber-800' : 'bg-ink-100 text-ink-600'}`}
                >
                  {index === 0 ? 'Primary' : `Secondary ${index}`}
                </span>
                {dx.code ? (
                  <span className="font-mono text-xs font-semibold text-clinic-700">{dx.code}</span>
                ) : null}
                <input
                  className="min-w-[12rem] flex-1 rounded border border-transparent px-1 py-0.5 text-sm font-medium text-ink-900 hover:border-ink-200 focus:border-clinic-400 focus:outline-none"
                  value={dx.name}
                  aria-label="Diagnosis name"
                  onChange={(e) =>
                    setDiagnoses(diagnoses.map((d) => (d.id === dx.id ? { ...d, name: e.target.value } : d)))
                  }
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${dx.name || 'diagnosis'} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    onClick={() => move(index, 1)}
                    disabled={index === diagnoses.length - 1}
                    aria-label={`Move ${dx.name || 'diagnosis'} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-danger px-2 py-1"
                    onClick={() => setDiagnoses(diagnoses.filter((d) => d.id !== dx.id))}
                    aria-label={`Remove ${dx.name || 'diagnosis'}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                className="field-input mt-2"
                value={dx.reasoning}
                aria-label={`Reasoning for ${dx.name || 'diagnosis'}`}
                placeholder="Supporting findings, differentials considered, and why they were ruled out."
                onChange={(e) =>
                  setDiagnoses(diagnoses.map((d) => (d.id === dx.id ? { ...d, reasoning: e.target.value } : d)))
                }
              />
            </li>
          ))}
        </ol>
      )}

      <TextArea
        label="Overall clinical reasoning"
        value={data.reasoning}
        onChange={(v) => patch({ reasoning: v })}
        rows={5}
        placeholder="Tie the subjective and objective findings together. This is the paragraph preceptors grade hardest."
      />
    </div>
  )
}
