/**
 * Diagnosis → plan scaffolding.
 *
 * When a student adds a plan block for a diagnosis, this fills the orders,
 * education, and follow-up boxes with a starting point, and proposes a
 * first-line prescription. Every suggestion is editable and deletable — it is
 * a scaffold to react to, not an answer to accept.
 *
 * Medication choice runs through the allergy check in allergies.js: if the
 * first-line agent conflicts with a documented allergy, the next acceptable
 * line is proposed instead and the substitution is reported back so the
 * student can see why.
 *
 * These are common adult starting points, not a formulary. Doses assume normal
 * renal and hepatic function and no pregnancy. The UI states this.
 */

import { checkDrug, detectAllergens } from './allergies.js'
import { uid } from './note.js'

function rx(name, dose, route, frequency, quantity, refills) {
  return { name, dose, route, frequency, quantity, refills }
}

const SUGGESTIONS = [
  {
    codes: ['I10'],
    keywords: ['hypertension', 'htn', 'high blood pressure'],
    orders: 'BMP, lipid panel, urinalysis, ECG if not done in the past year.',
    education:
      'DASH eating pattern, sodium under 2 g/day, 150 min/week moderate activity, alcohol moderation, home BP log with cuff technique demonstrated.',
    followUp: '4 weeks after any medication change, otherwise 3 months. Return sooner for BP over 180/120.',
    medications: [
      rx('Lisinopril', '10 mg', 'PO', 'Daily', '30', '3'),
      rx('Losartan', '50 mg', 'PO', 'Daily', '30', '3'),
      rx('Amlodipine', '5 mg', 'PO', 'Daily', '30', '3'),
      rx('Hydrochlorothiazide', '25 mg', 'PO', 'Daily', '30', '3'),
    ],
  },
  {
    codes: ['E11.9', 'E11.65'],
    keywords: ['diabetes', 'dm2', 't2dm'],
    orders: 'A1c, BMP, lipid panel, urine albumin-to-creatinine ratio. Annual dilated eye exam and foot exam.',
    education:
      'Carbohydrate awareness, home glucose monitoring technique, hypoglycemia recognition, foot inspection daily, sick-day rules.',
    followUp: '3 months for A1c recheck; sooner if starting or titrating therapy.',
    medications: [rx('Metformin', '500 mg', 'PO', 'Twice daily with meals', '60', '3'), rx('Empagliflozin', '10 mg', 'PO', 'Daily', '30', '3')],
  },
  {
    codes: ['E78.5'],
    keywords: ['hyperlipidemia', 'cholesterol', 'hld'],
    orders: 'Fasting lipid panel, hepatic panel at baseline, ASCVD 10-year risk calculation.',
    education: 'Mediterranean or DASH pattern, reduced saturated fat, activity goal, and the reason a statin is or is not indicated by risk.',
    followUp: '6–12 weeks after starting or changing therapy to recheck lipids.',
    medications: [rx('Atorvastatin', '20 mg', 'PO', 'Nightly', '30', '3'), rx('Ezetimibe', '10 mg', 'PO', 'Daily', '30', '3')],
  },
  {
    codes: ['N39.0', 'N30.00'],
    keywords: ['urinary tract infection', 'uti', 'cystitis'],
    orders: 'Urinalysis with microscopy; urine culture with sensitivities if recurrent, pregnant, or treatment fails.',
    education: 'Complete the full course, hydration, urinate after intercourse, and return for fever, flank pain, or vomiting.',
    followUp: 'No routine visit needed if symptoms resolve in 72 hours. Return if not improving.',
    medications: [
      rx('Nitrofurantoin monohydrate', '100 mg', 'PO', 'Twice daily x5 days', '10', '0'),
      rx('Trimethoprim-sulfamethoxazole DS', '160/800 mg', 'PO', 'Twice daily x3 days', '6', '0'),
      rx('Cephalexin', '500 mg', 'PO', 'Twice daily x7 days', '14', '0'),
      rx('Fosfomycin', '3 g', 'PO', 'Single dose', '1', '0'),
    ],
  },
  {
    codes: ['J06.9', 'R05.9'],
    keywords: ['upper respiratory', 'uri', 'common cold', 'cough'],
    orders: 'None routinely. Consider rapid strep or influenza testing if the presentation fits.',
    education:
      'Viral illness — antibiotics do not help and carry risk. Symptom care: fluids, rest, saline irrigation, honey for cough in patients over 1 year.',
    followUp: 'Return if symptoms persist beyond 10 days, worsen after initial improvement, or fever exceeds 38.3°C.',
    medications: [],
    noRxNote: 'Antibiotics are not indicated for uncomplicated viral URI. Symptomatic care only.',
  },
  {
    codes: ['J02.9'],
    keywords: ['pharyngitis', 'sore throat', 'strep'],
    orders: 'Centor/McIsaac score, rapid antigen detection test with reflex culture in children.',
    education: 'Treat only if testing is positive. Warm salt-water gargles, analgesia, and return for drooling, trismus, or muffled voice.',
    followUp: 'Return if not improving in 3 days of appropriate therapy.',
    medications: [
      rx('Penicillin VK', '500 mg', 'PO', 'Twice daily x10 days', '20', '0'),
      rx('Amoxicillin', '500 mg', 'PO', 'Twice daily x10 days', '20', '0'),
      rx('Cephalexin', '500 mg', 'PO', 'Twice daily x10 days', '20', '0'),
      rx('Azithromycin', '500 mg day 1 then 250 mg', 'PO', 'Daily x5 days', '6', '0'),
    ],
  },
  {
    codes: ['J01.90'],
    keywords: ['sinusitis', 'sinus'],
    orders: 'Clinical diagnosis. Imaging is not indicated for uncomplicated acute sinusitis.',
    education:
      'Most cases are viral. Saline irrigation and intranasal corticosteroid first; antibiotics only for symptoms beyond 10 days, severe onset, or double-worsening.',
    followUp: 'Return in 7 days if not improving, or sooner for vision change, periorbital swelling, or severe headache.',
    medications: [
      rx('Amoxicillin-clavulanate', '875/125 mg', 'PO', 'Twice daily x5–7 days', '14', '0'),
      rx('Doxycycline', '100 mg', 'PO', 'Twice daily x5–7 days', '14', '0'),
      rx('Levofloxacin', '500 mg', 'PO', 'Daily x5 days', '5', '0'),
    ],
  },
  {
    codes: ['J20.9'],
    keywords: ['bronchitis'],
    orders: 'None routinely. Chest radiograph only if vitals or exam suggest pneumonia.',
    education: 'Cough can last 3 weeks and this is expected. Antibiotics do not shorten viral bronchitis.',
    followUp: 'Return for fever, dyspnea, or cough beyond 3 weeks.',
    medications: [],
    noRxNote: 'Antibiotics are not indicated for acute bronchitis in an otherwise healthy adult.',
  },
  {
    codes: ['J45.909'],
    keywords: ['asthma'],
    orders: 'Spirometry with bronchodilator response, Asthma Control Test score, inhaler technique observed.',
    education: 'Written asthma action plan, trigger avoidance, spacer use demonstrated, and the difference between rescue and controller inhalers.',
    followUp: '4–6 weeks to reassess control, then every 3–6 months once stable.',
    medications: [rx('Budesonide-formoterol', '80/4.5 mcg', 'Inhaled', '2 puffs twice daily and as needed', '1 inhaler', '2')],
  },
  {
    codes: ['K21.9'],
    keywords: ['gerd', 'reflux', 'heartburn'],
    orders: 'Clinical diagnosis. Refer for endoscopy if alarm features: dysphagia, weight loss, bleeding, anemia, or onset after 60.',
    education:
      'Avoid late meals, elevate the head of the bed, weight loss if indicated, and identify personal triggers. PPI taken 30–60 min before the first meal.',
    followUp: '8 weeks to assess response and attempt step-down.',
    medications: [rx('Omeprazole', '20 mg', 'PO', 'Daily before breakfast', '30', '1'), rx('Famotidine', '20 mg', 'PO', 'Twice daily', '60', '1')],
  },
  {
    codes: ['F32.9', 'F33.1'],
    keywords: ['depression', 'mdd', 'major depressive'],
    orders: 'PHQ-9 at baseline and each visit, TSH, CBC, B12. Document suicide risk assessment.',
    education:
      'Antidepressants take 4–6 weeks for full effect, side effects usually settle in 1–2 weeks, do not stop abruptly. Therapy plus medication beats either alone.',
    followUp: '2 weeks for tolerability and risk recheck, then 4 weeks for response.',
    medications: [rx('Sertraline', '50 mg', 'PO', 'Daily', '30', '2'), rx('Escitalopram', '10 mg', 'PO', 'Daily', '30', '2'), rx('Bupropion XL', '150 mg', 'PO', 'Every morning', '30', '2')],
  },
  {
    codes: ['F41.1', 'F41.0'],
    keywords: ['anxiety', 'gad', 'panic'],
    orders: 'GAD-7 at baseline and each visit, TSH, and review of caffeine and stimulant intake.',
    education: 'CBT referral, sleep and caffeine hygiene, and the expectation that SSRIs may transiently increase anxiety in the first 1–2 weeks.',
    followUp: '2–4 weeks to assess tolerability and titrate.',
    medications: [rx('Sertraline', '25 mg', 'PO', 'Daily, titrate to 50 mg after 1 week', '30', '2'), rx('Escitalopram', '10 mg', 'PO', 'Daily', '30', '2')],
  },
  {
    codes: ['G47.00'],
    keywords: ['insomnia', 'sleep'],
    orders: 'Sleep diary for 2 weeks; screen for OSA with STOP-BANG and for depression.',
    education: 'CBT-I is first-line and outperforms medication long term. Stimulus control, fixed wake time, no screens in bed, caffeine cutoff by noon.',
    followUp: '4 weeks after starting CBT-I.',
    medications: [],
    noRxNote: 'CBT-I is first-line. Hypnotics are second-line, short-term, and carry dependence and fall risk.',
  },
  {
    codes: ['E03.9'],
    keywords: ['hypothyroid', 'thyroid'],
    orders: 'TSH with reflex free T4; recheck 6–8 weeks after any dose change.',
    education: 'Take on an empty stomach, 30–60 min before food, and separate from calcium, iron, and PPIs by 4 hours.',
    followUp: '6–8 weeks for TSH recheck, then annually once stable.',
    medications: [rx('Levothyroxine', '1.6 mcg/kg', 'PO', 'Daily on an empty stomach', '30', '3')],
  },
  {
    codes: ['M54.5'],
    keywords: ['back pain', 'lbp'],
    orders: 'No imaging without red flags: trauma, fever, weight loss, neuro deficit, cancer history, or IV drug use.',
    education: 'Stay active — bed rest delays recovery. Heat, gradual return to normal activity, and a realistic 4–6 week recovery expectation.',
    followUp: '4 weeks if not improving, sooner for any red flag or new neurologic symptom.',
    medications: [rx('Naproxen', '500 mg', 'PO', 'Twice daily with food', '30', '0'), rx('Acetaminophen', '650 mg', 'PO', 'Every 6 hours as needed', '60', '0')],
  },
  {
    codes: ['Z00.00', 'Z00.129'],
    keywords: ['annual', 'wellness', 'physical', 'well child'],
    orders: 'Age- and risk-appropriate screening: lipids, A1c or glucose, cancer screening per USPSTF, immunizations per ACIP.',
    education: 'Screening intervals discussed, immunizations updated, and modifiable risk factors reviewed.',
    followUp: '1 year, sooner for any new concern.',
    medications: [],
    noRxNote: 'Preventive visit — no prescription unless a screening result warrants one.',
  },
]

