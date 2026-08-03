import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SPECIALTIES, specialtyLabel } from '../lib/clinical.js'
import { completeness, displayTitle, NOTE_STATUS } from '../lib/note.js'
import { useNotes } from '../store/useNotes.js'

const STATUS_TONE = {
  [NOTE_STATUS.DRAFT]: 'bg-ink-100 text-ink-600',
  [NOTE_STATUS.COMPLETE]: 'bg-clinic-100 text-clinic-800',
  [NOTE_STATUS.ARCHIVED]: 'bg-amber-100 text-amber-800',
}

function relativeDate(iso) {
  const date = new Date(iso)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days === 0) return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

function NoteCard({ note, onDuplicate, onDelete }) {
  const percent = completeness(note)
  return (
    <li className="card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <Link to={`/notes/${note.id}`} className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink-900">{displayTitle(note)}</h3>
          <p className="mt-0.5 text-xs text-ink-400">
            {specialtyLabel(note.specialty)} · {relativeDate(note.updatedAt)}
          </p>
        </Link>
        <span className={`chip shrink-0 ${STATUS_TONE[note.status] ?? STATUS_TONE.draft}`}>{note.status}</span>
      </div>

      {note.sections.A.diagnoses.length ? (
        <p className="mt-2 truncate text-xs text-ink-500">
          {note.sections.A.diagnoses
            .map((dx) => [dx.code, dx.name].filter(Boolean).join(' '))
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-clinic-500" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-[11px] font-medium text-ink-400">{percent}%</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link to={`/notes/${note.id}`} className="btn-ghost px-2 py-1 text-xs">
          Open
        </Link>
        <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onDuplicate(note.id)}>
          Duplicate
        </button>
        <button type="button" className="btn-danger ml-auto px-2 py-1 text-xs" onClick={() => onDelete(note)}>
          Delete
        </button>
      </div>
    </li>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const notes = useNotes((s) => s.notes)
  const duplicateNote = useNotes((s) => s.duplicateNote)
  const deleteNote = useNotes((s) => s.deleteNote)

  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [status, setStatus] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter((note) => (specialty === 'all' ? true : note.specialty === specialty))
      .filter((note) => (status === 'all' ? true : note.status === status))
      .filter((note) => {
        if (!q) return true
        const haystack = [
          note.title,
          note.sections.S.chiefComplaint,
          ...note.sections.A.diagnoses.map((dx) => `${dx.code} ${dx.name}`),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [notes, query, specialty, status])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">Your notes</h1>
          <p className="text-sm text-ink-500">
            {notes.length === 0
              ? 'Nothing saved yet.'
              : `${notes.length} note${notes.length === 1 ? '' : 's'} saved in this browser.`}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link to="/templates" className="btn-ghost">
            Start from template
          </Link>
          <Link to="/notes/new" className="btn-primary">
            + New note
          </Link>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <input
            className="field-input max-w-xs flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, complaint, or diagnosis"
            aria-label="Search notes"
          />
          <select
            className="field-input w-auto"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            aria-label="Filter by specialty"
          >
            <option value="all">All specialties</option>
            {SPECIALTIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="field-input w-auto"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {Object.values(NOTE_STATUS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-ink-900">Write your first SOAP note</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
            Start blank, or pick a specialty template that pre-fills the exam systems and ROS you would
            document anyway.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/notes/new" className="btn-primary">
              Start a blank note
            </Link>
            <Link to="/templates" className="btn-ghost">
              Browse templates
            </Link>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p className="card px-6 py-10 text-center text-sm text-ink-500">No notes match those filters.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDuplicate={(id) => {
                const copyId = duplicateNote(id)
                if (copyId) navigate(`/notes/${copyId}`)
              }}
              onDelete={setPendingDelete}
            />
          ))}
        </ul>
      )}

      {pendingDelete ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/40 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="card w-full max-w-sm p-5">
            <h2 id="delete-title" className="text-sm font-semibold text-ink-900">
              Delete “{displayTitle(pendingDelete)}”?
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              This note only exists in this browser. Deleting it cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  deleteNote(pendingDelete.id)
                  setPendingDelete(null)
                }}
              >
                Delete note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
