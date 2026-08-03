/**
 * The note domain model: shape, factory, derived values, and serialization.
 *
 * Kept free of React and of storage concerns so it can be unit-tested directly
 * and reused by the PDF renderer, the text exporter, and (later) a server.
 */

import { EXAM_STATUS, EXAM_SYSTEMS, HPI_ELEMENTS, ROS_SYSTEMS, specialtyLabel } from './clinical.js'

export const NOTE_STATUS = {
  DRAFT: 'draft',
  COMPLETE: 'complete',
  ARCHIVED: 'archived',
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

export function emptySections() {
  return {
    S: {
      chiefComplaint: '',
      hpiElements: Object.fromEntries(HPI_ELEMENTS.map((e) => [e.id, ''])),
      hpi: '',
      medications: '',
      allergies: '',
      pmh: '',
      psh: '',
      familyHx: '',
      socialHx: '',
      // { [systemId]: { [symptom]: 'pos' | 'neg' }, notes: { [systemId]: string } }
      ros: {},
      rosNotes: {},
    },
    O: {
      vitals: { bp: '', hr: '', rr: '', temp: '', spo2: '', htIn: '', wtLb: '' },
      // { [systemId]: { status, notes } }
      exam: {},
      diagnostics: '',
    },
    A: {
      // [{ id, code, name, reasoning }] — index 0 is the primary diagnosis.
      diagnoses: [],
      reasoning: '',
    },
    P: {
      // [{ id, dxId, medications: [...], orders, referrals, education, followUp }]
      blocks: [],
      general: '',
    },
  }
}

export function createNote(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: '',
    specialty: 'family',
    status: NOTE_STATUS.DRAFT,
    createdAt: now,
    updatedAt: now,
    sections: emptySections(),
    ...overrides,
  }
}

export function createPlanBlock(dxId = null) {
  return {
    id: uid(),
    dxId,
    medications: [],
    orders: '',
    referrals: '',
    education: '',
    followUp: '',
  }
}

export function createRx() {
  return { id: uid(), name: '', dose: '', route: '', frequency: '', quantity: '', refills: '' }
}

export function createDiagnosis(partial = {}) {
  return { id: uid(), code: '', name: '', reasoning: '', ...partial }
}

/**
 * Migrate a persisted note to the current shape. localStorage holds notes
 * written by older builds, so every read path goes through this.
 */
