import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyThemeFromUrl } from '../../../shared/game-theme'

// The storefront passes its theme on the iframe URL: a cross-origin frame
// cannot read the parent's `.dark` class. Applied before the first paint.
applyThemeFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
