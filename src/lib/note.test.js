import { describe, expect, it } from 'vitest'
import { searchICD10 } from './clinical.js'
import { slugify } from './download.js'
import {
  bmiCategory,
  calculateBMI,
  completeness,
  createDiagnosis,
  createNote,
  createPlanBlock,
  displayTitle,
  examNarrative,
  hpiFromElements,
  normalizeNote,
  rosNarrative,
  rxLine,
  toPlainText,
  vitalsLine,
} from './note.js'

describe('calculateBMI', () => {
  it('computes BMI from inches and pounds', () => {
    // 703 * 170 / 68^2 = 25.84...
    expect(calculateBMI(68, 170)).toBe(25.8)
    expect(calculateBMI('70', '154')).toBe(22.1)
  })

  it('returns null when either measurement is missing or nonsense', () => {
    expect(calculateBMI('', 170)).toBeNull()
    expect(calculateBMI(68, '')).toBeNull()
    expect(calculateBMI(0, 170)).toBeNull()
    expect(calculateBMI(-68, 170)).toBeNull()
    expect(calculateBMI('tall', 170)).toBeNull()
  })
})

describe('bmiCategory', () => {
  it('maps to the CDC adult bands', () => {
    expect(bmiCategory(17)).toBe('Underweight')
    expect(bmiCategory(22)).toBe('Normal weight')
    expect(bmiCategory(27)).toBe('Overweight')
    expect(bmiCategory(32)).toBe('Obesity class I')
    expect(bmiCategory(37)).toBe('Obesity class II')
    expect(bmiCategory(44)).toBe('Obesity class III')
  })

  it('passes null through so callers can skip the row', () => {
    expect(bmiCategory(null)).toBeNull()
  })
})

describe('searchICD10', () => {
  it('finds codes by shorthand, name, and code prefix', () => {
    expect(searchICD10('htn')[0].code).toBe('I10')
    expect(searchICD10('I10')[0].code).toBe('I10')
    expect(searchICD10('generalized anxiety')[0].code).toBe('F41.1')
    expect(searchICD10('uti').map((r) => r.code)).toContain('N39.0')
  })

  it('returns nothing for an empty or unmatched query', () => {
    expect(searchICD10('')).toEqual([])
    expect(searchICD10('   ')).toEqual([])
    expect(searchICD10('zzzzzz')).toEqual([])
  })
})

describe('hpiFromElements', () => {
  it('renders only the OLDCARTS boxes that were filled', () => {
    const text = hpiFromElements({ onset: '3 days ago', severity: '6/10', location: '' })
    expect(text).toBe('Onset: 3 days ago. Severity: 6/10.')
  })

  it('is empty when nothing was entered', () => {
    expect(hpiFromElements({})).toBe('')
  })
})

describe('rosNarrative', () => {
  it('splits positives and negatives into clinical phrasing', () => {
    const lines = rosNarrative({ constitutional: { Fatigue: 'pos', Fever: 'neg', Chills: 'neg' } }, {})
    expect(lines).toHaveLength(1)
    expect(lines[0].system).toBe('Constitutional')
    expect(lines[0].text).toBe('Reports fatigue. Denies fever, chills.')
  })

  it('skips systems with nothing documented', () => {
    expect(rosNarrative({ constitutional: {} }, {})).toEqual([])
  })

  it('keeps a system that only has free-text notes', () => {
    const lines = rosNarrative({}, { psychiatric: 'PHQ-9 score 14.' })
    expect(lines).toEqual([{ system: 'Psychiatric', text: 'PHQ-9 score 14.' }])
  })
})

describe('examNarrative', () => {
  it('uses the canned normal phrasing for WNL systems', () => {
    const lines = examNarrative({ respiratory: { status: 'normal', notes: '' } })
    expect(lines[0].text).toContain('Clear to auscultation bilaterally')
    expect(lines[0].abnormal).toBe(false)
  })

  it('replaces the normal phrasing with the findings when abnormal', () => {
    const lines = examNarrative({ respiratory: { status: 'abnormal', notes: 'Expiratory wheeze in RLL.' } })
    expect(lines[0].text).toBe('Expiratory wheeze in RLL.')
    expect(lines[0].abnormal).toBe(true)
  })

  it('omits systems that were not examined', () => {
    expect(examNarrative({ respiratory: { status: 'unexamined', notes: '' } })).toEqual([])
  })
})

describe('vitalsLine', () => {
  it('joins only the vitals that were recorded and appends BMI', () => {
    const line = vitalsLine({ bp: '128/82', hr: '76', rr: '', temp: '', spo2: '', htIn: '68', wtLb: '170' })
    expect(line).toBe('BP 128/82 | HR 76 | Ht 68 in | Wt 170 lb | BMI 25.8')
  })

  it('is empty when no vitals were taken', () => {
    expect(vitalsLine({ bp: '', hr: '', rr: '', temp: '', spo2: '', htIn: '', wtLb: '' })).toBe('')
  })
})

