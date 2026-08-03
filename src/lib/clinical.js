/**
 * Clinical reference data: ROS systems, physical exam systems, and specialties.
 *
 * Everything here ships with the bundle — no network call, no API key. The
 * symptom lists are the standard review-of-systems items taught in NP/PA
 * programs, trimmed to what students actually document.
 */

export const SPECIALTIES = [
  { id: 'family', label: 'Family Medicine' },
  { id: 'psych', label: 'Psych / Mental Health' },
  { id: 'womens', label: "Women's Health" },
  { id: 'peds', label: 'Pediatrics' },
  { id: 'adult-gero', label: 'Adult-Gero' },
  { id: 'other', label: 'Other' },
]

export function specialtyLabel(id) {
  return SPECIALTIES.find((s) => s.id === id)?.label ?? 'Other'
}

/**
 * Review of Systems. Each symptom is tri-state per note:
 *   undefined -> not asked, 'pos' -> patient reports it, 'neg' -> patient denies it.
 * That distinction is what turns checkboxes into a real ROS narrative
 * ("Denies fever, chills. Reports fatigue.") instead of a wall of yes/no.
 */
export const ROS_SYSTEMS = [
  {
    id: 'constitutional',
    label: 'Constitutional',
    symptoms: ['Fever', 'Chills', 'Night sweats', 'Fatigue', 'Weight loss', 'Weight gain', 'Appetite change'],
  },
  {
    id: 'heent',
    label: 'HEENT',
    symptoms: ['Headache', 'Vision changes', 'Eye pain', 'Hearing loss', 'Ear pain', 'Sore throat', 'Nasal congestion', 'Rhinorrhea'],
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    symptoms: ['Chest pain', 'Palpitations', 'Dyspnea on exertion', 'Orthopnea', 'Edema', 'Claudication', 'Syncope'],
  },
  {
    id: 'respiratory',
    label: 'Respiratory',
    symptoms: ['Cough', 'Shortness of breath', 'Wheezing', 'Hemoptysis', 'Sputum production', 'Pleuritic pain'],
  },
  {
    id: 'gastrointestinal',
    label: 'Gastrointestinal',
    symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal pain', 'Heartburn', 'Melena', 'Hematochezia'],
  },
  {
    id: 'genitourinary',
    label: 'Genitourinary',
    symptoms: ['Dysuria', 'Frequency', 'Urgency', 'Hematuria', 'Incontinence', 'Flank pain', 'Discharge'],
  },
  {
    id: 'musculoskeletal',
    label: 'Musculoskeletal',
    symptoms: ['Joint pain', 'Joint swelling', 'Muscle aches', 'Back pain', 'Stiffness', 'Weakness'],
  },
  {
    id: 'skin',
    label: 'Integumentary',
    symptoms: ['Rash', 'Pruritus', 'Lesions', 'Hair loss', 'Nail changes', 'Poor wound healing'],
  },
  {
    id: 'neurological',
    label: 'Neurological',
    symptoms: ['Dizziness', 'Numbness', 'Tingling', 'Tremor', 'Seizure', 'Memory loss', 'Gait change'],
  },
  {
    id: 'psychiatric',
    label: 'Psychiatric',
    symptoms: ['Depressed mood', 'Anhedonia', 'Anxiety', 'Panic attacks', 'Sleep disturbance', 'Suicidal ideation', 'Homicidal ideation', 'Hallucinations'],
  },
  {
    id: 'endocrine',
    label: 'Endocrine',
    symptoms: ['Polyuria', 'Polydipsia', 'Polyphagia', 'Heat intolerance', 'Cold intolerance'],
  },
  {
    id: 'heme',
    label: 'Heme / Lymph',
    symptoms: ['Easy bruising', 'Bleeding', 'Lymphadenopathy', 'Pallor'],
  },
  {
    id: 'allergic',
    label: 'Allergic / Immunologic',
    symptoms: ['Seasonal allergies', 'Hives', 'Frequent infections'],
  },
]

/**
 * Physical exam systems. Each carries the "normal" phrasing a student would
 * chart, so marking a system WNL produces real documentation rather than the
 * word "normal".
 */
