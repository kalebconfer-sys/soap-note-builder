import { NavLink, Outlet } from 'react-router-dom'
import PhiBanner from './components/PhiBanner.jsx'

const NAV = [
  { to: '/', label: 'Notes', end: true },
  { to: '/templates', label: 'Templates' },
  { to: '/settings', label: 'Settings' },
]

function navClass({ isActive }) {
  return [
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-clinic-50 text-clinic-700' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
  ].join(' ')
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md bg-clinic-600 text-sm font-bold text-white"
            >
              S
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink-900">
              SOAP Note Builder
            </span>
          </NavLink>
          <nav className="ml-auto flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="print-page mx-auto max-w-6xl px-4 py-6">
        <PhiBanner />
        <Outlet />
      </main>

      <footer className="no-print mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-ink-400">
        Educational tool for NP and PA students. Not a medical device and not for
        real patient information. Notes are stored in this browser only.{' '}
        Printable companions (SOAP template pack, SNAPPS one-pager, condition
        cards) by the same RN are in{' '}
        <a
          className="underline"
          href="https://www.etsy.com/shop/TheHomeCareRN"
          target="_blank"
          rel="noopener noreferrer"
        >
          the Etsy shop
        </a>
        .
      </footer>
    </div>
  )
}
