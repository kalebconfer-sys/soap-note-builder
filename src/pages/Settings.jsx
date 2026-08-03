import { useRef, useState } from 'react'
import { TextField } from '../components/fields.jsx'
import { downloadText } from '../lib/download.js'
import { normalizeNote } from '../lib/note.js'
import { useNotes } from '../store/useNotes.js'
import { useSettings } from '../store/useSettings.js'

export default function Settings() {
  const displayName = useSettings((s) => s.displayName)
  const program = useSettings((s) => s.program)
  const school = useSettings((s) => s.school)
  const preceptor = useSettings((s) => s.preceptor)
  const update = useSettings((s) => s.update)

  const notes = useNotes((s) => s.notes)
  const replaceAll = useNotes((s) => s.replaceAll)

  const fileRef = useRef(null)
  const [message, setMessage] = useState('')
  const [confirmingWipe, setConfirmingWipe] = useState(false)

  function exportAll() {
    downloadText(
      JSON.stringify({ exportedAt: new Date().toISOString(), notes }, null, 2),
      `soap-notes-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json',
    )
    setMessage(`Exported ${notes.length} note${notes.length === 1 ? '' : 's'}.`)
  }

  async function importFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      // Accept either a full backup ({notes: [...]}) or a single exported note.
      const incoming = Array.isArray(parsed?.notes) ? parsed.notes : Array.isArray(parsed) ? parsed : [parsed]
      const byId = new Map(notes.map((n) => [n.id, n]))
      for (const raw of incoming) {
        const note = normalizeNote(raw)
        byId.set(note.id, note)
      }
      replaceAll([...byId.values()])
      setMessage(`Imported ${incoming.length} note${incoming.length === 1 ? '' : 's'}.`)
    } catch {
      setMessage('That file could not be read as a SOAP Note Builder backup.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">Everything here is stored in this browser only.</p>
      </div>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-ink-900">Export header</h2>
        <p className="mb-4 mt-0.5 text-xs text-ink-500">
          Stamped onto every PDF and text export, so you type it once per term instead of once per note.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Your name" value={displayName} onChange={(v) => update({ displayName: v })} placeholder="Kaleb Confer, RN" />
          <TextField label="Program" value={program} onChange={(v) => update({ program: v })} placeholder="FNP, Class of 2027" />
          <TextField label="School" value={school} onChange={(v) => update({ school: v })} placeholder="Western Governors University" />
          <TextField label="Preceptor (optional)" value={preceptor} onChange={(v) => update({ preceptor: v })} />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-ink-900">Backup and restore</h2>
        <p className="mb-4 mt-0.5 text-xs text-ink-500">
          Notes live in this browser's local storage. Clearing site data, using a different browser, or
          switching devices means they will not be there. Export a backup before you do any of those.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={exportAll} disabled={notes.length === 0}>
            Export all notes ({notes.length})
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            Import from backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importFile} />
        </div>
        {message ? (
          <p role="status" className="mt-3 text-xs font-medium text-clinic-700">
            {message}
          </p>
        ) : null}
      </section>

      <section className="card border-red-200 p-4">
        <h2 className="text-sm font-semibold text-ink-900">Delete everything</h2>
        <p className="mb-4 mt-0.5 text-xs text-ink-500">
          Removes all {notes.length} note{notes.length === 1 ? '' : 's'} from this browser. Not recoverable.
        </p>
        {confirmingWipe ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                replaceAll([])
                setConfirmingWipe(false)
                setMessage('All notes deleted.')
              }}
            >
              Yes, delete all notes
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirmingWipe(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn-danger" onClick={() => setConfirmingWipe(true)} disabled={notes.length === 0}>
            Delete all notes
          </button>
        )}
      </section>
    </div>
  )
}
