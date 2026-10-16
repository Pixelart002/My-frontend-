import { Component } from 'react';
import {
  RiAlertLine,
  RiHome4Line,
  RiRefreshLine,
} from '@remixicon/react';

const getErrorId = () =>
  `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export default class AppErrorBoundary extends Component {
  state = {
    error: null,
    errorId: null,
  };
  
  static getDerivedStateFromError(error) {
    return {
      error,
      errorId: getErrorId(),
    };
  }
  
  componentDidCatch(error, info) {
    const { errorId } = this.state;
    
    console.error('[Luviio] Unhandled UI error:', {
      error,
      componentStack: info?.componentStack,
      errorId,
      pathname: window.location.pathname,
    });
  }
  
  handleReset = () => {
    // Reload the current route so failed lazy chunks and stale module
    // state can recover after a deployment. Resetting only the boundary
    // state can immediately render the same broken component again.
    window.location.reload();
  };
  
  handleGoHome = () => {
    window.location.assign('/');
  };
  
  render() {
    const {
      error,
      errorId,
    } = this.state;
    
    if (!error) {
      return this.props.children;
    }
    
    return (
      <main
        className="page container app-error-page"
        role="main"
      >
        <section
          className="state app-error-state"
          role="alert"
          aria-live="assertive"
          aria-labelledby="app-error-title"
          aria-describedby="app-error-message"
        >
          <div
            className="app-error-icon"
            aria-hidden="true"
          >
            <RiAlertLine size={24} />
          </div>

          <div className="app-error-content">
            <h1
              id="app-error-title"
              className="state-title"
            >
              We could not render this page
            </h1>

            <p
              id="app-error-message"
              className="state-message"
            >
              Something unexpected happened while loading
              this part of LUVIIO. Your cart and account data
              are kept on the server.
            </p>

            <div className="app-error-actions">
              <button
                className="btn"
                type="button"
                onClick={this.handleReset}
              >
                <RiRefreshLine
                  size={16}
                  aria-hidden="true"
                />
                <span>
                  Try again
                </span>
              </button>

              <button
                className="btn btn-quiet"
                type="button"
                onClick={this.handleGoHome}
              >
                <RiHome4Line
                  size={16}
                  aria-hidden="true"
                />
                <span>Go home</span>
              </button>
            </div>

            {errorId && (
              <div
                className="app-error-reference"
                aria-label={`Error reference ${errorId}`}
              >
                <span>Error reference</span>
                <code>{errorId}</code>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }
}
