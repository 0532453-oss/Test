import { useState } from 'react'
import {
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CAlert,
  CSpinner,
} from '@coreui/react'
import { useAuth } from '@app/providers'
import { env } from '@app/config'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CCard style={{ maxWidth: 400, width: '100%' }}>
      <CCardBody className="p-4">
        <h1 className="h4 mb-1 text-center">{env.APP_NAME}</h1>
        <p className="text-medium-emphasis text-center mb-4">Sign in to your account</p>

        {error && (
          <CAlert color="danger" className="mb-3">
            {error}
          </CAlert>
        )}

        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel htmlFor="email">Email</CFormLabel>
            <CFormInput
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <CFormLabel htmlFor="password">Password</CFormLabel>
            <CFormInput
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <CButton
            type="submit"
            color="primary"
            className="w-100"
            disabled={isLoading}
          >
            {isLoading ? <CSpinner size="sm" /> : 'Sign In'}
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}
