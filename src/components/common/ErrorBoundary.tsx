import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { BarDaTendaLogo } from './BarDaTendaLogo';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToHome = () => {
    try {
      window.location.hash = '';
      window.history.replaceState(null, '', '/');
    } catch {
      // Ignorar falhas de navegação
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-black/80">
            <BarDaTendaLogo size="md" showGlow className="mx-auto" />

            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100">Ops! Algo inesperado aconteceu</h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                O aplicativo encontrou um erro pontual na interface. Seus dados estão salvos e seguros.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-left text-[11px] text-zinc-400 font-mono overflow-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Sistema
              </button>
              <button
                onClick={this.handleResetToHome}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4" />
                Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
