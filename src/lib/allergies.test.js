import { describe, expect, it } from 'vitest'
import { checkDrug, checkPlan, detectAllergens, SEVERITY, statesNoAllergies } from './allergies.js'
import { hasSuggestion, suggestPlanFor } from './planSuggestions.js'

const ids = (allergens) => allergens.map((a) => a.id)

describe('statesNoAllergies', () => {
  it('recognises the ways students write "none"', () => {
    for (const text of ['NKDA', 'nkda', 'No known drug allergies', 'no known allergies', 'Denies allergies']) {
      expect(statesNoAllergies(text)).toBe(true)
    }
  })

  it('is false for a blank field or a real allergy', () => {
    expect(statesNoAllergies('')).toBe(false)
    expect(statesNoAllergies('Penicillin — hives')).toBe(false)
  })
})

describe('detectAllergens', () => {
  it('finds classes by class name, brand name, and abbreviation', () => {
    expect(ids(detectAllergens('Penicillin — rash'))).toContain('penicillin')
    expect(ids(detectAllergens('PCN (hives)'))).toContain('penicillin')
    expect(ids(detectAllergens('Bactrim — GI upset'))).toContain('sulfa')
    expect(ids(detectAllergens('Sulfa drugs'))).toContain('sulfa')
    expect(ids(detectAllergens('Motrin'))).toContain('nsaid')
  })

  it('finds more than one class in one field', () => {
    const found = ids(detectAllergens('Penicillin (hives), sulfa (rash), ibuprofen'))
    expect(found).toEqual(expect.arrayContaining(['penicillin', 'sulfa', 'nsaid']))
  })

  it('returns nothing for blank or NKDA', () => {
    expect(detectAllergens('')).toEqual([])
    expect(detectAllergens('NKDA')).toEqual([])
    expect(detectAllergens('No known drug allergies')).toEqual([])
  })
})

describe('checkDrug', () => {
  const pcn = detectAllergens('Penicillin')
  const sulfa = detectAllergens('Sulfa')

  it('flags a drug in the allergic class as avoid', () => {
    const conflict = checkDrug('Amoxicillin', pcn)
    expect(conflict.severity).toBe(SEVERITY.AVOID)
    expect(conflict.allergenId).toBe('penicillin')
  })

  it('flags a cross-reactive class as caution, not avoid', () => {
    const conflict = checkDrug('Cephalexin', pcn)
    expect(conflict.severity).toBe(SEVERITY.CAUTION)
    expect(conflict.message).toMatch(/1–2%/)
  })

  it('is case-insensitive and tolerates brand names', () => {
    expect(checkDrug('amoxicillin 500mg', pcn).severity).toBe(SEVERITY.AVOID)
    expect(checkDrug('BACTRIM DS', sulfa).severity).toBe(SEVERITY.AVOID)
  })

  it('passes an unrelated drug', () => {
    expect(checkDrug('Lisinopril', pcn)).toBeNull()
    expect(checkDrug('Nitrofurantoin monohydrate', sulfa)).toBeNull()
  })

  it('does not flag loop or thiazide diuretics for a sulfa antibiotic allergy', () => {
    // Non-antibiotic sulfonamides do not reliably cross-react. Encoding that
    // myth would teach students the wrong thing.
    expect(checkDrug('Furosemide', sulfa)).toBeNull()
    expect(checkDrug('Hydrochlorothiazide', sulfa)).toBeNull()
  })

  it('returns null when there is no allergy or no drug typed yet', () => {
    expect(checkDrug('Amoxicillin', [])).toBeNull()
    expect(checkDrug('', pcn)).toBeNull()
    expect(checkDrug('   ', pcn)).toBeNull()
  })

  it('flags ARBs as a caution after ACE-inhibitor angioedema', () => {
    const ace = detectAllergens('Lisinopril — angioedema')
    expect(checkDrug('Losartan', ace).severity).toBe(SEVERITY.CAUTION)
    expect(checkDrug('Enalapril', ace).severity).toBe(SEVERITY.AVOID)
  })
})

