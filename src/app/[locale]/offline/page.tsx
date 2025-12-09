import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline - Breath of Now',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Ícone de wifi offline */}
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-warm-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-warm-900 mb-4">
          You're Offline
        </h1>

        {/* Descrição */}
        <p className="text-warm-600 mb-8 leading-relaxed">
          Don't worry! Your data is safely stored locally. You can continue using
          <span className="font-semibold text-primary-600"> Breath of Now </span>
          offline. Any changes will sync automatically when you're back online.
        </p>

        {/* Status indicator */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-warm-700">Connection Status</span>
            <span className="flex items-center gap-2 text-sm text-warm-500">
              <span className="w-2 h-2 rounded-full bg-warm-400 animate-pulse"></span>
              Offline
            </span>
          </div>

          <div className="text-left space-y-3">
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your data is safe locally</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>All features available offline</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Auto-sync when back online</span>
            </div>
          </div>
        </div>

        {/* Botão de retry */}
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Try Again
        </button>

        {/* Dica */}
        <p className="mt-6 text-sm text-warm-500">
          💡 Tip: You can install this app on your device for a native-like experience
        </p>
      </div>
    </div>
  );
}
