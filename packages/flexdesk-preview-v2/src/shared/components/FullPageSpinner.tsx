import { CSpinner } from '@coreui/react'

export function FullPageSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
      }}
    >
      <CSpinner color="primary" />
    </div>
  )
}