describe('rxLine', () => {
  it('renders a prescription without empty separators', () => {
    expect(rxLine({ name: 'Lisinopril', dose: '10 mg', route: 'PO', frequency: 'daily', quantity: '30', refills: '3' })).toBe(
      'Lisinopril — 10 mg — PO — daily — #30 — Refills: 3',
    )
    expect(rxLine({ name: 'Lisinopril', dose: '', route: '', frequency: '', quantity: '', refills: '' })).toBe('Lisinopril')
  })
})

describe('normalizeNote', () => {
  it('fills in fields added after a note was saved', () => {
    const legacy = { id: 'abc', title: 'Old note', sections: { S: { chiefComplaint: 'Cough' } } }
    const note = normalizeNote(legacy)
    expect(note.id).toBe('abc')
    expect(note.sections.S.chiefComplaint).toBe('Cough')
    expect(note.sections.S.ros).toEqual({})
    expect(note.sections.O.vitals.bp).toBe('')
    expect(note.sections.A.diagnoses).toEqual([])
    expect(note.sections.P.blocks).toEqual([])
  })

  it('returns a blank note for garbage input', () => {
    expect(normalizeNote(null).sections.A.diagnoses).toEqual([])
    expect(normalizeNote('nope').sections.O.exam).toEqual({})
  })
})

describe('displayTitle', () => {
  it('prefers the title, then the chief complaint, then a placeholder', () => {
    const note = createNote()
    expect(displayTitle(note)).toBe('Untitled note')
    note.sections.S.chiefComplaint = 'Chest pain x3 days'
    expect(displayTitle(note)).toBe('Chest pain x3 days')
    note.title = 'HTN follow-up'
    expect(displayTitle(note)).toBe('HTN follow-up')
  })
})

describe('completeness', () => {
  it('is 0 for an untouched note and rises as sections fill', () => {
    const note = createNote()
    expect(completeness(note)).toBe(0)
    note.sections.S.chiefComplaint = 'Cough'
    note.sections.A.diagnoses = [createDiagnosis({ code: 'R05.9', name: 'Cough' })]
    expect(completeness(note)).toBeGreaterThan(0)
    expect(completeness(note)).toBeLessThan(100)
  })
})

describe('toPlainText', () => {
  function fullNote() {
    const note = createNote({ title: 'HTN Follow-up' })
    const s = note.sections
    s.S.chiefComplaint = 'Follow-up for high blood pressure'
    s.S.hpiElements.onset = '6 months ago'
    s.S.hpi = 'Patient reports good adherence.'
    s.S.allergies = 'NKDA'
    s.S.ros = { cardiovascular: { 'Chest pain': 'neg', Palpitations: 'neg' } }
    s.O.vitals = { bp: '138/86', hr: '72', rr: '', temp: '', spo2: '', htIn: '68', wtLb: '190' }
    s.O.exam = { cardiovascular: { status: 'normal', notes: '' } }
    const dx = createDiagnosis({ code: 'I10', name: 'Essential (primary) hypertension' })
    dx.reasoning = 'Elevated readings on three visits.'
    s.A.diagnoses = [dx]
    s.A.reasoning = 'Stage 1 hypertension, uncontrolled on monotherapy.'
    const block = createPlanBlock(dx.id)
    block.medications = [
      { id: 'rx1', name: 'Lisinopril', dose: '10 mg', route: 'PO', frequency: 'daily', quantity: '30', refills: '3' },
    ]
    block.followUp = '3 months'
    s.P.blocks = [block]
    return note
  }

  it('emits all four SOAP headers in order', () => {
    const text = toPlainText(fullNote(), {})
    const order = ['=== S — SUBJECTIVE ===', '=== O — OBJECTIVE ===', '=== A — ASSESSMENT ===', '=== P — PLAN ==='].map(
      (header) => text.indexOf(header),
    )
    expect(order.every((index) => index > -1)).toBe(true)
    expect([...order]).toEqual([...order].sort((a, b) => a - b))
  })

  it('includes the content the student entered', () => {
    const text = toPlainText(fullNote(), { displayName: 'Kaleb Confer, RN', program: 'FNP' })
    expect(text).toContain('Kaleb Confer, RN')
    expect(text).toContain('Follow-up for high blood pressure')
    expect(text).toContain('Onset: 6 months ago.')
    expect(text).toContain('Denies chest pain, palpitations.')
    expect(text).toContain('BMI 28.9')
    expect(text).toContain('[Primary] I10 — Essential (primary) hypertension')
    expect(text).toContain('Rx: Lisinopril — 10 mg — PO — daily — #30 — Refills: 3')
    expect(text).toContain('Follow-up: 3 months')
  })

  it('carries the no-PHI disclaimer', () => {
    expect(toPlainText(createNote(), {})).toContain('no protected health information')
  })

  it('never leaves more than one blank line between blocks', () => {
    expect(toPlainText(fullNote(), {})).not.toMatch(/\n{3}/)
  })
})

describe('slugify', () => {
  it('makes a safe filename', () => {
    expect(slugify('HTN Follow-up — 05/07/2026')).toBe('htn-follow-up-05-07-2026')
    expect(slugify('   ')).toBe('soap-note')
    expect(slugify('!!!')).toBe('soap-note')
  })
})
