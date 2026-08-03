import { createPlanBlock, createRx } from '../../lib/note.js'
import { TextArea } from '../fields.jsx'

const RX_FIELDS = [
  { id: 'name', label: 'Drug', placeholder: 'Lisinopril', className: 'sm:col-span-2' },
  { id: 'dose', label: 'Dose', placeholder: '10 mg' },
  { id: 'route', label: 'Route', placeholder: 'PO' },
  { id: 'frequency', label: 'Frequency', placeholder: 'Daily' },
  { id: 'quantity', label: 'Qty', placeholder: '30' },
  { id: 'refills', label: 'Refills', placeholder: '3' },
]

function RxPad({ medications, onChange }) {
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
          {medications.map((rx) => (
            <li key={rx.id} className="rounded-md border border-ink-200 bg-ink-50/60 p-2">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function PlanSection({ data, diagnoses, patch }) {
  const { blocks } = data

  function setBlocks(next) {
    patch({ blocks: next })
  }

  function updateBlock(id, field, value) {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  // Diagnoses that do not have a plan block yet — the common next action.
  const unplanned = diagnoses.filter((dx) => !blocks.some((b) => b.dxId === dx.id))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {unplanned.map((dx) => (
          <button
            key={dx.id}
            type="button"
            className="btn-ghost"
            onClick={() => setBlocks([...blocks, createPlanBlock(dx.id)])}
          >
            + Plan for {dx.code ? `${dx.code} ` : ''}
            {dx.name || 'diagnosis'}
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

                <RxPad medications={block.medications} onChange={(meds) => updateBlock(block.id, 'medications', meds)} />

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
    </div>
  )
}
