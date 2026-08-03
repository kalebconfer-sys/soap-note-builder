/**
 * Allergy cross-check.
 *
 * Reads the free-text allergy field a student typed in Subjective, works out
 * which allergen classes it names, and flags prescriptions in the Plan that
 * belong to those classes or to a class known to cross-react.
 *
 * This is a TEACHING AID, not clinical decision support. The list below is
 * deliberately small and covers the allergies that show up in student cases —
 * it will miss things. The UI says so, and nothing here ever blocks a
 * prescription; it only raises a flag the student has to reason about.
 *
 * Accuracy notes on the cross-reactions encoded here:
 *  - Penicillin → cephalosporin cross-reactivity is real but low (~1-2% for
 *    later generations), so it is a caution, not an avoid.
 *  - Non-antibiotic sulfonamides (furosemide, thiazides) do NOT reliably
 *    cross-react with sulfa antibiotics. That myth is deliberately not encoded.
 *  - ACE inhibitor angioedema carries a lower but genuine risk with ARBs, so
 *    ARBs are a caution rather than a contraindication.
 */

export const SEVERITY = { AVOID: 'avoid', CAUTION: 'caution' }

/**
 * Each class lists:
 *   allergyTerms — what a student might write in the allergy field
 *   drugs        — drug names that belong to the class
 *   crossClasses — other class ids that warrant a caution flag
 */
