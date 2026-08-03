# SOAP Note Builder

A free, purpose-built SOAP note editor for NP and PA students. Guided S/O/A/P
sections, vitals with auto-calculated BMI, tri-state ROS and physical exam
checklists, offline ICD-10 lookup, specialty templates, and clean PDF export.

**v1 runs entirely in the browser.** No account, no server, no API key. Notes
are saved to `localStorage` and never leave the device.

## Why this exists

Clinical documentation is the most time-consuming task in an NP program, and
the options are a blank Google Doc, an EHR nobody gives students access to, or
nothing. This fills the gap with the structure a program actually grades:
OLDCARTS prompts, a real ROS that distinguishes "reports" from "denies", exam
systems that expand into chartable phrasing, and per-diagnosis plan blocks.

## Not for real patient data

This is a study tool, not a HIPAA-covered system. Use de-identified or
fictional case data. The app says so on every screen, and every export carries
the disclaimer.

## Run it

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR at http://localhost:5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | oxlint |

## Stack

React 19 + Vite 8, Tailwind CSS 3, Zustand (with `persist`) for state,
React Router (hash routing so it works on any static host),
`@react-pdf/renderer` for client-side PDF, Vitest for tests.

## Layout

```
src/
  lib/
    clinical.js    ROS systems, exam systems, ICD-10 subset, specialties
    note.js        Note model, BMI, completeness, plain-text serialization
    templates.js   Built-in specialty templates
    pdf.jsx        PDF document (lazy-loaded on export only)
    download.js    Blob/file/clipboard helpers
  store/
    useNotes.js    Note CRUD, persisted to localStorage
    useSettings.js Export header + UI preferences
  components/      Field primitives, section panels, export menu
    sections/      SubjectiveSection, ObjectiveSection, AssessmentSection, PlanSection
  pages/           Dashboard, NoteEditor, TemplateLibrary, Settings
```

`src/lib/note.js` is deliberately free of React and of storage concerns: the
editor, the text exporter, and the PDF renderer all walk the same structure, so
note ordering is defined in exactly one place.

## What v1 does not have

Deferred on purpose, since none of it is needed to write a note:

- **Accounts and cloud sync.** Every write goes through the actions in
  `useNotes.js`, so swapping `localStorage` for a Supabase adapter means
  changing that file, not the components.
- **AI assist.** Needs a server-side proxy to keep an API key off the client.
- **Payments and tiers.** Everything is free right now.
- **Preceptor share links.** Needs a backend to host the shared note.

Backup and restore (Settings → Export all notes) covers the gap in the
meantime: the exported `.json` re-imports into any browser.

## Roadmap

The full technical specification (Supabase schema, RLS policies, Edge Function
AI proxy, Stripe tiers) is the source for later phases. v1 above is Phase 1
minus auth.
