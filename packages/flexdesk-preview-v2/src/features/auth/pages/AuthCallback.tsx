import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CSpinner } from '@coreui/react'
import { useAuth } from '@app/providers'
import { env } from '@app/config'
import { ROUTES } from '@app/routes/routes'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      // No auth code — user navigated here directly
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    const exchangeCode = async () => {
      try {
        const response = await fetch(`${env.API_URL}/auth/exchange-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Authentication failed. Please try again.')
        }

        const data = await response.json()

        // Store the access token
        localStorage.setItem('flexdesk_token', data.access_token)

        // Fetch user profile and store
        const profileResponse = await fetch(`${env.API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })

        if (profileResponse.ok) {
          const user = await profileResponse.json()
          localStorage.setItem('flexdesk_user', JSON.stringify(user))
        }

        navigate(ROUTES.DASHBOARD, { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    exchangeCode()
  }, [searchParams, navigate, login])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-sm p-8 bg-white rounded-xl shadow-sm">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Sign in failed
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <CSpinner color="primary" className="mb-4" />
        <p className="text-gray-600 text-lg">Signing you in...</p>
      </div>
    </div>
  )
}
