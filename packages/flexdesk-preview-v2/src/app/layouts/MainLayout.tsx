import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { CommandPalette } from '@/components/CommandPalette'
import './MainLayout.css'

export function MainLayout() {
  const { pathname } = useLocation()
  const isSchedule = pathname === '/schedule'

  return (
    <div className="main-layout-modern">
      <AppHeader />
      <main className={isSchedule ? 'main-content-modern main-content-fullscreen' : 'main-content-modern'}>
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  )
}
