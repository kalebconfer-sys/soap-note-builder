import { checkDrug, detectAllergens, statesNoAllergies, SEVERITY } from '../../lib/allergies.js'
import { createPlanBlock, createRx } from '../../lib/note.js'
import { hasSuggestion, suggestPlanFor } from '../../lib/planSuggestions.js'
import { TextArea } from '../fields.jsx'

const RX_FIELDS = [
  { id: 'name', label: 'Drug', placeholder: 'Drug name', className: 'sm:col-span-2' },
  { id: 'dose', label: 'Dose', placeholder: 'e.g. 10 mg' },
  { id: 'route', label: 'Route', placeholder: 'PO' },
  { id: 'frequency', label: 'Frequency', placeholder: 'Daily' },
  { id: 'quantity', label: 'Qty', placeholder: '30' },
  { id: 'refills', label: 'Refills', placeholder: '0' },
]

function AllergyFlag({ conflict }) {
  const avoid = conflict.severity === SEVERITY.AVOID
  return (
    <p
      role="alert"
      className={`mt-1.5 flex items-start gap-1.5 rounded px-2 py-1.5 text-xs ${
        avoid ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'
      }`}
    >
      <span aria-hidden="true">{avoid ? '⛔' : '⚠️'}</span>
      <span>
        <strong>{avoid ? 'Allergy conflict' : 'Cross-reactivity caution'}:</strong> {conflict.message}
      </span>
    </p>
  )
}