export function normalizeNote(raw) {
  const base = createNote()
  if (!raw || typeof raw !== 'object') return base
  const s = raw.sections ?? {}
  return {
    ...base,
    ...raw,
    sections: {
      S: { ...base.sections.S, ...(s.S ?? {}) },
      O: {
        ...base.sections.O,
        ...(s.O ?? {}),
        vitals: { ...base.sections.O.vitals, ...(s.O?.vitals ?? {}) },
        exam: s.O?.exam ?? {},
      },
      A: { ...base.sections.A, ...(s.A ?? {}), diagnoses: s.A?.diagnoses ?? [] },
      P: { ...base.sections.P, ...(s.P ?? {}), blocks: s.P?.blocks ?? [] },
    },
  }
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

/**
 * BMI from height in inches and weight in pounds.
 * BMI = 703 * lb / in^2. Returns null when either input is missing or invalid.
 */
export function calculateBMI(heightIn, weightLb) {
  const h = parseFloat(heightIn)
  const w = parseFloat(weightLb)
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null
  return Math.round((703 * w) / (h * h) * 10) / 10
}

/** CDC adult weight categories. */
export function bmiCategory(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obesity class I'
  if (bmi < 40) return 'Obesity class II'
  return 'Obesity class III'
}

/** Percent of the note's meaningful fields that carry content. */
export function completeness(note) {
  const s = note.sections
  const checks = [
    !!s.S.chiefComplaint.trim(),
    !!(s.S.hpi.trim() || Object.values(s.S.hpiElements ?? {}).some((v) => v.trim())),
    !!s.S.medications.trim(),
    !!s.S.allergies.trim(),
    Object.keys(s.S.ros ?? {}).length > 0,
    Object.values(s.O.vitals).some((v) => String(v).trim()),
    Object.keys(s.O.exam ?? {}).length > 0,
    s.A.diagnoses.length > 0,
    !!s.A.reasoning.trim(),
    s.P.blocks.length > 0 || !!s.P.general.trim(),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

/** A human title for an untitled note, derived from its chief complaint. */
export function displayTitle(note) {
  if (note.title.trim()) return note.title.trim()
  const cc = note.sections.S.chiefComplaint.trim()
  if (cc) return cc.length > 60 ? `${cc.slice(0, 57)}…` : cc
  return 'Untitled note'
}

// ---------------------------------------------------------------------------
// Serialization to plain text (used by copy-to-EHR, print, and the PDF layer)
// ---------------------------------------------------------------------------

function joinFilled(parts, sep = ' ') {
  return parts.filter((p) => p && String(p).trim()).join(sep)
}

/** "Onset: 3 days ago. Location: substernal." from the OLDCARTS grid. */
export function hpiFromElements(elements = {}) {
  return HPI_ELEMENTS.map((e) => {
    const val = (elements[e.id] ?? '').trim()
    return val ? `${e.label}: ${val}.` : null
  })
    .filter(Boolean)
    .join(' ')
}

/** "Constitutional: Reports fatigue. Denies fever, chills." */
export function rosNarrative(ros = {}, rosNotes = {}) {
  const lines = []
  for (const system of ROS_SYSTEMS) {
    const marks = ros[system.id] ?? {}
    const positives = system.symptoms.filter((sym) => marks[sym] === 'pos')
    const negatives = system.symptoms.filter((sym) => marks[sym] === 'neg')
    const note = (rosNotes[system.id] ?? '').trim()
    if (!positives.length && !negatives.length && !note) continue
    const sentence = joinFilled([
      positives.length ? `Reports ${positives.join(', ').toLowerCase()}.` : '',
      negatives.length ? `Denies ${negatives.join(', ').toLowerCase()}.` : '',
      note,
    ])
    lines.push({ system: system.label, text: sentence })
  }
  return lines
}

export function vitalsLine(vitals) {
  const bmi = calculateBMI(vitals.htIn, vitals.wtLb)
  return joinFilled(
    [
      vitals.bp ? `BP ${vitals.bp}` : '',
      vitals.hr ? `HR ${vitals.hr}` : '',
      vitals.rr ? `RR ${vitals.rr}` : '',
      vitals.temp ? `Temp ${vitals.temp}°F` : '',
      vitals.spo2 ? `SpO2 ${vitals.spo2}%` : '',
      vitals.htIn ? `Ht ${vitals.htIn} in` : '',
      vitals.wtLb ? `Wt ${vitals.wtLb} lb` : '',
      bmi != null ? `BMI ${bmi}` : '',
    ],
    ' | ',
  )
}

export function examNarrative(exam = {}) {
  const lines = []
  for (const system of EXAM_SYSTEMS) {
    const entry = exam[system.id]
    if (!entry || entry.status === EXAM_STATUS.UNEXAMINED) continue
    const notes = (entry.notes ?? '').trim()
    const text =
      entry.status === EXAM_STATUS.NORMAL ? joinFilled([system.normal, notes]) : notes || 'Abnormal findings noted.'
    lines.push({ system: system.label, text, abnormal: entry.status === EXAM_STATUS.ABNORMAL })
  }
  return lines
}

export function rxLine(rx) {
  return joinFilled(
    [rx.name, rx.dose, rx.route, rx.frequency, rx.quantity ? `#${rx.quantity}` : '', rx.refills ? `Refills: ${rx.refills}` : ''],
    ' — ',
  )
}

/**
 * Render the whole note as plain text, formatted for pasting into an EHR or a
 * course dropbox. This is the single source of truth for note ordering; the
 * PDF renderer walks the same structure.
 */
export function toPlainText(note, profile = {}) {
  const s = note.sections
  const out = []
  const push = (line = '') => out.push(line)

  push(displayTitle(note).toUpperCase())
  const header = joinFilled(
    [profile.displayName, profile.program, profile.school, new Date(note.updatedAt).toLocaleDateString()],
    ' | ',
  )
  if (header) push(header)
  push(`Specialty: ${specialtyLabel(note.specialty)}`)
  push()
  push('=== S — SUBJECTIVE ===')
  if (s.S.chiefComplaint.trim()) {
    push(`Chief Complaint: ${s.S.chiefComplaint.trim()}`)
    push()
  }
  const hpi = joinFilled([hpiFromElements(s.S.hpiElements), s.S.hpi.trim()], '\n')
  if (hpi) {
    push('HPI:')
    push(hpi)
    push()
  }
  for (const [label, value] of [
    ['Medications', s.S.medications],
    ['Allergies', s.S.allergies],
    ['Past Medical History', s.S.pmh],
    ['Past Surgical History', s.S.psh],
    ['Family History', s.S.familyHx],
    ['Social History', s.S.socialHx],
  ]) {
    if (value.trim()) {
      push(`${label}: ${value.trim()}`)
    }
  }
  const ros = rosNarrative(s.S.ros, s.S.rosNotes)
  if (ros.length) {
    push()
    push('Review of Systems:')
    for (const line of ros) push(`  ${line.system}: ${line.text}`)
  }

  push()
  push('=== O — OBJECTIVE ===')
  const vitals = vitalsLine(s.O.vitals)
  if (vitals) {
    push(`Vitals: ${vitals}`)
    const bmi = calculateBMI(s.O.vitals.htIn, s.O.vitals.wtLb)
    if (bmi != null) push(`BMI category: ${bmiCategory(bmi)}`)
    push()
  }
  const exam = examNarrative(s.O.exam)
  if (exam.length) {
    push('Physical Exam:')
    for (const line of exam) push(`  ${line.system}: ${line.text}`)
    push()
  }
  if (s.O.diagnostics.trim()) {
    push('Diagnostics / Results:')
    push(s.O.diagnostics.trim())
  }

  push()
  push('=== A — ASSESSMENT ===')
  s.A.diagnoses.forEach((dx, i) => {
    const label = i === 0 ? 'Primary' : `Secondary ${i}`
    push(`${i + 1}. [${label}] ${joinFilled([dx.code, dx.name], ' — ')}`)
    if (dx.reasoning.trim()) push(`   Reasoning: ${dx.reasoning.trim()}`)
  })
  if (s.A.reasoning.trim()) {
    push()
    push('Clinical Reasoning:')
    push(s.A.reasoning.trim())
  }

  push()
  push('=== P — PLAN ===')
  s.P.blocks.forEach((block, i) => {
    const dx = s.A.diagnoses.find((d) => d.id === block.dxId)
    push(`${i + 1}. ${dx ? joinFilled([dx.code, dx.name], ' — ') : 'General plan'}`)
    for (const rx of block.medications) {
      const line = rxLine(rx)
      if (line) push(`   Rx: ${line}`)
    }
    for (const [label, value] of [
      ['Orders', block.orders],
      ['Referrals', block.referrals],
      ['Patient education', block.education],
      ['Follow-up', block.followUp],
    ]) {
      if (value.trim()) push(`   ${label}: ${value.trim()}`)
    }
  })
  if (s.P.general.trim()) {
    push()
    push(s.P.general.trim())
  }

  push()
  push('---')
  push('Educational documentation. Contains no protected health information.')

  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}
