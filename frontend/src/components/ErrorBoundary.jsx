import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-200 font-sans">
          <div className="w-full max-w-md rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
              <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-rose-300 tracking-tight">System Error</h2>
            <p className="mb-6 text-sm text-slate-400 leading-relaxed">
              We encountered an unexpected issue while rendering this page. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
            >
              Reload Forge
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
