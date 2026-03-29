import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 max-w-md w-full">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              Qualcosa è andato storto
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
            >
              Ricarica Pagina
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left">
                <p className="text-xs font-mono text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg overflow-auto">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
