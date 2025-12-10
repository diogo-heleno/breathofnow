// FitLog Settings Page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Scale,
  Video,
  Bell,
  Vibrate,
  Trash2,
  Download,
  Info,
} from 'lucide-react';
import { useFitLogPreferences } from '@/stores/fitlog-store';
import { fitlogDb } from '@/lib/db/fitlog-db';

interface SettingsPageProps {
  params: { locale: string };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = params;
  const router = useRouter();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const {
    defaultRestTimer,
    weightUnit,
    showVideoLinks,
    autoStartTimer,
    vibrationEnabled,
    setDefaultRestTimer,
    setWeightUnit,
    setShowVideoLinks,
    setAutoStartTimer,
    setVibrationEnabled,
  } = useFitLogPreferences();

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      // Clear all FitLog data
      await fitlogDb.workoutPlans.clear();
      await fitlogDb.workouts.clear();
      await fitlogDb.exercises.clear();
      await fitlogDb.workoutSessions.clear();
      await fitlogDb.exerciseSets.clear();
      await fitlogDb.customExercises.clear();

      // Reload page
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Definições</h1>
      </div>

      {/* Timer Settings */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Timer</h2>
        </div>

        <div className="divide-y divide-neutral-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Tempo de descanso padrão</p>
                <p className="text-sm text-neutral-500">Segundos entre séries</p>
              </div>
            </div>
            <select
              value={defaultRestTimer}
              onChange={(e) => setDefaultRestTimer(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={30}>30s</option>
              <option value={45}>45s</option>
              <option value={60}>60s</option>
              <option value={90}>90s</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Auto-iniciar timer</p>
                <p className="text-sm text-neutral-500">Após completar uma série</p>
              </div>
            </div>
            <Toggle checked={autoStartTimer} onChange={setAutoStartTimer} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Vibração</p>
                <p className="text-sm text-neutral-500">Quando o timer termina</p>
              </div>
            </div>
            <Toggle checked={vibrationEnabled} onChange={setVibrationEnabled} />
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Visualização</h2>
        </div>

        <div className="divide-y divide-neutral-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Unidade de peso</p>
              </div>
            </div>
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lb')}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="kg">Quilogramas (kg)</option>
              <option value="lb">Libras (lb)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Links de vídeo</p>
                <p className="text-sm text-neutral-500">Mostrar durante o treino</p>
              </div>
            </div>
            <Toggle checked={showVideoLinks} onChange={setShowVideoLinks} />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Dados</h2>
        </div>

        <div className="divide-y divide-neutral-100">
          <button
            onClick={() => {
              // TODO: Implement export
              alert('Funcionalidade em desenvolvimento');
            }}
            className="flex items-center gap-3 w-full p-4 text-left hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="font-medium text-neutral-900">Exportar dados</p>
              <p className="text-sm text-neutral-500">Descarregar todos os teus dados</p>
            </div>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-3 w-full p-4 text-left hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-600">Limpar todos os dados</p>
              <p className="text-sm text-neutral-500">Remove planos e histórico</p>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Sobre</h2>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900 mb-1">FitLog v1.0</p>
              <p>
                Parte do ecossistema Breath of Now. Os teus dados ficam guardados localmente no teu
                dispositivo (IndexedDB).
              </p>
              <p className="mt-2">
                <a
                  href={`/${locale}/privacy`}
                  className="text-primary-600 hover:underline"
                >
                  Política de Privacidade
                </a>
                {' · '}
                <a
                  href={`/${locale}/terms`}
                  className="text-primary-600 hover:underline"
                >
                  Termos de Serviço
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 m-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Limpar todos os dados?
            </h3>
            <p className="text-neutral-600 mb-6">
              Esta ação vai eliminar todos os planos de treino e histórico de sessões. Não pode ser
              desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="flex-1 py-3 border border-neutral-300 rounded-xl font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isClearing ? 'A limpar...' : 'Limpar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Toggle Component
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full transition-colors
        ${checked ? 'bg-primary-600' : 'bg-neutral-300'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
