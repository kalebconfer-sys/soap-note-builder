import { useState } from 'react'
import { HPI_ELEMENTS, ROS_SYSTEMS } from '../../lib/clinical.js'
import { hpiFromElements } from '../../lib/note.js'
import { TextArea, TextField, TriState } from '../fields.jsx'

const ROS_OPTIONS = [
  { value: 'pos', label: '+', title: 'Reports this symptom', activeClass: 'bg-rose-600 text-white' },
  { value: 'neg', label: '−', title: 'Denies this symptom', activeClass: 'bg-clinic-600 text-white' },
]

function RosSystem({ system, marks, note, onMark, onNote }) {
  const [open, setOpen] = useState(false)
  const positives = system.symptoms.filter((s) => marks[s] === 'pos').length
  const negatives = system.symptoms.filter((s) => marks[s] === 'neg').length
  const touched = positives + negatives > 0 || !!note

  return (
    <div className={`rounded-md border ${touched ? 'border-clinic-200 bg-clinic-50/40' : 'border-ink-200 bg-white'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span className="flex-1 text-sm font-medium text-ink-800">{system.label}</span>
        {positives > 0 ? <span className="chip bg-rose-100 text-rose-700">{positives} +</span> : null}
        {negatives > 0 ? <span className="chip bg-clinic-100 text-clinic-700">{negatives} −</span> : null}
        <span aria-hidden="true" className="text-xs text-ink-400">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open ? (
        <div className="border-t border-ink-100 px-3 py-3">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {system.symptoms.map((symptom) => (
              <li key={symptom} className="flex items-center justify-between gap-2">
                <span className="text-sm text-ink-600">{symptom}</span>
                <TriState
                  label={`${system.label} — ${symptom}`}
                  value={marks[symptom]}
                  options={ROS_OPTIONS}
                  onChange={(next) => onMark(symptom, next)}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <TextField
              label="System notes"
              value={note}
              onChange={onNote}
              placeholder="Additional detail for this system"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function SubjectiveSection({ data, patch }) {
  const [rosOpen, setRosOpen] = useState(false)

  function setHpiElement(id, value) {
    patch({ hpiElements: { ...data.hpiElements, [id]: value } })
  }

  function markRos(systemId, symptom, value) {
    const system = { ...(data.ros[systemId] ?? {}) }
    if (value === undefined) delete system[symptom]
    else system[symptom] = value
    const ros = { ...data.ros, [systemId]: system }
    if (Object.keys(system).length === 0) delete ros[systemId]
    patch({ ros })
  }

  function buildHpi() {
    const generated = hpiFromElements(data.hpiElements)
    if (!generated) return
    const existing = data.hpi.trim()
    patch({ hpi: existing ? `${existing}\n\n${generated}` : generated })
  }

  const hpiPreview = hpiFromElements(data.hpiElements)
  const rosTouched = Object.keys(data.ros).length

  return (
    <div className="space-y-6">
      <TextField
        label="Chief complaint"
        value={data.chiefComplaint}
        onChange={(v) => patch({ chiefComplaint: v })}
        placeholder='"Burning chest pain for 3 days" — the patient&apos;s own words'
      />

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-800">HPI — OLDCARTS</h3>
          <button type="button" className="btn-ghost" onClick={buildHpi} disabled={!hpiPreview}>
            Build narrative from grid
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HPI_ELEMENTS.map((element) => (
            <TextField
              key={element.id}
              label={element.label}
              value={data.hpiElements[element.id]}
              onChange={(v) => setHpiElement(element.id, v)}
              placeholder={element.placeholder}
            />
          ))}
        </div>
        {hpiPreview ? (
          <p className="mt-2 rounded-md bg-ink-100 px-3 py-2 text-xs leading-relaxed text-ink-600">
            <span className="font-semibold text-ink-500">Preview: </span>
            {hpiPreview}
          </p>
        ) : null}
      </div>

      <TextArea
        label="HPI narrative"
        value={data.hpi}
        onChange={(v) => patch({ hpi: v })}
        rows={6}
        placeholder="Write the paragraph your preceptor will read."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextArea
          label="Current medications"
          value={data.medications}
          onChange={(v) => patch({ medications: v })}
          placeholder="Drug, dose, route, frequency — one per line"
        />
        <TextArea
          label="Allergies"
          value={data.allergies}
          onChange={(v) => patch({ allergies: v })}
          placeholder="NKDA, or allergen and reaction"
        />
        <TextArea label="Past medical history" value={data.pmh} onChange={(v) => patch({ pmh: v })} />
        <TextArea label="Past surgical history" value={data.psh} onChange={(v) => patch({ psh: v })} />
        <TextArea label="Family history" value={data.familyHx} onChange={(v) => patch({ familyHx: v })} />
        <TextArea
          label="Social history"
          value={data.socialHx}
          onChange={(v) => patch({ socialHx: v })}
          placeholder="Tobacco, alcohol, substances, occupation, living situation"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setRosOpen((v) => !v)}
          aria-expanded={rosOpen}
          className="mb-2 flex w-full items-center gap-2 text-left"
        >
          <h3 className="text-sm font-semibold text-ink-800">Review of systems</h3>
          <span className="text-xs text-ink-400">
            {rosTouched ? `${rosTouched} system${rosTouched === 1 ? '' : 's'} documented` : 'None documented'}
          </span>
          <span aria-hidden="true" className="ml-auto text-xs text-ink-400">
            {rosOpen ? '▲ Hide' : '▼ Show'}
          </span>
        </button>
        {rosOpen ? (
          <>
            <p className="mb-2 text-xs text-ink-400">
              <span className="font-semibold text-rose-600">+</span> the patient reports it,{' '}
              <span className="font-semibold text-clinic-600">−</span> the patient denies it. Untouched
              symptoms stay out of the note.
            </p>
            <div className="grid gap-2 lg:grid-cols-2">
              {ROS_SYSTEMS.map((system) => (
                <RosSystem
                  key={system.id}
                  system={system}
                  marks={data.ros[system.id] ?? {}}
                  note={data.rosNotes[system.id] ?? ''}
                  onMark={(symptom, value) => markRos(system.id, symptom, value)}
                  onNote={(value) => patch({ rosNotes: { ...data.rosNotes, [system.id]: value } })}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
