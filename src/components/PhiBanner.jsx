import { shouldShowPhiBanner, useSettings } from '../store/useSettings.js'

/**
 * The spec makes this non-optional: the tool is a student learning aid, not a
 * covered entity, so the "no real patient data" reminder has to be in front of
 * the user at note creation rather than buried in a TOS.
 */
export default function PhiBanner() {
  const dismissedAt = useSettings((s) => s.phiBannerDismissedAt)
  const dismiss = useSettings((s) => s.dismissPhiBanner)

  if (!shouldShowPhiBanner(dismissedAt)) return null

  return (
    <div
      role="note"
      className="no-print mb-5 flex flex-wrap items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3"
    >
      <span aria-hidden="true" className="mt-0.5 text-lg leading-none">
        ⚠️
      </span>
      <div className="min-w-[16rem] flex-1 text-sm text-amber-900">
        <p className="font-semibold">Do not enter real patient information.</p>
        <p className="mt-0.5 text-amber-800">
          Use de-identified or fictional case data. This is a study tool, not a
          HIPAA-covered system. Everything you type stays in this browser.
        </p>
      </div>
      <button type="button" onClick={dismiss} className="btn-ghost border-amber-300 text-amber-900 hover:bg-amber-100">
        Got it
      </button>
    </div>
  )
}
