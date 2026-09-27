import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#0D1117',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            backgroundColor: '#161B22',
            padding: '2.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#38BDF8' }}>
              NoRegis — Une erreur est survenue
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1rem' }}>
              Une exception inattendue s'est produite lors de l'affichage de la page.
            </p>
            {this.state.error && (
              <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: '#EF4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace'
                }}>
                  {this.state.error.toString()}
                </div>
                {this.state.error.stack && (
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary style={{ fontSize: '0.75rem', color: '#64748B', cursor: 'pointer' }}>Voir les détails de l'erreur (Stack)</summary>
                    <pre style={{
                      fontSize: '0.7rem',
                      color: '#CBD5E1',
                      backgroundColor: '#0D1117',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      marginTop: '0.5rem',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '200px'
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#0284C7',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
