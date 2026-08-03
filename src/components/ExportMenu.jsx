import { useEffect, useRef, useState } from 'react'
import { copyToClipboard, downloadBlob, downloadText, slugify } from '../lib/download.js'
import { displayTitle, toPlainText } from '../lib/note.js'
import { useSettings } from '../store/useSettings.js'

export default function ExportMenu({ note }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const containerRef = useRef(null)
  // Individual selectors: an object-returning selector would produce a new
  // snapshot identity on every render and loop useSyncExternalStore.
  const displayName = useSettings((s) => s.displayName)
  const program = useSettings((s) => s.program)
  const school = useSettings((s) => s.school)
  const preceptor = useSettings((s) => s.preceptor)
  const profile = { displayName, program, school, preceptor }

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!status) return undefined
    const timer = setTimeout(() => setStatus(''), 3000)
    return () => clearTimeout(timer)
  }, [status])

  const baseName = slugify(displayTitle(note))

  async function exportPdf() {
    setBusy(true)
    setStatus('Building PDF…')
    try {
      // Lazy: keeps @react-pdf/renderer out of the initial page load.
      const { renderNotePdf } = await import('../lib/pdf.jsx')
      const blob = await renderNotePdf(note, profile)
      downloadBlob(blob, `${baseName}.pdf`)
      setStatus('PDF downloaded')
    } catch (error) {
      console.error(error)
      setStatus('PDF failed — try plain text export')
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function copyText() {
    const ok = await copyToClipboard(toPlainText(note, profile))
    setStatus(ok ? 'Copied to clipboard' : 'Copy blocked — use Download .txt')
    setOpen(false)
  }

  function downloadTxt() {
    downloadText(toPlainText(note, profile), `${baseName}.txt`)
    setStatus('Text file downloaded')
    setOpen(false)
  }

  function downloadJson() {
    downloadText(JSON.stringify(note, null, 2), `${baseName}.json`, 'application/json')
    setStatus('Backup downloaded')
    setOpen(false)
  }

  const items = [
    { label: 'Download PDF', hint: 'Formatted, with your header', onClick: exportPdf },
    { label: 'Copy as plain text', hint: 'Paste into an EHR or dropbox', onClick: copyText },
    { label: 'Download .txt', hint: 'Same text, as a file', onClick: downloadTxt },
    { label: 'Print', hint: 'Opens the browser print dialog', onClick: () => (setOpen(false), window.print()) },
    { label: 'Download .json backup', hint: 'Re-importable copy of this note', onClick: downloadJson },
  ]

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="btn-primary"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
      >
        {busy ? 'Exporting…' : 'Export'}
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-md border border-ink-200 bg-white shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={item.onClick}
              className="block w-full px-3 py-2 text-left hover:bg-clinic-50"
            >
              <span className="block text-sm font-medium text-ink-800">{item.label}</span>
              <span className="block text-xs text-ink-400">{item.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
      {status ? (
        <p role="status" className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-ink-500">
          {status}
        </p>
      ) : null}
    </div>
  )
}