export const EXAM_SYSTEMS = [
  {
    id: 'general',
    label: 'General',
    normal: 'Well-appearing, in no acute distress. Alert and cooperative.',
  },
  {
    id: 'heent',
    label: 'HEENT',
    normal:
      'Normocephalic, atraumatic. PERRLA, EOMI. Sclerae anicteric. TMs pearly gray bilaterally. Oropharynx clear without erythema or exudate.',
  },
  {
    id: 'neck',
    label: 'Neck',
    normal: 'Supple, full ROM. No lymphadenopathy, thyromegaly, or JVD.',
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    normal:
      'RRR, S1/S2 present. No murmurs, rubs, or gallops. Peripheral pulses 2+ and symmetric. No peripheral edema.',
  },
  {
    id: 'respiratory',
    label: 'Respiratory',
    normal:
      'Breathing unlabored. Clear to auscultation bilaterally. No wheezes, rales, or rhonchi.',
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    normal:
      'Soft, non-tender, non-distended. Bowel sounds present in all four quadrants. No guarding, rebound, or organomegaly.',
  },
  {
    id: 'genitourinary',
    label: 'Genitourinary',
    normal: 'Deferred. No CVA tenderness.',
  },
  {
    id: 'musculoskeletal',
    label: 'Musculoskeletal',
    normal:
      'Full ROM in all extremities. No joint swelling, erythema, or deformity. Strength 5/5 throughout.',
  },
  {
    id: 'skin',
    label: 'Skin',
    normal: 'Warm and dry. No rashes, lesions, or ecchymoses. Good turgor.',
  },
  {
    id: 'neurological',
    label: 'Neurological',
    normal:
      'Alert and oriented x3. CN II–XII grossly intact. Sensation intact. Gait steady. DTRs 2+ and symmetric.',
  },
  {
    id: 'psychiatric',
    label: 'Psychiatric',
    normal:
      'Appropriate mood and affect. Normal speech, rate, and volume. Linear thought process. Insight and judgment intact. Denies SI/HI.',
  },
]

export const EXAM_STATUS = {
  UNEXAMINED: 'unexamined',
  NORMAL: 'normal',
  ABNORMAL: 'abnormal',
}

/**
 * Offline ICD-10 subset — the codes that actually show up in primary care and
 * psych clinical rotations. Searched locally by code, name, or keyword, so
 * lookup works with no backend and no AI call.
 */
