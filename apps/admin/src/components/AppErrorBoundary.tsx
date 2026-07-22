import React from 'react';
import { useLocale } from '../contexts/LocaleContext';

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Linketry Admin render failed.', error, info.componentStack);
  }

  render() {
    return this.state.failed ? <AppErrorFallback /> : this.props.children;
  }
}

function AppErrorFallback() {
  const { t } = useLocale();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
        <h1 className="text-xl font-semibold">{t('renderErrorTitle')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('renderErrorDescription')}</p>
        <button
          type="button"
          className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          onClick={() => window.location.reload()}
        >
          {t('reloadPage')}
        </button>
      </section>
    </main>
  );
}