function findSuggestion(diagnosis) {
  const code = String(diagnosis.code ?? '').trim().toUpperCase()
  if (code) {
    const byCode = SUGGESTIONS.find((s) => s.codes.includes(code))
    if (byCode) return byCode
  }
  const name = String(diagnosis.name ?? '').toLowerCase()
  if (!name.trim()) return null
  return SUGGESTIONS.find((s) => s.keywords.some((keyword) => name.includes(keyword))) ?? null
}

export function hasSuggestion(diagnosis) {
  return findSuggestion(diagnosis) != null
}

/**
 * Build a pre-filled plan block for a diagnosis.
 *
 * Returns { block, notes } where notes explains anything the allergy check
 * changed, so the student sees the substitution rather than just a different
 * drug appearing.
 */
export function suggestPlanFor(diagnosis, allergyText, dxId = null) {
  const suggestion = findSuggestion(diagnosis)
  const base = { id: uid(), dxId, medications: [], orders: '', referrals: '', education: '', followUp: '' }
  if (!suggestion) return { block: base, notes: [], matched: false }

  const allergens = detectAllergens(allergyText)
  const notes = []
  const medications = []

  if (suggestion.medications.length > 0) {
    const firstLine = suggestion.medications[0]
    // Walk the lines in order and take the first that clears the allergy check.
    const acceptable = suggestion.medications.find((candidate) => checkDrug(candidate.name, allergens) == null)

    if (acceptable) {
      medications.push({ ...acceptable, id: uid() })
      if (acceptable !== firstLine) {
        const blocked = checkDrug(firstLine.name, allergens)
        notes.push(
          `First-line ${firstLine.name} was skipped — ${blocked.message} Suggested ${acceptable.name} instead. Confirm this is appropriate for your patient.`,
        )
      }
    } else {
      const blocked = checkDrug(firstLine.name, allergens)
      notes.push(
        `Every option on the built-in list conflicts with a documented allergy (${blocked.allergenLabel}). No prescription was suggested — choose an agent outside these classes.`,
      )
    }
  } else if (suggestion.noRxNote) {
    notes.push(suggestion.noRxNote)
  }

  return {
    block: {
      ...base,
      medications,
      orders: suggestion.orders,
      education: suggestion.education,
      followUp: suggestion.followUp,
    },
    notes,
    matched: true,
  }
}