export const ICD10 = [
  { code: 'I10', name: 'Essential (primary) hypertension', keywords: ['htn', 'high blood pressure'] },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', keywords: ['dm2', 'diabetes', 't2dm'] },
  { code: 'E11.65', name: 'Type 2 diabetes mellitus with hyperglycemia', keywords: ['diabetes', 'hyperglycemia'] },
  { code: 'E78.5', name: 'Hyperlipidemia, unspecified', keywords: ['cholesterol', 'lipids', 'hld'] },
  { code: 'E66.9', name: 'Obesity, unspecified', keywords: ['obese', 'bmi'] },
  { code: 'E03.9', name: 'Hypothyroidism, unspecified', keywords: ['thyroid', 'tsh'] },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified', keywords: ['uri', 'cold'] },
  { code: 'J02.9', name: 'Acute pharyngitis, unspecified', keywords: ['sore throat'] },
  { code: 'J01.90', name: 'Acute sinusitis, unspecified', keywords: ['sinus'] },
  { code: 'J20.9', name: 'Acute bronchitis, unspecified', keywords: ['cough', 'chest cold'] },
  { code: 'J45.909', name: 'Unspecified asthma, uncomplicated', keywords: ['asthma', 'wheeze'] },
  { code: 'J44.9', name: 'Chronic obstructive pulmonary disease, unspecified', keywords: ['copd', 'emphysema'] },
  { code: 'N39.0', name: 'Urinary tract infection, site not specified', keywords: ['uti', 'dysuria', 'cystitis'] },
  { code: 'N30.00', name: 'Acute cystitis without hematuria', keywords: ['bladder', 'uti'] },
  { code: 'K21.9', name: 'Gastro-esophageal reflux disease without esophagitis', keywords: ['gerd', 'reflux', 'heartburn'] },
  { code: 'K59.00', name: 'Constipation, unspecified', keywords: ['constipation'] },
  { code: 'R10.9', name: 'Unspecified abdominal pain', keywords: ['abdominal pain', 'belly'] },
  { code: 'M54.5', name: 'Low back pain', keywords: ['lbp', 'back'] },
  { code: 'M25.561', name: 'Pain in right knee', keywords: ['knee'] },
  { code: 'M79.7', name: 'Fibromyalgia', keywords: ['fibro', 'widespread pain'] },
  { code: 'M15.9', name: 'Polyosteoarthritis, unspecified', keywords: ['oa', 'arthritis'] },
  { code: 'F32.9', name: 'Major depressive disorder, single episode, unspecified', keywords: ['depression', 'mdd', 'phq'] },
  { code: 'F33.1', name: 'Major depressive disorder, recurrent, moderate', keywords: ['depression', 'recurrent'] },
  { code: 'F41.1', name: 'Generalized anxiety disorder', keywords: ['gad', 'anxiety'] },
  { code: 'F41.0', name: 'Panic disorder without agoraphobia', keywords: ['panic'] },
  { code: 'F43.10', name: 'Post-traumatic stress disorder, unspecified', keywords: ['ptsd', 'trauma'] },
  { code: 'F90.9', name: 'Attention-deficit hyperactivity disorder, unspecified type', keywords: ['adhd', 'add'] },
  { code: 'F31.9', name: 'Bipolar disorder, unspecified', keywords: ['bipolar', 'mania'] },
  { code: 'F10.20', name: 'Alcohol dependence, uncomplicated', keywords: ['alcohol', 'etoh', 'aud'] },
  { code: 'G47.00', name: 'Insomnia, unspecified', keywords: ['insomnia', 'sleep'] },
  { code: 'G43.909', name: 'Migraine, unspecified, not intractable', keywords: ['migraine', 'headache'] },
  { code: 'R51.9', name: 'Headache, unspecified', keywords: ['headache', 'cephalgia'] },
  { code: 'D50.9', name: 'Iron deficiency anemia, unspecified', keywords: ['anemia', 'iron'] },
  { code: 'L20.9', name: 'Atopic dermatitis, unspecified', keywords: ['eczema', 'rash'] },
  { code: 'L70.0', name: 'Acne vulgaris', keywords: ['acne'] },
  { code: 'B37.3', name: 'Candidiasis of vulva and vagina', keywords: ['yeast', 'candida'] },
  { code: 'N76.0', name: 'Acute vaginitis', keywords: ['vaginitis', 'discharge'] },
  { code: 'N92.0', name: 'Excessive and frequent menstruation with regular cycle', keywords: ['menorrhagia', 'heavy period'] },
  { code: 'Z34.90', name: 'Encounter for supervision of normal pregnancy, unspecified', keywords: ['prenatal', 'pregnancy'] },
  { code: 'Z00.00', name: 'General adult medical exam without abnormal findings', keywords: ['annual', 'physical', 'wellness', 'cpe'] },
  { code: 'Z00.129', name: 'Routine child health exam without abnormal findings', keywords: ['well child', 'peds', 'wcc'] },
  { code: 'Z23', name: 'Encounter for immunization', keywords: ['vaccine', 'immunization', 'flu shot'] },
  { code: 'R05.9', name: 'Cough, unspecified', keywords: ['cough'] },
  { code: 'R53.83', name: 'Other fatigue', keywords: ['fatigue', 'tired'] },
  { code: 'R42', name: 'Dizziness and giddiness', keywords: ['dizzy', 'vertigo'] },
  { code: 'H66.90', name: 'Otitis media, unspecified, unspecified ear', keywords: ['ear infection', 'om'] },
  { code: 'H10.9', name: 'Unspecified conjunctivitis', keywords: ['pink eye', 'conjunctivitis'] },
  { code: 'I48.91', name: 'Unspecified atrial fibrillation', keywords: ['afib'] },
  { code: 'I50.9', name: 'Heart failure, unspecified', keywords: ['chf', 'heart failure'] },
  { code: 'N18.3', name: 'Chronic kidney disease, stage 3 unspecified', keywords: ['ckd', 'kidney'] },
]

/** Case-insensitive search across code, name, and keyword aliases. */
export function searchICD10(query, limit = 8) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored = []
  for (const entry of ICD10) {
    const code = entry.code.toLowerCase()
    const name = entry.name.toLowerCase()
    let score = 0
    if (code.startsWith(q)) score = 100
    else if (name.startsWith(q)) score = 90
    else if (entry.keywords.some((k) => k.startsWith(q))) score = 80
    else if (name.includes(q)) score = 50
    else if (entry.keywords.some((k) => k.includes(q))) score = 40
    else if (code.includes(q)) score = 30
    if (score > 0) scored.push({ entry, score })
  }
  scored.sort((a, b) => b.score - a.score || a.entry.code.localeCompare(b.entry.code))
  return scored.slice(0, limit).map((s) => s.entry)
}

/** OLDCARTS prompts — the HPI scaffold every program teaches. */
export const HPI_ELEMENTS = [
  { id: 'onset', label: 'Onset', placeholder: '3 days ago, gradual' },
  { id: 'location', label: 'Location', placeholder: 'Substernal, non-radiating' },
  { id: 'duration', label: 'Duration', placeholder: 'Constant since onset' },
  { id: 'character', label: 'Character', placeholder: 'Burning, pressure-like' },
  { id: 'aggravating', label: 'Aggravating factors', placeholder: 'Lying flat, large meals' },
  { id: 'relieving', label: 'Relieving factors', placeholder: 'Antacids, sitting upright' },
  { id: 'timing', label: 'Timing', placeholder: 'Worse at night' },
  { id: 'severity', label: 'Severity', placeholder: '6/10 at worst' },
]
