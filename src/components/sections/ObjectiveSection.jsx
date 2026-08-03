import { EXAM_STATUS, EXAM_SYSTEMS } from '../../lib/clinical.js'
import { bmiCategory, calculateBMI } from '../../lib/note.js'
import { TextArea, TextField } from '../fields.jsx'

const VITALS = [
  { id: 'bp', label: 'BP', placeholder: '128/82', unit: 'mmHg' },
  { id: 'hr', label: 'HR', placeholder: '76', unit: 'bpm' },
  { id: 'rr', label: 'RR', placeholder: '16', unit: '/min' },
  { id: 'temp', label: 'Temp', placeholder: '98.6', unit: '°F' },
  { id: 'spo2', label: 'SpO₂', placeholder: '98', unit: '%' },
  { id: 'htIn', label: 'Height', placeholder: '68', unit: 'in' },
  { id: 'wtLb', label: 'Weight', placeholder: '170', unit: 'lb' },
]

const STATUS_BUTTONS = [
  { value: EXAM_STATUS.NORMAL, label: 'WNL', active: 'bg-clinic-600 text-white' },
  { value: EXAM_STATUS.ABNORMAL, label: 'Abnormal', active: 'bg-amber-600 text-white' },
]

function bmiTone(bmi) {
  if (bmi == null) return 'bg-ink-100 text-ink-500'
  if (bmi < 18.5 || bmi >= 30) return 'bg-amber-100 text-amber-800'
  if (bmi >= 25) return 'bg-amber-50 text-amber-700'
  return 'bg-clinic-100 text-clinic-800'
}

function ExamRow({ system, entry, onStatus, onNotes }) {
  const status = entry?.status ?? EXAM_STATUS.UNEXAMINED
  const examined = status !== EXAM_STATUS.UNEXAMINED

  return (
    <div className={`rounded-md border px-3 py-2 ${examined ? 'border-ink-200 bg-white' : 'border-dashed border-ink-200 bg-ink-50/60'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 text-sm font-medium text-ink-800">{system.label}</span>
        <div role="radiogroup" aria-label={`${system.label} exam`} className="inline-flex overflow-hidden rounded-md border border-ink-200">
          {STATUS_BUTTONS.map((button) => {
            const selected = status === button.value
            return (
              <button
                key={button.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onStatus(selected ? EXAM_STATUS.UNEXAMINED : button.value)}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  selected ? button.active : 'bg-white text-ink-400 hover:bg-ink-50'
                }`}
              >
                {button.label}
              </button>
            )
          })}
        </div>
      </div>
      {status === EXAM_STATUS.NORMAL ? (
        <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{system.normal}</p>
      ) : null}
      {examined ? (
        <textarea
          rows={status === EXAM_STATUS.ABNORMAL ? 3 : 2}
          className="field-input mt-2"
          value={entry?.notes ?? ''}
          onChange={(e) => onNotes(e.target.value)}
          aria-label={`${system.label} exam findings`}
          placeholder={
            status === EXAM_STATUS.ABNORMAL
              ? 'Describe the abnormal findings — this replaces the WNL phrasing.'
              : 'Optional addition to the normal phrasing above.'
          }
        />
      ) : null}
    </div>
  )
}

export default function ObjectiveSection({ data, patch }) {
  const bmi = calculateBMI(data.vitals.htIn, data.vitals.wtLb)
  const category = bmiCategory(bmi)

  function setVital(id, value) {
    patch({ vitals: { ...data.vitals, [id]: value } })
  }

  function setExam(systemId, next) {
    const exam = { ...data.exam }
    if (next.status === EXAM_STATUS.UNEXAMINED) delete exam[systemId]
    else exam[systemId] = { status: next.status, notes: next.notes ?? exam[systemId]?.notes ?? '' }
    patch({ exam })
  }

  function markAllNormal() {
    patch({
      exam: Object.fromEntries(
        EXAM_SYSTEMS.map((system) => [
          system.id,
          { status: EXAM_STATUS.NORMAL, notes: data.exam[system.id]?.notes ?? '' },
        ]),
      ),
    })
  }

  const examined = Object.keys(data.exam).length

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-800">Vitals</h3>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {VITALS.map((vital) => (
            <TextField
              key={vital.id}
              label={`${vital.label} (${vital.unit})`}
              value={data.vitals[vital.id]}
              onChange={(v) => setVital(vital.id, v)}
              placeholder={vital.placeholder}
              inputMode={vital.id === 'bp' ? 'text' : 'decimal'}
            />
          ))}
          <div>
            <span className="field-label">BMI (auto)</span>
            <div className={`rounded-md px-3 py-2 text-sm font-semibold ${bmiTone(bmi)}`}>
              {bmi != null ? (
                <>
                  {bmi} <span className="font-normal">· {category}</span>
                </>
              ) : (
                <span className="font-normal">Enter height and weight</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-800">
            Physical exam{' '}
            <span className="font-normal text-ink-400">
              — {examined} of {EXAM_SYSTEMS.length} systems documented
            </span>
          </h3>
          <button type="button" className="btn-ghost" onClick={markAllNormal}>
            Mark all WNL
          </button>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {EXAM_SYSTEMS.map((system) => (
            <ExamRow
              key={system.id}
              system={system}
              entry={data.exam[system.id]}
              onStatus={(status) => setExam(system.id, { status })}
              onNotes={(notes) =>
                setExam(system.id, { status: data.exam[system.id]?.status ?? EXAM_STATUS.NORMAL, notes })
              }
            />
          ))}
        </div>
      </div>

      <TextArea
        label="Diagnostics and results"
        value={data.diagnostics}
        onChange={(v) => patch({ diagnostics: v })}
        rows={4}
        placeholder="Point-of-care tests, labs, imaging, screening scores — with dates."
      />
    </div>
  )
}
