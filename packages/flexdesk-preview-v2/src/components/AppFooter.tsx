import { CFooter } from '@coreui/react'

export function AppFooter() {
  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1">&copy; {new Date().getFullYear()} FlexDesk</span>
      </div>
    </CFooter>
  )
}
