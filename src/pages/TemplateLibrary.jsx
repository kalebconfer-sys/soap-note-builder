import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SPECIALTIES, specialtyLabel } from '../lib/clinical.js'
import { TEMPLATES } from '../lib/templates.js'

export default function TemplateLibrary() {
  const [specialty, setSpecialty] = useState('all')
  const visible = TEMPLATES.filter((t) => (specialty === 'all' ? true : t.specialty === specialty))
  const used = new Set(TEMPLATES.map((t) => t.specialty))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">Templates</h1>
        <p className="text-sm text-ink-500">
          Each one seeds the sections you would fill anyway — the exam systems, the ROS, and the prompts
          your program expects. Nothing is locked; edit anything after it loads.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[{ id: 'all', label: 'All' }, ...SPECIALTIES.filter((s) => used.has(s.id))].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSpecialty(option.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              specialty === option.id
                ? 'bg-clinic-600 text-white'
                : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((template) => (
          <li key={template.id} className="card flex flex-col p-4">
            <span className="chip mb-2 self-start bg-clinic-50 text-clinic-700">
              {specialtyLabel(template.specialty)}
            </span>
            <h2 className="text-sm font-semibold text-ink-900">{template.title}</h2>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-500">{template.description}</p>
            <Link to={`/notes/new?template=${template.id}`} className="btn-primary mt-4">
              Use this template
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
