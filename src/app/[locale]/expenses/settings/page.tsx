'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Download,
  Upload,
  Check,
  Cloud,
  CreditCard,
  Sparkles,
  LogOut,
  Trash2,
  AlertTriangle,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { exportExpenseFlowData, setExpenseSetting, db } from '@/lib/db';
import { SyncStatus } from '@/components/expenses/sync-status';
import { PremiumGate, PremiumBadge } from '@/components/premium/premium-gate';
import { useIsPremium } from '@/hooks/use-premium';
import { createClient } from '@/lib/supabase/client';

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
  const tPremium = useTranslations('premium');

  const { baseCurrency, setBaseCurrency } = useExpenseStore();
  const { isPremium, tier, isFoundingMember, expiresAt } = useIsPremium();
  
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showSuccessMessage = (message: string) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), 3000);
  };

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
      showSuccessMessage('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      await db.expenseTransactions.clear();
      await db.expenseCategories.clear();
      await db.expenseBudgets.clear();
      await db.expenseSettings.clear();
      
      // Recarregar categorias default
      window.location.reload();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  };

  const getTierDisplay = () => {
    if (isFoundingMember) return 'Founding Member';
    switch (tier) {
      case 'pro': return 'Pro';
      case 'plus': return 'Plus';
      case 'starter': return 'Starter';
      default: return 'Free';
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        {t('title')}
      </h1>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-success text-white px-4 py-2 rounded-xl shadow-soft-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          {showSuccess}
        </div>
      )}

      <div className="space-y-6">
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPremium ? (
                <Crown className="w-5 h-5 text-amber-500" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {t('subscription')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {getTierDisplay()}
                </p>
                {isPremium && expiresAt && (
                  <p className="text-sm text-neutral-500">
                    {isFoundingMember 
                      ? 'Lifetime access' 
                      : `Renews ${expiresAt.toLocaleDateString()}`}
                  </p>
                )}
                {!isPremium && (
                  <p className="text-sm text-neutral-500">
                    {t('upgradeToUnlock')}
                  </p>
                )}
              </div>
              {!isPremium && (
                <Link href={`/${locale}/pricing`}>
                  <Button leftIcon={<Sparkles className="w-4 h-4" />}>
                    {tPremium('upgrade')}
                  </Button>
                </Link>
              )}
              {isPremium && !isFoundingMember && (
                <Link href={`/${locale}/account/billing`}>
                  <Button variant="outline">
                    {t('manageBilling')}
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cloud Sync - Premium Feature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              {t('cloudSync')}
              {!isPremium && <PremiumBadge />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PremiumGate feature="cloudSync" locale={locale} fallback="replace">
              <SyncStatus showDetails />
            </PremiumGate>
          </CardContent>
        </Card>

        {/* Base Currency */}
        <Card>
          <CardHeader>
            <CardTitle>{t('baseCurrency')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {t('baseCurrencyDescription')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency.code)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    baseCurrency === currency.code
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                  )}
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {currency.symbol}
                  </span>
                  <span className="text-sm text-neutral-500 ml-2">
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
            <CardTitle>{t('dataManagement')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {t('exportData')}
                </p>
                <p className="text-sm text-neutral-500">
                  {t('exportDescription')}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                leftIcon={<Download className="w-4 h-4" />}
              >
                {isExporting ? t('exporting') : t('export')}
              </Button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {t('importData')}
                </p>
                <p className="text-sm text-neutral-500">
                  {t('importDescription')}
                </p>
              </div>
              <Link href={`/${locale}/expenses/import`}>
                <Button
                  variant="outline"
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  {t('import')}
                </Button>
              </Link>
            </div>

            {/* Delete All */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {t('deleteAllData')}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {t('deleteWarning')}
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              {t('signOut')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md mx-4 shadow-soft-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t('confirmDelete')}
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {t('confirmDeleteMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAllData}
                disabled={isDeleting}
              >
                {isDeleting ? t('deleting') : t('confirmDeleteButton')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
