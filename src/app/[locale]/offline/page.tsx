'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WifiOff, RefreshCw, Home, HardDrive, CheckCircle } from 'lucide-react';

// Inline translations for offline reliability
const messages = {
  en: {
    title: "You're Offline",
    description: "Don't worry! Your data is safely stored on your device. Connect to the internet to access all features.",
    retry: "Try Again",
    home: "Go to Home",
    tip: "Tip: Your expenses and workouts are saved locally and will sync when you're back online.",
    reconnecting: "Reconnecting...",
    backOnline: "Back Online!",
    dataIsSafe: "Your data is safe locally",
    autoSync: "Changes will sync when online",
    allFeatures: "All features available offline",
    connectionStatus: "Connection Status",
    offline: "Offline",
  },
  pt: {
    title: "Estás Offline",
    description: "Não te preocupes! Os teus dados estão guardados em segurança no teu dispositivo. Liga-te à internet para aceder a todas as funcionalidades.",
    retry: "Tentar Novamente",
    home: "Ir para Início",
    tip: "Dica: As tuas despesas e treinos estão guardados localmente e serão sincronizados quando voltares online.",
    reconnecting: "A reconectar...",
    backOnline: "De Volta Online!",
    dataIsSafe: "Os teus dados estão seguros localmente",
    autoSync: "Alterações serão sincronizadas quando online",
    allFeatures: "Todas as funcionalidades disponíveis offline",
    connectionStatus: "Estado da Ligação",
    offline: "Offline",
  },
  es: {
    title: "Estás Sin Conexión",
    description: "¡No te preocupes! Tus datos están guardados de forma segura en tu dispositivo. Conéctate a internet para acceder a todas las funciones.",
    retry: "Intentar de Nuevo",
    home: "Ir al Inicio",
    tip: "Consejo: Tus gastos y entrenamientos están guardados localmente y se sincronizarán cuando vuelvas a estar online.",
    reconnecting: "Reconectando...",
    backOnline: "¡De Vuelta Online!",
    dataIsSafe: "Tus datos están seguros localmente",
    autoSync: "Los cambios se sincronizarán cuando estés online",
    allFeatures: "Todas las funciones disponibles offline",
    connectionStatus: "Estado de Conexión",
    offline: "Sin Conexión",
  },
  fr: {
    title: "Vous êtes Hors Ligne",
    description: "Ne vous inquiétez pas ! Vos données sont stockées en toute sécurité sur votre appareil. Connectez-vous à internet pour accéder à toutes les fonctionnalités.",
    retry: "Réessayer",
    home: "Aller à l'Accueil",
    tip: "Astuce : Vos dépenses et entraînements sont sauvegardés localement et seront synchronisés lorsque vous serez de nouveau en ligne.",
    reconnecting: "Reconnexion...",
    backOnline: "De Retour en Ligne !",
    dataIsSafe: "Vos données sont en sécurité localement",
    autoSync: "Les modifications seront synchronisées en ligne",
    allFeatures: "Toutes les fonctionnalités disponibles hors ligne",
    connectionStatus: "État de la Connexion",
    offline: "Hors Ligne",
  },
};

export default function OfflinePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = messages[locale as keyof typeof messages] || messages.en;

  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to home when back online
      setTimeout(() => {
        window.location.href = `/${locale}`;
      }, 1500);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [locale]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Reconnecting state
  if (isOnline) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500 animate-bounce" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-warm-900 mb-4">
            {t.backOnline} 🎉
          </h1>
          <p className="text-warm-600 mb-4">{t.reconnecting}</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-warm-200 rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-warm-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-warm-900 mb-4">
          {t.title}
        </h1>

        {/* Description */}
        <p className="text-warm-600 mb-8 leading-relaxed">{t.description}</p>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 mb-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-warm-700">{t.connectionStatus}</span>
            <span className="flex items-center gap-2 text-sm text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {t.offline}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-green-600" />
              </div>
              <span>{t.dataIsSafe}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span>{t.allFeatures}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-green-600" />
              </div>
              <span>{t.autoSync}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {t.reconnecting}
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                {t.retry}
              </>
            )}
          </button>

          <button
            onClick={() => (window.location.href = `/${locale}`)}
            className="w-full px-6 py-3 bg-warm-200 hover:bg-warm-300 text-warm-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t.home}
          </button>
        </div>

        {/* Tip */}
        <p className="mt-6 text-sm text-warm-500">💡 {t.tip}</p>
      </div>
    </div>
  );
}
