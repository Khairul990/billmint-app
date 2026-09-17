import React from 'react';
import { ServerCrash } from 'lucide-react';
import { Button } from './ui/Button';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AdminErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-theme-main rounded-3xl border border-rose-500/20 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />
          <div className="p-4 rounded-full bg-rose-500/20 mb-6">
            <ServerCrash className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-2xl font-black text-theme-primary mb-2 tracking-tight">Admin Console Error</h1>
          <p className="text-sm text-theme-secondary mb-6 max-w-md mx-auto">
            A component inside the owner console failed to render.
          </p>
          <div className="p-4 bg-theme-surface-elevated rounded-xl border border-theme-border-soft mb-6 text-left max-w-2xl overflow-x-auto w-full">
            <p className="text-xs font-mono text-rose-400 font-bold mb-2">{this.state.error?.toString()}</p>
            <pre className="text-[10px] text-theme-muted font-mono leading-relaxed whitespace-pre-wrap">
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Application
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AdminErrorBoundary;
