import { Component, Suspense, lazy } from 'react';

/**
 * Graceful wrapper around the React Three Fiber scene.
 * The WebGL canvas is lazy-loaded and wrapped in an error boundary so
 * that if WebGL is unavailable (or a device is too weak), the rest of
 * the page renders normally and the hero simply falls back to styling.
 */
const HeroScene = lazy(() => import('./HeroScene'));

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    /* WebGL unsupported — fall back silently. */
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="hero-scene-skeleton" aria-hidden="true">
    <div className="hero-sculpt-mark">L</div>
  </div>
);

export default function Scene3DWrap() {
  return (
    <SceneBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <HeroScene />
      </Suspense>
    </SceneBoundary>
  );
}