function RxPad({ medications, allergens, onChange }) {
  function update(id, field, value) {
    onChange(medications.map((rx) => (rx.id === id ? { ...rx, [field]: value } : rx)))
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="field-label mb-0">Prescriptions</span>
        <button type="button" className="btn-ghost px-2 py-1" onClick={() => onChange([...medications, createRx()])}>
          + Add Rx
        </button>
      </div>
      {medications.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink-200 px-3 py-3 text-xs text-ink-400">
          No prescriptions for this problem.
        </p>
      ) : (
        <ul className="space-y-2">
          {medications.map((rx) => {
            const conflict = checkDrug(rx.name, allergens)
            return (
              <li
                key={rx.id}
                className={`rounded-md border p-2 ${
                  conflict?.severity === SEVERITY.AVOID
                    ? 'border-red-300 bg-red-50/40'
                    : conflict
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-ink-200 bg-ink-50/60'
                }`}
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
                  {RX_FIELDS.map((field) => (
                    <label key={field.id} className={`block ${field.className ?? ''}`}>
                      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                        {field.label}
                      </span>
                      <input
                        className="field-input px-2 py-1"
                        value={rx[field.id]}
                        placeholder={field.placeholder}
                        onChange={(e) => update(rx.id, field.id, e.target.value)}
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    className="btn-danger self-end px-2 py-1"
                    onClick={() => onChange(medications.filter((m) => m.id !== rx.id))}
                    aria-label={`Remove ${rx.name || 'prescription'}`}
                  >
                    ✕
                  </button>
                </div>
                {conflict ? <AllergyFlag conflict={conflict} /> : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function PlanSection({ data, diagnoses, allergies, patch, suggestionNotes, setSuggestionNotes }) {
  const { blocks } = data
  // suggestionNotes explains what the engine filled in or swapped, keyed by
  // block id. It lives in NoteEditor because blocks can also be created from
  // the Assessment section, and it is guidance about the edit rather than part
  // of the note itself — it never serializes into an export.

  const allergens = detectAllergens(allergies)
  const nkda = statesNoAllergies(allergies)

  function setBlocks(next) {
    patch({ blocks: next })
  }

  function updateBlock(id, field, value) {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  function addPlanFor(dx) {
    const { block, notes } = suggestPlanFor(dx, allergies, dx.id)
    setBlocks([...blocks, block])
    if (notes.length) setSuggestionNotes((prev) => ({ ...prev, [block.id]: notes }))
  }

  /** Re-run suggestions on an existing block, without clobbering typed text. */
  function fillBlock(block) {
    const dx = diagnoses.find((d) => d.id === block.dxId)
    if (!dx) return
    const { block: suggested, notes } = suggestPlanFor(dx, allergies, dx.id)
    setBlocks(
      blocks.map((b) =>
        b.id === block.id
          ? {
              ...b,
              orders: b.orders.trim() || suggested.orders,
              education: b.education.trim() || suggested.education,
              followUp: b.followUp.trim() || suggested.followUp,
              medications: b.medications.length ? b.medications : suggested.medications,
            }
          : b,
      ),
    )
    setSuggestionNotes((prev) => ({ ...prev, [block.id]: notes }))
  }

  const unplanned = diagnoses.filter((dx) => !blocks.some((b) => b.dxId === dx.id))

  return (
    <div className="space-y-5">
      <div
        className={`rounded-md px-3 py-2 text-xs ${
          allergens.length ? 'bg-red-50 text-red-800' : nkda ? 'bg-clinic-50 text-clinic-800' : 'bg-amber-50 text-amber-900'
        }`}
      >
        {allergens.length ? (
          <>
            <strong>Documented allergies:</strong> {allergens.map((a) => a.label).join(', ')}. Prescriptions below are
            checked against these classes.
          </>
        ) : nkda ? (
          <>
            <strong>NKDA documented.</strong> No allergy conflicts to check against.
          </>
        ) : (
          <>
            <strong>No allergies documented.</strong> Fill the Allergies field in Subjective and prescriptions here get
            checked automatically.
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {unplanned.map((dx) => (
          <button key={dx.id} type="button" className="btn-ghost" onClick={() => addPlanFor(dx)}>
            + Plan for {dx.code ? `${dx.code} ` : ''}
            {dx.name || 'diagnosis'}
            {hasSuggestion(dx) ? <span className="chip bg-clinic-100 text-clinic-700">auto-fills</span> : null}
          </button>
        ))}
        <button type="button" className="btn-ghost" onClick={() => setBlocks([...blocks, createPlanBlock(null)])}>
          + General plan block
        </button>
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink-200 px-3 py-6 text-center text-sm text-ink-400">
          No plan blocks yet. Add one per diagnosis so each problem has its own orders, education, and follow-up.
        </p>
      ) : (
        <ol className="space-y-4">
          {blocks.map((block, index) => {
            const dx = diagnoses.find((d) => d.id === block.dxId)
            const notes = suggestionNotes[block.id] ?? []
            const canFill = dx && hasSuggestion(dx)
            return (
              <li key={block.id} className="rounded-md border border-ink-200 bg-white p-3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="chip bg-rose-100 text-rose-700">{index + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-ink-900">
                    {dx ? (
                      <>
                        {dx.code ? <span className="font-mono text-clinic-700">{dx.code} </span> : null}
                        {dx.name || 'Untitled diagnosis'}
                      </>
                    ) : (
                      'General plan'
                    )}
                  </span>
                  {canFill ? (
                    <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => fillBlock(block)}>
                      Fill suggestions
                    </button>
                  ) : null}
                  <select
                    className="rounded-md border border-ink-200 px-2 py-1 text-xs"
                    value={block.dxId ?? ''}
                    aria-label="Linked diagnosis"
                    onChange={(e) => updateBlock(block.id, 'dxId', e.target.value || null)}
                  >
                    <option value="">General plan</option>
                    {diagnoses.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code ? `${d.code} — ` : ''}
                        {d.name || 'Untitled'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-danger px-2 py-1"
                    onClick={() => setBlocks(blocks.filter((b) => b.id !== block.id))}
                  >
                    Remove
                  </button>
                </div>

                {notes.length ? (
                  <div className="mb-3 rounded-md bg-clinic-50 px-3 py-2">
                    {notes.map((note) => (
                      <p key={note} className="text-xs leading-relaxed text-clinic-900">
                        {note}
                      </p>
                    ))}
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-clinic-700 underline"
                      onClick={() => setSuggestionNotes((prev) => ({ ...prev, [block.id]: [] }))}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}

                <RxPad
                  medications={block.medications}
                  allergens={allergens}
                  onChange={(meds) => updateBlock(block.id, 'medications', meds)}
                />

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <TextArea
                    label="Orders / diagnostics"
                    value={block.orders}
                    onChange={(v) => updateBlock(block.id, 'orders', v)}
                    placeholder="Labs, imaging, screening tools"
                  />
                  <TextArea
                    label="Referrals"
                    value={block.referrals}
                    onChange={(v) => updateBlock(block.id, 'referrals', v)}
                    placeholder="Specialty, urgency, reason"
                  />
                  <TextArea
                    label="Patient education"
                    value={block.education}
                    onChange={(v) => updateBlock(block.id, 'education', v)}
                    placeholder="What you taught and how understanding was confirmed"
                  />
                  <TextArea
                    label="Follow-up"
                    value={block.followUp}
                    onChange={(v) => updateBlock(block.id, 'followUp', v)}
                    placeholder="Interval and return precautions"
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <TextArea
        label="General plan notes"
        value={data.general}
        onChange={(v) => patch({ general: v })}
        rows={3}
        placeholder="Anything that spans every problem — health maintenance, immunizations, return precautions."
      />

      <p className="rounded-md bg-ink-100 px-3 py-2 text-xs leading-relaxed text-ink-500">
        Auto-filled orders, education, and prescriptions are common adult starting points for study use — not a
        formulary, and not adjusted for pregnancy, renal or hepatic impairment, age, or interactions. The allergy check
        covers a short teaching list of drug classes and will miss allergies it does not recognize. Verify everything
        against current guidelines and your preceptor.
      </p>
    </div>
  )
}
