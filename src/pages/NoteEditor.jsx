import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ExportMenu from '../components/ExportMenu.jsx'
import SectionPanel from '../components/SectionPanel.jsx'
import { SelectField } from '../components/fields.jsx'
import AssessmentSection from '../components/sections/AssessmentSection.jsx'
import ObjectiveSection from '../components/sections/ObjectiveSection.jsx'
import PlanSection from '../components/sections/PlanSection.jsx'
import SubjectiveSection from '../components/sections/SubjectiveSection.jsx'
import { SPECIALTIES } from '../lib/clinical.js'
import { completeness, displayTitle, NOTE_STATUS } from '../lib/note.js'
import { suggestPlanFor } from '../lib/planSuggestions.js'
import { getTemplate } from '../lib/templates.js'
import { useNotes } from '../store/useNotes.js'

const STATUS_OPTIONS = [
  { value: NOTE_STATUS.DRAFT, label: 'Draft' },
  { value: NOTE_STATUS.COMPLETE, label: 'Complete' },
  { value: NOTE_STATUS.ARCHIVED, label: 'Archived' },
]

function savedLabel(iso) {
  if (!iso) return 'Not saved yet'
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 5) return 'Saved just now'
  if (seconds < 60) return `Saved ${seconds}s ago`
  if (seconds < 3600) return `Saved ${Math.round(seconds / 60)}m ago`
  return `Saved ${new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

function hintFor(note) {
  const s = note.sections
  return {
    S: s.S.chiefComplaint.trim() || 'Chief complaint, HPI, history, ROS',
    O: [
      s.O.vitals.bp ? `BP ${s.O.vitals.bp}` : null,
      Object.keys(s.O.exam).length ? `${Object.keys(s.O.exam).length} exam systems` : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Vitals, physical exam, diagnostics',
    A: s.A.diagnoses.length
      ? s.A.diagnoses.map((d) => d.code || d.name).filter(Boolean).join(', ')
      : 'Diagnoses with ICD-10, clinical reasoning',
    P: s.P.blocks.length ? `${s.P.blocks.length} plan block${s.P.blocks.length === 1 ? '' : 's'}` : 'Orders, Rx, education, follow-up',
  }
}

export default function NoteEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createdRef = useRef(false)

  const notes = useNotes((s) => s.notes)
  const lastSavedAt = useNotes((s) => s.lastSavedAt)
  const addNote = useNotes((s) => s.addNote)
  const patchNote = useNotes((s) => s.patchNote)
  const patchSection = useNotes((s) => s.patchSection)
  const patchSections = useNotes((s) => s.patchSections)

  const note = id ? notes.find((n) => n.id === id) : null
  const [open, setOpen] = useState({ S: true, O: false, A: false, P: false })
  // Explanations from the plan suggestion engine, keyed by plan block id.
  // Owned here because blocks get created from both A and P.
  const [suggestionNotes, setSuggestionNotes] = useState({})
  // Re-render the "saved Xm ago" label without touching the store.
  const [, setTick] = useState(0)

  // /notes/new — mint the note (optionally from a template) and swap the URL
  // for its real id so refresh and back both land on the same note. The ref
  // guard keeps StrictMode's double effect from creating two notes.
  useEffect(() => {
    if (id || createdRef.current) return
    createdRef.current = true
    const templateId = searchParams.get('template')
    const template = templateId ? getTemplate(templateId) : null
    const newId = addNote(
      template
        ? { title: template.title, specialty: template.specialty, sections: template.build() }
        : {},
    )
    navigate(`/notes/${newId}`, { replace: true })
  }, [id, addNote, navigate, searchParams])

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 20000)
    return () => clearInterval(timer)
  }, [])

  if (!id) return <p className="text-sm text-ink-500">Creating note…</p>

  if (!note) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-ink-600">That note is not in this browser.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Back to notes
        </Link>
      </div>
    )
  }

  /**
   * Adding a diagnosis also builds its plan block, so the two sections are
   * written together. The Plan panel opens as well — otherwise the work
   * happens behind a collapsed header and looks like nothing happened.
   */
  function addDiagnosis(dx) {
    const { block, notes: explanation } = suggestPlanFor(dx, note.sections.S.allergies, dx.id)
    patchSections(note.id, {
      A: { diagnoses: [...note.sections.A.diagnoses, dx] },
      P: { blocks: [...note.sections.P.blocks, block] },
    })
    if (explanation.length) setSuggestionNotes((prev) => ({ ...prev, [block.id]: explanation }))
    setOpen((prev) => ({ ...prev, P: true }))
  }

  const percent = completeness(note)
  const hints = hintFor(note)
  const panels = [
    { letter: 'S', title: 'Subjective', body: <SubjectiveSection data={note.sections.S} patch={(p) => patchSection(note.id, 'S', p)} /> },
    { letter: 'O', title: 'Objective', body: <ObjectiveSection data={note.sections.O} patch={(p) => patchSection(note.id, 'O', p)} /> },
    {
      letter: 'A',
      title: 'Assessment',
      body: (
        <AssessmentSection
          data={note.sections.A}
          patch={(p) => patchSection(note.id, 'A', p)}
          onAddDiagnosis={addDiagnosis}
        />
      ),
    },
    {
      letter: 'P',
      title: 'Plan',
      body: (
        <PlanSection
          data={note.sections.P}
          diagnoses={note.sections.A.diagnoses}
          allergies={note.sections.S.allergies}
          patch={(p) => patchSection(note.id, 'P', p)}
          suggestionNotes={suggestionNotes}
          setSuggestionNotes={setSuggestionNotes}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="no-print card p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="note-title" className="field-label">
              Note title
            </label>
            <input
              id="note-title"
              className="w-full rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-ink-900 hover:border-ink-200 focus:border-clinic-400 focus:outline-none"
              value={note.title}
              placeholder={displayTitle(note)}
              onChange={(e) => patchNote(note.id, { title: e.target.value })}
            />
          </div>
          <div className="w-44">
            <SelectField
              label="Specialty"
              value={note.specialty}
              onChange={(v) => patchNote(note.id, { specialty: v })}
              options={SPECIALTIES.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
          <div className="w-36">
            <SelectField
              label="Status"
              value={note.status}
              onChange={(v) => patchNote(note.id, { status: v })}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="self-end">
            <ExportMenu note={note} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="h-1.5 min-w-[8rem] flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-clinic-500 transition-all"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Note completeness"
            />
          </div>
          <span className="text-xs font-medium text-ink-500">{percent}% complete</span>
          <span aria-hidden="true" className="text-ink-200">
            |
          </span>
          <span className="text-xs text-ink-400">{savedLabel(lastSavedAt)}</span>
          <button
            type="button"
            className="btn-ghost ml-auto px-2 py-1"
            onClick={() => {
              const allOpen = Object.values(open).every(Boolean)
              setOpen({ S: !allOpen, O: !allOpen, A: !allOpen, P: !allOpen })
            }}
          >
            {Object.values(open).every(Boolean) ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {panels.map((panel) => (
        <SectionPanel
          key={panel.letter}
          letter={panel.letter}
          title={panel.title}
          hint={hints[panel.letter]}
          open={open[panel.letter]}
          onToggle={() => setOpen((prev) => ({ ...prev, [panel.letter]: !prev[panel.letter] }))}
        >
          {panel.body}
        </SectionPanel>
      ))}

      <div className="no-print flex flex-wrap items-center gap-2 pt-2">
        <Link to="/" className="btn-ghost">
          ← All notes
        </Link>
        <p className="text-xs text-ink-400">
          Saved automatically in this browser. Export a PDF or .json backup before clearing site data.
        </p>
      </div>
    </div>
  )
}
