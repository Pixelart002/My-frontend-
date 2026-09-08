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
        <div className="state" role="alert">
          <div className="state-title">We could not render this page</div>
          <p style={{ margin: 0 }}>The page hit an unexpected UI error. Your cart and account data are kept on the server.</p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn" type="button" onClick={this.handleReset}>Try again</button>
            <button className="btn btn-quiet" type="button" onClick={() => window.location.assign('/')}>Go home</button>
          </div>
        </div>
      </main>
    );
  }
}