describe('checkPlan', () => {
  it('reports every conflicting prescription across blocks', () => {
    const blocks = [
      { id: 'b1', medications: [{ id: 'r1', name: 'Amoxicillin' }, { id: 'r2', name: 'Ibuprofen' }] },
      { id: 'b2', medications: [{ id: 'r3', name: 'Lisinopril' }] },
    ]
    const conflicts = checkPlan(blocks, 'Penicillin')
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].rxId).toBe('r1')
    expect(conflicts[0].blockId).toBe('b1')
  })

  it('is empty when NKDA', () => {
    expect(checkPlan([{ id: 'b1', medications: [{ id: 'r1', name: 'Amoxicillin' }] }], 'NKDA')).toEqual([])
  })

  it('tolerates a block with no medications array', () => {
    expect(checkPlan([{ id: 'b1' }], 'Penicillin')).toEqual([])
  })
})

describe('suggestPlanFor', () => {
  it('fills orders, education, and follow-up for a known code', () => {
    const { block, matched } = suggestPlanFor({ code: 'I10', name: 'Essential hypertension' }, 'NKDA')
    expect(matched).toBe(true)
    expect(block.orders).toMatch(/BMP/)
    expect(block.education).toMatch(/DASH/)
    expect(block.followUp).toMatch(/3 months/)
    expect(block.medications[0].name).toBe('Lisinopril')
  })

  it('matches on diagnosis name when there is no code', () => {
    const { matched, block } = suggestPlanFor({ code: '', name: 'Generalized anxiety disorder' }, '')
    expect(matched).toBe(true)
    expect(block.medications[0].name).toBe('Sertraline')
  })

  it('skips a first-line drug the patient is allergic to and says why', () => {
    const { block, notes } = suggestPlanFor({ code: 'I10' }, 'Lisinopril — angioedema')
    expect(block.medications[0].name).not.toBe('Lisinopril')
    expect(notes[0]).toMatch(/Lisinopril was skipped/)
    expect(notes[0]).toMatch(/Suggested/)
  })

  it('walks past every conflicting line to find an acceptable one', () => {
    // Sulfa knocks out TMP-SMX; nitrofurantoin is untouched and stays first.
    const { block } = suggestPlanFor({ code: 'N39.0' }, 'Sulfa')
    expect(block.medications[0].name).toMatch(/Nitrofurantoin/)

    // Penicillin allergy makes cephalexin a caution, so it is skipped too.
    const pcnCase = suggestPlanFor({ code: 'J02.9' }, 'Penicillin — anaphylaxis')
    expect(pcnCase.block.medications[0].name).toBe('Azithromycin')
    expect(pcnCase.notes[0]).toMatch(/Penicillin VK was skipped/)
  })

  it('suggests nothing and explains when every option conflicts', () => {
    // Pharyngitis offers penicillin, amoxicillin, cephalexin, azithromycin.
    // A penicillin plus macrolide allergy takes out all four — the two
    // penicillins directly, cephalexin by cross-reactivity, azithromycin by class.
    const { block, notes } = suggestPlanFor({ code: 'J02.9' }, 'Penicillin (anaphylaxis), azithromycin (rash)')
    expect(block.medications).toEqual([])
    expect(notes[0]).toMatch(/conflicts with a documented allergy/)
  })

  it('does not treat a non-statin lipid agent as a statin', () => {
    // Ezetimibe is not a statin, so a statin allergy must not block it.
    const { block } = suggestPlanFor({ code: 'E78.5' }, 'Statin — rhabdomyolysis')
    expect(block.medications[0].name).toBe('Ezetimibe')
  })

  it('carries the no-prescription rationale for conditions that need none', () => {
    const { block, notes } = suggestPlanFor({ code: 'J06.9' }, 'NKDA')
    expect(block.medications).toEqual([])
    expect(notes[0]).toMatch(/Antibiotics are not indicated/)
  })

  it('returns an empty block for an unrecognised diagnosis', () => {
    const { block, matched, notes } = suggestPlanFor({ code: 'Q99.9', name: 'Something rare' }, '')
    expect(matched).toBe(false)
    expect(notes).toEqual([])
    expect(block.orders).toBe('')
    expect(block.medications).toEqual([])
  })

  it('links the block to the diagnosis it was built for', () => {
    const { block } = suggestPlanFor({ code: 'I10' }, 'NKDA', 'dx-123')
    expect(block.dxId).toBe('dx-123')
  })
})

describe('hasSuggestion', () => {
  it('is true for covered codes and false otherwise', () => {
    expect(hasSuggestion({ code: 'I10', name: '' })).toBe(true)
    expect(hasSuggestion({ code: '', name: 'urinary tract infection' })).toBe(true)
    expect(hasSuggestion({ code: 'Q99.9', name: 'Something rare' })).toBe(false)
    expect(hasSuggestion({ code: '', name: '' })).toBe(false)
  })
})
