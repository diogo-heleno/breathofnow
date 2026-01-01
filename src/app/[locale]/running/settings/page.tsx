'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Settings, Trash2, Download, Upload, Bell, Watch, Eye } from 'lucide-react';
import { useState } from 'react';
import { runningDb } from '@/lib/db/running-db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const t = useTranslations('runLog');
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activePlan = useLiveQuery(() => runningDb.getActivePlan());
  const allPlans = useLiveQuery(() => runningDb.getAllPlans());

  const handleDeletePlan = async () => {
    if (!activePlan?.id) return;

    setIsDeleting(true);
    try {
      await runningDb.deletePlan(activePlan.id);
      setShowDeleteConfirm(false);
      router.push('/running');
    } catch (error) {
      console.error('Failed to delete plan:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    const plans = await runningDb.getAllPlans();
    const sessions = await runningDb.getSessionHistory(1000);

    const exportData = {
      exportedAt: new Date().toISOString(),
      plans,
      sessions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runlog-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pb-24">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/running" className="inline-flex items-center gap-2 text-primary-100 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </Link>

          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Definições
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 -mt-4 space-y-4">
        {/* Current Plan */}
        {activePlan && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Plano Atual</h2>
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{activePlan.name}</div>
                <div className="text-sm text-gray-500">
                  {activePlan.totalWeeks} semanas • {activePlan.startDate} - {activePlan.endDate}
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Display Options */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visualização
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-gray-700">Mostrar explicações "Porquê"</span>
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-gray-700">Mostrar zonas cardíacas</span>
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <span className="text-gray-700">Lembrete de treino</span>
                <p className="text-sm text-gray-500">Receber notificação nos dias de treino</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Garmin Integration */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Watch className="w-5 h-5" />
            Garmin Connect
          </h2>
          <p className="text-gray-500 text-sm mb-3">
            Sincroniza automaticamente os teus treinos com o Garmin Connect.
          </p>
          <button
            disabled
            className="w-full bg-gray-100 text-gray-400 py-3 rounded-lg font-medium cursor-not-allowed"
          >
            Em breve
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Dados</h2>
          <div className="space-y-2">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Exportar dados</span>
              </div>
            </button>
            <Link
              href="/running/import"
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Importar plano</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Apagar plano?</h3>
              <p className="text-gray-600 mb-6">
                Esta ação não pode ser desfeita. Todos os treinos e sessões deste plano serão apagados.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletePlan}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'A apagar...' : 'Apagar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
