import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * React Error Boundary — catches JavaScript errors anywhere in a child component tree.
 * Prevents a single crashed component from taking down the entire application.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // In production, send to Sentry or similar error monitoring service
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '40px',
          textAlign: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '32px',
            backgroundColor: 'var(--danger-soft, rgba(239, 68, 68, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={32} color="var(--danger, #ef4444)" />
          </div>

          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', maxWidth: '400px', lineHeight: 1.5 }}>
            This section encountered an unexpected error. Your data is safe — try refreshing this section.
          </p>

          {this.state.error && (
            <code style={{
              display: 'block',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-secondary, #0f1424)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--danger-text, #fca5a5)',
              maxWidth: '500px',
              overflow: 'auto',
            }}>
              {this.state.error.message}
            </code>
          )}

          <button
            onClick={this.handleReset}
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--accent, #6366f1)',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