export const ALLERGEN_CLASSES = [
  {
    id: 'penicillin',
    label: 'Penicillins',
    allergyTerms: ['penicillin', 'pcn', 'amoxicillin', 'amoxil', 'augmentin', 'ampicillin'],
    drugs: [
      'penicillin', 'amoxicillin', 'amoxicillin-clavulanate', 'augmentin', 'ampicillin',
      'dicloxacillin', 'nafcillin', 'oxacillin', 'piperacillin',
    ],
    crossClasses: ['cephalosporin'],
    crossNote: 'Cross-reactivity with cephalosporins is low (roughly 1–2% for later generations) but not zero.',
  },
  {
    id: 'cephalosporin',
    label: 'Cephalosporins',
    allergyTerms: ['cephalosporin', 'cephalexin', 'keflex', 'ceftriaxone', 'rocephin', 'cefdinir', 'cefuroxime', 'cefazolin'],
    drugs: ['cephalexin', 'keflex', 'cefdinir', 'cefuroxime', 'cefazolin', 'ceftriaxone', 'rocephin', 'cefpodoxime', 'cefepime'],
    crossClasses: ['penicillin'],
    crossNote: 'Cross-reactivity with penicillins is low but documented.',
  },
  {
    id: 'sulfa',
    label: 'Sulfonamide antibiotics',
    allergyTerms: ['sulfa', 'sulfonamide', 'bactrim', 'septra', 'sulfamethoxazole', 'tmp-smx'],
    drugs: ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'bactrim', 'septra', 'tmp-smx', 'sulfasalazine', 'sulfadiazine'],
    crossClasses: [],
    // Deliberately no cross-flag to loop diuretics or thiazides.
  },
  {
    id: 'nsaid',
    label: 'NSAIDs',
    allergyTerms: ['nsaid', 'ibuprofen', 'motrin', 'advil', 'naproxen', 'aleve', 'aspirin', 'asa', 'ketorolac', 'toradol'],
    drugs: ['ibuprofen', 'motrin', 'advil', 'naproxen', 'aleve', 'ketorolac', 'toradol', 'aspirin', 'diclofenac', 'meloxicam', 'indomethacin'],
    crossClasses: [],
  },
  {
    id: 'macrolide',
    label: 'Macrolides',
    allergyTerms: ['macrolide', 'erythromycin', 'azithromycin', 'zithromax', 'z-pak', 'clarithromycin', 'biaxin'],
    drugs: ['erythromycin', 'azithromycin', 'zithromax', 'clarithromycin', 'biaxin'],
    crossClasses: [],
  },
  {
    id: 'fluoroquinolone',
    label: 'Fluoroquinolones',
    allergyTerms: ['fluoroquinolone', 'quinolone', 'ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin'],
    drugs: ['ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin', 'ofloxacin'],
    crossClasses: [],
  },
  {
    id: 'tetracycline',
    label: 'Tetracyclines',
    allergyTerms: ['tetracycline', 'doxycycline', 'doxy', 'minocycline'],
    drugs: ['tetracycline', 'doxycycline', 'minocycline', 'sarecycline'],
    crossClasses: [],
  },
  {
    id: 'ace',
    label: 'ACE inhibitors',
    allergyTerms: ['ace inhibitor', 'ace-inhibitor', 'lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'angioedema'],
    drugs: ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'quinapril', 'perindopril'],
    crossClasses: ['arb'],
    crossNote: 'After ACE-inhibitor angioedema, ARB risk is lower but real. Document the decision either way.',
  },
  {
    id: 'arb',
    label: 'ARBs',
    allergyTerms: ['arb', 'losartan', 'valsartan', 'olmesartan', 'irbesartan'],
    drugs: ['losartan', 'valsartan', 'olmesartan', 'irbesartan', 'candesartan', 'telmisartan'],
    crossClasses: ['ace'],
    crossNote: 'Angioedema risk overlaps with ACE inhibitors.',
  },
  {
    id: 'statin',
    label: 'Statins',
    allergyTerms: ['statin', 'atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'rosuvastatin', 'crestor'],
    drugs: ['atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'rosuvastatin', 'crestor', 'pravastatin', 'lovastatin'],
    crossClasses: [],
  },
  {
    id: 'opioid',
    label: 'Opioids',
    allergyTerms: ['opioid', 'opiate', 'codeine', 'morphine', 'hydrocodone', 'oxycodone', 'tramadol', 'norco', 'percocet'],
    drugs: ['codeine', 'morphine', 'hydrocodone', 'norco', 'oxycodone', 'percocet', 'tramadol', 'hydromorphone', 'fentanyl'],
    crossClasses: [],
  },
]

/** Wording that means "no allergies" and should suppress every flag. */
const NO_ALLERGY_TERMS = ['nkda', 'nka', 'no known drug allerg', 'no known allerg', 'none known', 'denies allerg']

function normalize(text) {
  return String(text ?? '').toLowerCase()
}

/** True when the field says the patient has no known allergies. */
export function statesNoAllergies(allergyText) {
  const text = normalize(allergyText).trim()
  if (!text) return false
  return NO_ALLERGY_TERMS.some((term) => text.includes(term))
}

/**
 * Which allergen classes the free-text field names.
 * Returns [] for an empty field or an explicit NKDA.
 */
export function detectAllergens(allergyText) {
  const text = normalize(allergyText)
  if (!text.trim() || statesNoAllergies(allergyText)) return []
  return ALLERGEN_CLASSES.filter((allergen) => allergen.allergyTerms.some((term) => text.includes(term)))
}

/** Does this free-text drug name look like it belongs to the class? */
function drugMatchesClass(drugName, allergen) {
  const name = normalize(drugName)
  if (!name.trim()) return false
  return allergen.drugs.some((drug) => name.includes(drug))
}

/**
 * Check one prescription against the detected allergens.
 * Returns the most severe conflict, or null when there is none.
 */
export function checkDrug(drugName, allergens) {
  if (!normalize(drugName).trim() || allergens.length === 0) return null

  for (const allergen of allergens) {
    if (drugMatchesClass(drugName, allergen)) {
      return {
        severity: SEVERITY.AVOID,
        allergenId: allergen.id,
        allergenLabel: allergen.label,
        message: `Documented allergy to ${allergen.label.toLowerCase()}. This drug is in that class.`,
      }
    }
  }

  for (const allergen of allergens) {
    for (const crossId of allergen.crossClasses) {
      const crossClass = ALLERGEN_CLASSES.find((c) => c.id === crossId)
      if (crossClass && drugMatchesClass(drugName, crossClass)) {
        return {
          severity: SEVERITY.CAUTION,
          allergenId: allergen.id,
          allergenLabel: allergen.label,
          message: `Documented allergy to ${allergen.label.toLowerCase()}. ${allergen.crossNote}`,
        }
      }
    }
  }

  return null
}

/**
 * Check every prescription across every plan block.
 * Returns one entry per conflicting prescription.
 */
export function checkPlan(blocks, allergyText) {
  const allergens = detectAllergens(allergyText)
  if (allergens.length === 0) return []

  const conflicts = []
  for (const block of blocks) {
    for (const rx of block.medications ?? []) {
      const conflict = checkDrug(rx.name, allergens)
      if (conflict) conflicts.push({ ...conflict, blockId: block.id, rxId: rx.id, drugName: rx.name })
    }
  }
  return conflicts
}
