'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { getMonthlyExpenseSummary, getExpenseTransactions } from '@/lib/db';
import type { ExpenseTransaction } from '@/lib/db';

export default function ExpenseDashboard({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow');
  const tMonths = useTranslations('expenseFlow.months');
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    monthSummary,
    setMonthSummary,
    categories,
    baseCurrency,
    isInitialized,
  } = useExpenseStore();

  const [recentTransactions, setRecentTransactions] = useState<ExpenseTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data when month changes or on init
  useEffect(() => {
    async function loadData() {
      if (!isInitialized) return;

      setIsLoading(true);
      try {
        const summary = await getMonthlyExpenseSummary(selectedYear, selectedMonth);
        setMonthSummary(summary);

        // Get recent transactions (last 5)
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
        const transactions = await getExpenseTransactions(startDate, endDate);
        setRecentTransactions(transactions.slice(0, 5));
      } catch (error) {
        console.error('Failed to load expense data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedMonth, selectedYear, isInitialized, setMonthSummary]);

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ] as const;

  const currentMonthName = tMonths(monthNames[selectedMonth - 1]);

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12, selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1, selectedYear);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1, selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1, selectedYear);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: baseCurrency,
    }).format(amount);
  };

  const getCategoryById = (id: number) => {
    return categories.find((c) => c.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {currentMonthName} {selectedYear}
        </h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Expenses */}
        <Card padding="sm">
          <CardContent>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">{t('dashboard.expenses')}</span>
            </div>
            <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {isLoading ? '...' : formatCurrency(monthSummary?.totalExpenses ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Income */}
        <Card padding="sm">
          <CardContent>
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">{t('dashboard.income')}</span>
            </div>
            <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {isLoading ? '...' : formatCurrency(monthSummary?.totalIncome ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card padding="sm">
          <CardContent>
            <div className="flex items-center gap-2 text-primary-500 mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">{t('dashboard.balance')}</span>
            </div>
            <p
              className={cn(
                'text-xl font-semibold',
                (monthSummary?.balance ?? 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {isLoading ? '...' : formatCurrency(monthSummary?.balance ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Transaction Count */}
        <Card padding="sm">
          <CardContent>
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Receipt className="h-4 w-4" />
              <span className="text-xs font-medium">{t('dashboard.transactions')}</span>
            </div>
            <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {isLoading ? '...' : monthSummary?.transactionCount ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Button */}
      <Link href={`/${locale}/expenses/add`}>
        <Button className="w-full" size="lg" leftIcon={<Plus className="h-5 w-5" />}>
          {t('quickAdd.title')}
        </Button>
      </Link>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base">{t('dashboard.recentTransactions')}</CardTitle>
          <Link
            href={`/${locale}/expenses/transactions`}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {t('dashboard.viewAll')}
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-neutral-500">{t('dashboard.noTransactions')}</div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-neutral-500 mb-4">{t('dashboard.noTransactions')}</p>
              <Link href={`/${locale}/expenses/add`}>
                <Button variant="outline" size="sm">
                  {t('dashboard.addFirst')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => {
                const category = transaction.categoryId
                  ? getCategoryById(transaction.categoryId)
                  : null;
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {category && (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <span style={{ color: category.color }} className="text-lg">
                            {/* Icon placeholder - would need dynamic icon loading */}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {transaction.description || category?.name || 'Transaction'}
                        </p>
                        <p className="text-xs text-neutral-500">{transaction.date}</p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        'font-semibold',
                        transaction.type === 'expense'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      )}
                    >
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
