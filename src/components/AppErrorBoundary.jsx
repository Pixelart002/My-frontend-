import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Luviio] Unhandled UI error:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="page container">
        <div className="state state-critical" role="alert">
          <div className="state-icon state-icon-alert" aria-hidden="true">!</div>
          <div className="state-title">We could not render this page</div>
          <p className="state-message">
            The page hit an unexpected UI error. Your cart and account data remain safe on the server.
          </p>
          <details style={{ maxWidth: 720, margin: '16px auto 0', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
              Technical details
            </summary>
            <pre
              style={{
                marginTop: 10,
                padding: 12,
                overflowX: 'auto',
                borderRadius: 10,
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {String(this.state.error?.message || this.state.error || 'Unknown render error')}
            </pre>
          </details>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn" type="button" onClick={this.handleReset}>Try again</button>
            <button className="btn btn-quiet" type="button" onClick={() => window.location.assign('/')}>Go home</button>
          </div>
        </div>
      </main>
    );
  }
}
