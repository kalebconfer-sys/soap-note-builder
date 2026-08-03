import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * User preferences: the header block stamped onto exports, plus UI toggles.
 * Deliberately separate from note storage so clearing notes never wipes the
 * profile a student typed once at the start of the term.
 */
export const useSettings = create(
  persist(
    (set) => ({
      displayName: '',
      program: '',
      school: '',
      preceptor: '',
      /** Dismissing the PHI banner is remembered, but it reappears each term. */
      phiBannerDismissedAt: null,

      update(patch) {
        set(patch)
      },
      dismissPhiBanner() {
        set({ phiBannerDismissedAt: new Date().toISOString() })
      },
    }),
    {
      name: 'soap-note-builder/settings/v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

/** The banner returns after 30 days so the reminder does not go stale. */
export function shouldShowPhiBanner(dismissedAt) {
  if (!dismissedAt) return true
  const elapsed = Date.now() - new Date(dismissedAt).getTime()
  return !Number.isFinite(elapsed) || elapsed > 30 * 24 * 60 * 60 * 1000
}
