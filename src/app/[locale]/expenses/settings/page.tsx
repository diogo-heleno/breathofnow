'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Upload, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { exportExpenseFlowData, setExpenseSetting } from '@/lib/db';

const CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
];

export default function SettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow.settings');

  const { baseCurrency, setBaseCurrency } = useExpenseStore();
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleCurrencyChange = async (currency: string) => {
    setBaseCurrency(currency);
    await setExpenseSetting('base_currency', currency);
    showSuccessMessage('Currency updated');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportExpenseFlowData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenseflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccessMessage(t('exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        {t('title')}
      </h1>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg animate-fade-in">
          <Check className="h-5 w-5" />
          {showSuccess}
        </div>
      )}

      {/* Base Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('currency')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                  baseCurrency === currency.code
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                )}
              >
                <span className="text-xl font-semibold">{currency.symbol}</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {currency.code}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExport}
            isLoading={isExporting}
          >
            {t('export')}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            leftIcon={<Upload className="h-4 w-4" />}
            disabled
          >
            {t('import')} (Coming soon)
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              ExpenseFlow
            </p>
            <p className="text-sm text-neutral-500">
              Part of the Breath of Now ecosystem
            </p>
            <p className="text-xs text-neutral-400">Version 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
