import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { CToast, CToastBody, CToastHeader, CToaster } from '@coreui/react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toast: {
    success: (title: string, message?: string) => void
    error: (title: string, message?: string) => void
    warning: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

const colorMap: Record<ToastType, string> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, title, message }])

    // Auto remove after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const toast = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message),
    warning: (title: string, message?: string) => addToast('warning', title, message),
    info: (title: string, message?: string) => addToast('info', title, message),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <CToaster placement="top-end" className="position-fixed p-3">
        {toasts.map((t) => (
          <CToast key={t.id} color={colorMap[t.type]} className="text-white">
            <CToastHeader closeButton>
              <strong className="me-auto">{t.title}</strong>
            </CToastHeader>
            {t.message && <CToastBody>{t.message}</CToastBody>}
          </CToast>
        ))}
      </CToaster>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context.toast
}
