# Condition Card Schema

One JSON file per condition in `content/conditions/`. Every card feeds three outputs:

1. **App** — SOAP Note Builder Assessment → Plan insertion
2. **Study guide** — printable/PDF page
3. **YouTube** — video script skeleton

Comparison pages (DKA vs. HHS) are **not** separate cards. They are two cards
rendered side-by-side by `build/render_guide.py` using `comparisons.json`.
One source of truth, three renders.

## Fields

| Field | Type | Required | Used by |
|---|---|---|---|
| `id` | kebab-case string | yes | all |
| `title` | string | yes | all |
| `system` | string | yes | guide grouping |
| `specialty` | string[] | yes | app template filter |
| `icd10` | `{code, label}[]` | yes | app Assessment picker |
| `definition` | string | yes | all |
| `typical_patient` | string | yes | guide, video |
| `onset` | string | no | comparison rows |
| `pathophysiology` | string | yes | guide, video |
| `precipitants` | string[] | no | guide |
| `screening` | `{who, tests[], frequency}` | no | app Plan |
| `key_findings` | `{label, value}[]` | yes | comparison rows, app Objective |
| `symptoms` | string[] | yes | guide |
| `staging` | `{stage, criteria}[]` | no | guide |
| `plan_bullets` | `{category, text}[]` | yes | **app — inserted into Plan** |
| `medications` | `{drug, dose, note}[]` | no | app Rx pad |
| `pearls` | string[] | yes | guide, video hook |
| `when_to_refer` | string[] | yes | app flag |
| `patient_education` | string[] | yes | app AVS/handout |
| `resolution_criteria` | string[] | no | guide |
| `sources` | `{label, url}[]` | yes | **liability — never omit** |
| `reviewed_by` | string | yes | liability |
| `reviewed_date` | ISO date | yes | staleness check |

## Rules

- `plan_bullets` must be written in **note voice** — they get pasted verbatim
  into a student's Plan section. "Start isotonic NS 15-20 mL/kg IV in first hour"
  not "The patient should receive fluids."
- Every card carries `sources`. No source, no ship.
- Nothing here is copied from another publisher. Same structure, own words.
- `reviewed_by` is a human with a license. Claude drafts; a licensed clinician signs.
