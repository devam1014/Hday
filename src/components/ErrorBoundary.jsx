import React from 'react';
import { RefreshCw, Heart } from 'lucide-react';

/**
 * Production-Safe Error Boundary Component
 * Catches JavaScript runtime errors anywhere in the child component tree,
 * logs the error, and displays a graceful, atmospheric fallback UI
 * instead of crashing to a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[ErrorBoundary] Gracefully captured component error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'radial-gradient(circle at center, #23122c 0%, #0d0714 100%)',
            color: '#ffffff',
            fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
            textAlign: 'center',
            position: 'relative',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '36px 28px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 215, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
              }}
            >
              <Heart size={32} color="#ffd700" fill="#ffd700" style={{ opacity: 0.9 }} />
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: '#ffeaa7',
                margin: 0,
                letterSpacing: '1px',
                textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',
              }}
            >
              A Momentary Flutter in the Magic
            </h2>

            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '17px',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.88)',
                margin: 0,
              }}
            >
              A little sparkle momentarily drifted away, but your special celebration is completely safe. Let us gently resume your wonderful journey! ♡
            </p>

            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 28px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 105, 180, 0.3) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.6)',
                color: '#ffffff',
                fontFamily: "'Cinzel', serif",
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 215, 0, 0.25)',
                transition: 'all 0.3s ease',
              }}
            >
              <RefreshCw size={16} />
              <span>Resume Celebration</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
