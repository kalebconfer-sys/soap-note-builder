import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createNote, normalizeNote, NOTE_STATUS, uid } from '../lib/note.js'

/**
 * Note storage.
 *
 * Persistence goes through zustand's `persist` middleware against
 * localStorage. Every write path is funnelled through the actions below rather
 * than reaching into the array directly, which keeps the seam narrow: swapping
 * localStorage for a Supabase-backed adapter later means replacing the
 * `storage` option and making these actions async, not rewriting components.
 */

const STORAGE_KEY = 'soap-note-builder/notes/v1'

function touch(note) {
  return { ...note, updatedAt: new Date().toISOString() }
}

export const useNotes = create(
  persist(
    (set, get) => ({
      notes: [],
      lastSavedAt: null,

      getNote(id) {
        return get().notes.find((n) => n.id === id) ?? null
      },

      addNote(partial = {}) {
        const note = createNote(partial)
        set((state) => ({ notes: [note, ...state.notes], lastSavedAt: new Date().toISOString() }))
        return note.id
      },

      /** Shallow-merge a patch into the top level of a note (title, status…). */
      patchNote(id, patch) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? touch({ ...n, ...patch }) : n)),
          lastSavedAt: new Date().toISOString(),
        }))
      },

      /** Shallow-merge a patch into one SOAP section. */
      patchSection(id, sectionKey, patch) {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? touch({
                  ...n,
                  sections: { ...n.sections, [sectionKey]: { ...n.sections[sectionKey], ...patch } },
                })
              : n,
          ),
          lastSavedAt: new Date().toISOString(),
        }))
      },

      /**
       * Patch several SOAP sections in one write. Adding a diagnosis also
       * creates its plan block, and those two edits have to land together or
       * an interrupted render can show a plan for a diagnosis that is not
       * there yet.
       */
      patchSections(id, patches) {
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== id) return n
            const sections = { ...n.sections }
            for (const [key, patch] of Object.entries(patches)) {
              sections[key] = { ...sections[key], ...patch }
            }
            return touch({ ...n, sections })
          }),
          lastSavedAt: new Date().toISOString(),
        }))
      },

      deleteNote(id) {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id), lastSavedAt: new Date().toISOString() }))
      },

      duplicateNote(id) {
        const source = get().getNote(id)
        if (!source) return null
        const now = new Date().toISOString()
        const copy = {
          ...structuredClone(source),
          id: uid(),
          title: `${source.title || 'Untitled note'} (copy)`,
          status: NOTE_STATUS.DRAFT,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ notes: [copy, ...state.notes], lastSavedAt: now }))
        return copy.id
      },

      /** Replace the whole note set — used by JSON import / restore. */
      replaceAll(notes) {
        set({ notes: notes.map(normalizeNote), lastSavedAt: new Date().toISOString() })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ notes: state.notes }),
      // Notes written by an earlier build may be missing fields the UI now
      // reads, so every rehydrated note is run through the normalizer.
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        notes: (persisted?.notes ?? []).map(normalizeNote),
      }),
    },
  ),
)
