import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@app/providers'
import { App } from '@app/App'
import { OfflineBanner } from '@/components/OfflineBanner'
import { validateEnv, renderEnvError } from '@app/config/validateEnv'

// Tailwind CSS with Atlantis design tokens
import '@/styles/tailwind.css'
// CoreUI and custom overrides
import '@/styles/main.scss'

// Register service worker in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}

const { valid, missing } = validateEnv()

if (!valid) {
  renderEnvError(missing)
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <OfflineBanner />
        <App />
      </AppProviders>
    </StrictMode>,
  )
}
