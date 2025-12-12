'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { App, PlanTier } from '@/types/pricing';

type ModalType = 'select' | 'change' | 'deselect';

interface AppSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: ModalType;
  app: App;
  currentApp?: App; // For change action
  tier: PlanTier;
  isLoading?: boolean;
  error?: string | null;
}

export function AppSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  app,
  currentApp,
  tier,
  isLoading = false,
  error = null,
}: AppSelectionModalProps) {
  const t = useTranslations();

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'select':
        return t('account.apps.modal.selectTitle');
      case 'change':
        return t('account.apps.modal.changeTitle');
      case 'deselect':
        return t('account.apps.modal.deselectTitle');
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'select':
        if (tier === 'free') {
          return t('account.apps.modal.selectDescriptionFree', { appName: app.name });
        }
        return t('account.apps.modal.selectDescription', { appName: app.name });
      case 'change':
        return t('account.apps.modal.changeDescription', {
          oldApp: currentApp?.name || '',
          newApp: app.name,
        });
      case 'deselect':
        return t('account.apps.modal.deselectDescription', { appName: app.name });
    }
  };

  const getWarning = () => {
    switch (type) {
      case 'select':
        if (tier === 'free') {
          return t('account.apps.modal.selectWarningFree');
        }
        return null;
      case 'change':
        return t('account.apps.modal.changeWarning', { oldApp: currentApp?.name || '' });
      case 'deselect':
        return t('account.apps.modal.deselectWarning', { appName: app.name });
    }
  };

  const warning = getWarning();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md animate-scale-in">
        <CardContent className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>

          {/* Content */}
          <div className="space-y-4">
            {/* Title */}
            <h3 className="text-xl font-semibold text-neutral-900 pr-8">
              {getTitle()}
            </h3>

            {/* App visualization */}
            {type === 'change' && currentApp ? (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: `${currentApp.color}15` }}
                  >
                    <span
                      className="text-2xl font-semibold"
                      style={{ color: currentApp.color }}
                    >
                      {currentApp.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-700">{currentApp.name}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-400" />
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: `${app.color}15` }}
                  >
                    <span
                      className="text-2xl font-semibold"
                      style={{ color: app.color }}
                    >
                      {app.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-700">{app.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 py-2">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${app.color}15` }}
                >
                  <span
                    className="text-2xl font-semibold"
                    style={{ color: app.color }}
                  >
                    {app.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{app.name}</p>
                  <p className="text-sm text-neutral-500">{app.description}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-neutral-600">{getDescription()}</p>

            {/* Warning */}
            {warning && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{warning}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant={type === 'deselect' ? 'danger' : 'primary'}
                className="flex-1"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t('common.confirm')}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
