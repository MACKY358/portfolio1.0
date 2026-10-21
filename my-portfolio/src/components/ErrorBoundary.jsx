import { Component } from 'react'

/**
 * Catches render errors so a single broken component cannot leave visitors
 * with a blank page. The fallback is intentionally self-contained: it uses
 * inline styles because the app's stylesheets may be the thing that failed.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep the report in the console; there is no backend to send it to.
    console.error('Unhandled render error', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          background: '#081b29',
          color: '#f1f5f9',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '24px', margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
          The page could not be displayed. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: '#00eaff',
            color: '#081b29',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
