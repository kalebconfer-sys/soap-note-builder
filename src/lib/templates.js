/**
 * Built-in specialty templates.
 *
 * A template is a partial note: it seeds the sections a student would fill for
 * that visit type — the exam systems that are always examined, the ROS systems
 * that are always asked, and prompt text in the free-text fields. Applying one
 * never overwrites content the student already typed.
 */

import { EXAM_STATUS } from './clinical.js'
import { createDiagnosis, createPlanBlock, emptySections } from './note.js'

function examNormal(...systemIds) {
  return Object.fromEntries(systemIds.map((id) => [id, { status: EXAM_STATUS.NORMAL, notes: '' }]))
}

function rosDenies(systemId, symptoms) {
  return { [systemId]: Object.fromEntries(symptoms.map((s) => [s, 'neg'])) }
}

export const TEMPLATES = [
  {
    id: 'family-acute',
    title: 'Family Medicine — Acute Visit',
    specialty: 'family',
    description: 'Focused acute complaint: OLDCARTS scaffold, core ROS, and a general exam.',
    build: () => {
      const s = emptySections()
      s.S.chiefComplaint = ''
      s.S.allergies = 'NKDA'
      s.S.ros = {
        ...rosDenies('constitutional', ['Fever', 'Chills', 'Weight loss']),
        ...rosDenies('cardiovascular', ['Chest pain', 'Palpitations']),
        ...rosDenies('respiratory', ['Shortness of breath', 'Wheezing']),
      }
      s.O.exam = examNormal('general', 'heent', 'cardiovascular', 'respiratory', 'skin')
      s.P.general = 'Return precautions reviewed. Patient verbalized understanding.'
      return s
    },
  },
  {
    id: 'family-chronic',
    title: 'Family Medicine — Chronic Disease Follow-up',
    specialty: 'family',
    description: 'HTN / DM2 / HLD follow-up with med review, vitals focus, and per-diagnosis plan blocks.',
    build: () => {
      const s = emptySections()
      s.S.chiefComplaint = 'Follow-up for chronic conditions'
      s.S.hpiElements.timing = 'Interval since last visit:'
      s.S.medications = 'Current medications with dose and adherence:'
      s.S.allergies = 'NKDA'
      s.S.socialHx = 'Tobacco: | Alcohol: | Exercise: | Diet:'
      s.S.ros = {
        ...rosDenies('constitutional', ['Fatigue']),
        ...rosDenies('cardiovascular', ['Chest pain', 'Dyspnea on exertion', 'Edema']),
        ...rosDenies('neurological', ['Dizziness', 'Numbness']),
      }
      s.O.exam = examNormal('general', 'cardiovascular', 'respiratory', 'musculoskeletal', 'neurological')
      s.O.diagnostics = 'Most recent labs (date, A1c, lipid panel, BMP):'
      const htn = createDiagnosis({ code: 'I10', name: 'Essential (primary) hypertension' })
      s.A.diagnoses = [htn]
      s.A.reasoning = 'Control status, contributing factors, and rationale for any medication change:'
      const block = createPlanBlock(htn.id)
      block.orders = 'BMP, lipid panel'
      block.education = 'DASH diet, home BP log, 150 min/week moderate activity'
      block.followUp = '3 months, sooner for BP > 160/100'
      s.P.blocks = [block]
      return s
    },
  },
  {
    id: 'psych-intake',
    title: 'Psych / Mental Health — Intake',
    specialty: 'psych',
    description: 'Full psychiatric intake with MSE prompts, risk assessment, and screening scores.',
    build: () => {
      const s = emptySections()
      s.S.chiefComplaint = ''
      s.S.hpiElements.onset = ''
      s.S.hpiElements.severity = 'PHQ-9: | GAD-7:'
      s.S.pmh = 'Prior psychiatric diagnoses, hospitalizations, prior trials:'
      s.S.familyHx = 'Family psychiatric history:'
      s.S.socialHx = 'Living situation, supports, employment, substance use, firearm access:'
      s.S.ros = {
        psychiatric: {
          'Depressed mood': 'pos',
          Anhedonia: 'pos',
          'Sleep disturbance': 'pos',
          'Suicidal ideation': 'neg',
          'Homicidal ideation': 'neg',
          Hallucinations: 'neg',
        },
      }
      s.S.rosNotes = { psychiatric: 'Risk assessment: denies SI/HI, plan, intent, or access to means.' }
      s.O.exam = {
        general: { status: EXAM_STATUS.NORMAL, notes: '' },
        psychiatric: {
          status: EXAM_STATUS.ABNORMAL,
          notes:
            'MSE — Appearance: | Behavior: | Speech: | Mood: | Affect: | Thought process: | Thought content: | Perception: | Cognition: | Insight: | Judgment:',
        },
      }
      s.A.reasoning = 'DSM-5-TR criteria met, differential considered and excluded, and risk formulation:'
      const block = createPlanBlock(null)
      block.education = 'Therapy referral, sleep hygiene, crisis line 988 reviewed'
      block.followUp = '2 weeks for medication response and tolerability'
      s.P.blocks = [block]
      return s
    },
  },
  {
    id: 'womens-annual',
    title: "Women's Health — Annual Well-Woman",
    specialty: 'womens',
    description: 'Preventive visit with menstrual/OB history, screening intervals, and contraception plan.',
    build: () => {
      const s = emptySections()
      s.S.chiefComplaint = 'Annual well-woman exam'
      s.S.pmh = 'G_P_ | LMP: | Menarche: | Cycle regularity: | Contraception:'
      s.S.familyHx = 'Breast, ovarian, cervical, or colon cancer in first-degree relatives:'
      s.S.socialHx = 'Sexual history, partners, STI screening interval:'
      s.S.allergies = 'NKDA'
      s.S.ros = {
        ...rosDenies('genitourinary', ['Dysuria', 'Discharge', 'Hematuria']),
        ...rosDenies('constitutional', ['Weight loss', 'Night sweats']),
      }
      s.O.exam = examNormal('general', 'heent', 'neck', 'cardiovascular', 'respiratory', 'abdomen', 'skin')
      s.O.diagnostics = 'Last Pap (date/result): | Last mammogram: | HPV status:'
      const dx = createDiagnosis({ code: 'Z00.00', name: 'General adult medical exam without abnormal findings' })
      s.A.diagnoses = [dx]
      const block = createPlanBlock(dx.id)
      block.orders = 'Cervical cytology per interval, screening labs as indicated'
      block.education = 'Breast self-awareness, contraception options, immunization status'
      block.followUp = '1 year, sooner for new symptoms'
      s.P.blocks = [block]
      return s
    },
  },
  {
    id: 'peds-wcc',
    title: 'Pediatrics — Well-Child Check',
    specialty: 'peds',
    description: 'Growth, development, immunizations, and anticipatory guidance by age.',
    build: () => {
      const s = emptySections()
      s.S.chiefComplaint = 'Well-child visit'
      s.S.hpiElements.timing = 'Age: | Interval history since last visit:'
      s.S.pmh = 'Birth history, gestational age, nursery course:'
      s.S.socialHx = 'Household, childcare/school, screen time, safety (car seat, helmet):'
      s.S.allergies = 'NKDA'
      s.S.ros = {
        ...rosDenies('constitutional', ['Fever', 'Appetite change']),
        ...rosDenies('gastrointestinal', ['Vomiting', 'Diarrhea']),
      }
      s.O.exam = examNormal('general', 'heent', 'neck', 'cardiovascular', 'respiratory', 'abdomen', 'skin', 'musculoskeletal', 'neurological')
      s.O.diagnostics = 'Growth percentiles (ht/wt/HC): | Developmental screen (ASQ/M-CHAT): | Vision/hearing:'
      const dx = createDiagnosis({ code: 'Z00.129', name: 'Routine child health exam without abnormal findings' })
      s.A.diagnoses = [dx]
      const block = createPlanBlock(dx.id)
      block.orders = 'Immunizations per ACIP catch-up schedule'
      block.education = 'Anticipatory guidance: nutrition, sleep, safety, development'
      block.followUp = 'Next well-child visit per Bright Futures schedule'
      s.P.blocks = [block]
      return s
    },
  },
  {
    id: 'adult-gero',
    title: 'Adult-Gero — Geriatric Assessment',
    specialty: 'adult-gero',
    description: 'Functional status, falls, polypharmacy, cognition, and goals of care.',
    build: () => {
      const s = emptySections()
      s.S.chiefComplaint = 'Comprehensive geriatric assessment'
      s.S.medications = 'Full med list with Beers-criteria review and deprescribing candidates:'
      s.S.socialHx = 'Living situation, caregiver support, ADLs/IADLs, advance directive status:'
      s.S.allergies = 'NKDA'
      s.S.ros = {
        ...rosDenies('constitutional', ['Weight loss', 'Fatigue']),
        ...rosDenies('neurological', ['Dizziness', 'Memory loss', 'Gait change']),
        ...rosDenies('genitourinary', ['Incontinence']),
      }
      s.S.rosNotes = { neurological: 'Falls in past 12 months: | Assistive device:' }
      s.O.exam = examNormal('general', 'cardiovascular', 'respiratory', 'musculoskeletal', 'neurological', 'skin')
      s.O.diagnostics = 'Cognition (MoCA/Mini-Cog): | Depression (GDS): | Gait (TUG test): | Orthostatics:'
      s.A.reasoning = 'Problem list prioritized by functional impact and patient goals:'
      const block = createPlanBlock(null)
      block.referrals = 'PT for gait and balance, pharmacy for med reconciliation'
      block.education = 'Fall-prevention, home safety, advance care planning discussion'
      block.followUp = '3 months'
      s.P.blocks = [block]
      return s
    },
  },
]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) ?? null
}
