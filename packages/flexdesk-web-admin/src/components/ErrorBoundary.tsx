import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleToggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    const isDev = process.env.NODE_ENV === 'development'

    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '4rem auto', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: '#991b1b', fontSize: '1.25rem' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 1rem', color: '#7f1d1d' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReload}
              style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
            {isDev && (
              <button
                onClick={this.handleToggleDetails}
                style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer' }}
              >
                {this.state.showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>

          {isDev && this.state.showDetails && this.state.error && (
            <div style={{ marginTop: '1rem', background: '#1f2937', color: '#f9fafb', borderRadius: '6px', padding: '1rem', overflow: 'auto' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                {this.state.error.message}
              </p>
              <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error.stack}
              </pre>
              {this.state.errorInfo?.componentStack && (
                <pre style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: '#fbbf24' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
}
