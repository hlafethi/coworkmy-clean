import { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/utils/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, { errorInfo: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-800">Une erreur est survenue</h2>
          <p className="text-red-800">Veuillez rafraîchir la page ou contacter le support.</p>
          <div className="error-message">Une erreur est survenue</div>
        </div>
      );
    }

    return this.props.children;
  }
}
