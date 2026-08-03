import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NoteEditor from './pages/NoteEditor.jsx'
import TemplateLibrary from './pages/TemplateLibrary.jsx'
import Settings from './pages/Settings.jsx'

// HashRouter keeps deep links working on any static host (GitHub Pages,
// Netlify drop, a file:// copy on a laptop) with no server rewrite rules.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="notes/new" element={<NoteEditor />} />
          <Route path="notes/:id" element={<NoteEditor />} />
          <Route path="templates" element={<TemplateLibrary />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
