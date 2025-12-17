import React, { ErrorInfo, ReactNode } from 'react';
import { WarningIcon, ReloadIcon } from './icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare props to satisfy TypeScript if inference fails
  declare props: Readonly<Props>;

  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
      // Attempt to recover by reloading the page
      window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-white bg-[#10172A] z-50 relative">
          <div className="bg-red-500/10 p-4 rounded-full mb-6 animate-pulse">
            <WarningIcon className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h2>
          <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
            We encountered an unexpected error. Don't worry, your data is safe. Please try reloading the app.
          </p>
          
          <div className="bg-gray-800/50 p-4 rounded-lg mb-8 max-w-full overflow-hidden">
             <p className="text-xs text-red-400 font-mono break-all line-clamp-3">
                {this.state.error?.toString()}
             </p>
          </div>

          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-lg shadow-purple-500/20"
          >
            <ReloadIcon className="w-5 h-5" />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;