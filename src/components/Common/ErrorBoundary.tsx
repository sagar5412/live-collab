import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <AlertTriangle size={48} className="error-boundary__icon" />
            <h2>Something went wrong</h2>
            <p className="error-boundary__message">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button className="error-boundary__btn" onClick={this.handleRetry}>
              <RefreshCw size={16} />
              Try Again
            </button>
            {this.state.errorInfo && (
              <details className="error-boundary__details">
                <summary>Technical Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
          <style>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 300px;
              padding: var(--spacing-lg);
              background: var(--color-bg-primary);
            }
            .error-boundary__content {
              text-align: center;
              max-width: 400px;
            }
            .error-boundary__icon {
              color: var(--color-error);
              margin-bottom: var(--spacing-md);
            }
            .error-boundary h2 {
              color: var(--color-text-primary);
              margin-bottom: var(--spacing-sm);
            }
            .error-boundary__message {
              color: var(--color-text-secondary);
              margin-bottom: var(--spacing-lg);
            }
            .error-boundary__btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              background: var(--color-accent);
              border: none;
              border-radius: var(--radius-md);
              color: white;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all var(--transition-normal);
            }
            .error-boundary__btn:hover {
              background: var(--color-accent-hover);
            }
            .error-boundary__details {
              margin-top: var(--spacing-lg);
              text-align: left;
              background: var(--color-bg-secondary);
              border-radius: var(--radius-md);
              padding: var(--spacing-md);
            }
            .error-boundary__details summary {
              color: var(--color-text-secondary);
              cursor: pointer;
              font-size: 12px;
            }
            .error-boundary__details pre {
              margin-top: var(--spacing-sm);
              font-size: 11px;
              color: var(--color-text-muted);
              white-space: pre-wrap;
              word-break: break-all;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
