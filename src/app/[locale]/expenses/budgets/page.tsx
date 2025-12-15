'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  TrendingUp,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { db, getExpenseTransactions } from '@/lib/db';
import type { ExpenseBudget, ExpenseCategory } from '@/lib/db';

interface BudgetWithProgress extends ExpenseBudget {
  categoryName?: string;
  categoryColor?: string;
  spent: number;
  percentage: number;
  remaining: number;
  isOver: boolean;
}

export default function BudgetsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow.budgets');
  const tCategories = useTranslations('expenseFlow.categories.default');

  const { categories, baseCurrency, selectedMonth, selectedYear } = useExpenseStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ExpenseBudget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ExpenseBudget | null>(null);

  // Form state
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formAmount, setFormAmount] = useState('');
  const [formPeriod, setFormPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Load budgets
  const budgets = useLiveQuery(
    () => db.expenseBudgets.filter((b) => b.isActive).toArray(),
    []
  );

  // Load transactions for the current period
  const [periodExpenses, setPeriodExpenses] = useState<Record<number, number>>({});
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    async function loadExpenses() {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;

      const transactions = await getExpenseTransactions(startDate, endDate, 'expense');

      let total = 0;
      const byCategory: Record<number, number> = {};

      transactions.forEach((tx) => {
        const amount = tx.amountInBase ?? tx.amount;
        total += amount;
        if (tx.categoryId) {
          byCategory[tx.categoryId] = (byCategory[tx.categoryId] || 0) + amount;
        }
      });

      setTotalExpenses(total);
      setPeriodExpenses(byCategory);
    }

    loadExpenses();
  }, [selectedMonth, selectedYear]);

  const budgetsWithProgress = useMemo((): BudgetWithProgress[] => {
    if (!budgets) return [];

    return budgets.map((budget) => {
      const category = budget.categoryId
        ? categories.find((c) => c.id === budget.categoryId)
        : null;

      const spent = budget.categoryId
        ? periodExpenses[budget.categoryId] || 0
        : totalExpenses;

      const effectiveAmount =
        budget.period === 'yearly' ? budget.amount / 12 : budget.amount;

      const percentage = effectiveAmount > 0 ? (spent / effectiveAmount) * 100 : 0;
      const remaining = effectiveAmount - spent;
      const isOver = spent > effectiveAmount;

      return {
        ...budget,
        categoryName: category?.nameKey
          ? tCategories(category.nameKey)
          : category?.name || 'Total',
        categoryColor: category?.color || '#6b7280',
        spent,
        percentage: Math.min(percentage, 100),
        remaining,
        isOver,
      };
    });
  }, [budgets, categories, periodExpenses, totalExpenses, tCategories]);

  const handleStartAdd = () => {
    setFormCategoryId('');
    setFormAmount('');
    setFormPeriod('monthly');
    setIsAdding(true);
    setEditingBudget(null);
  };

  const handleStartEdit = (budget: ExpenseBudget) => {
    setFormCategoryId(budget.categoryId || '');
    setFormAmount(budget.amount.toString());
    setFormPeriod(budget.period);
    setEditingBudget(budget);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingBudget(null);
    setFormCategoryId('');
    setFormAmount('');
  };

  const handleSave = async () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;

    const now = new Date();

    if (editingBudget?.id) {
      await db.expenseBudgets.update(editingBudget.id, {
        categoryId: formCategoryId || undefined,
        amount,
        period: formPeriod,
        updatedAt: now,
      });
    } else {
      await db.expenseBudgets.add({
        categoryId: formCategoryId || undefined,
        amount,
        period: formPeriod,
        startDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      } as ExpenseBudget);
    }

    handleCancel();
  };

  const handleDelete = async (budget: ExpenseBudget) => {
    if (!budget.id) return;
    await db.expenseBudgets.update(budget.id, {
      isActive: false,
      updatedAt: new Date(),
    });
    setDeleteConfirm(null);
  };

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  );

  // Categories already with budgets
  const budgetedCategoryIds = new Set(budgets?.map((b) => b.categoryId).filter(Boolean));

  // Available categories (not yet budgeted)
  const availableCategories = expenseCategories.filter(
    (c) => !budgetedCategoryIds.has(c.id) || editingBudget?.categoryId === c.id
  );

  const getCategoryDisplayName = (category: ExpenseCategory) => {
    if (category.nameKey) return tCategories(category.nameKey);
    return category.name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('title')}
        </h1>
        <Button
          size="sm"
          onClick={handleStartAdd}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {t('add')}
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingBudget) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingBudget ? t('edit') : t('add')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                {t('category')}
              </label>
              <select
                value={formCategoryId}
                onChange={(e) =>
                  setFormCategoryId(e.target.value ? Number(e.target.value) : '')
                }
                className={cn(
                  'w-full px-3 py-2 rounded-lg border',
                  'bg-white dark:bg-neutral-800',
                  'border-neutral-200 dark:border-neutral-700',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
              >
                <option value="">{t('totalAllExpenses')}</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryDisplayName(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                {t('amount')} ({baseCurrency})
              </label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                {t('period')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormPeriod('monthly')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    formPeriod === 'monthly'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  )}
                >
                  {t('monthly')}
                </button>
                <button
                  onClick={() => setFormPeriod('yearly')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    formPeriod === 'yearly'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  )}
                >
                  {t('yearly')}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={handleCancel} className="flex-1">
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formAmount || parseFloat(formAmount) <= 0}
                className="flex-1"
              >
                {t('save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      {budgetsWithProgress.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {t('empty')}
            </p>
            <Button onClick={handleStartAdd} leftIcon={<Plus className="h-4 w-4" />}>
              {t('createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgetsWithProgress.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              currency={baseCurrency}
              locale={locale}
              t={t}
              onEdit={() => handleStartEdit(budget)}
              onDelete={() => setDeleteConfirm(budget)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 max-w-sm w-full">
            <CardContent className="pt-6 text-center">
              <p className="text-neutral-900 dark:text-neutral-100 mb-6">
                {t('confirmDelete')}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                  {t('cancel')}
                </Button>
                <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>
                  {t('delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface BudgetCardProps {
  budget: BudgetWithProgress;
  currency: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  onEdit: () => void;
  onDelete: () => void;
}

function BudgetCard({ budget, currency, locale, t, onEdit, onDelete }: BudgetCardProps) {
  const effectiveAmount =
    budget.period === 'yearly' ? budget.amount / 12 : budget.amount;

  return (
    <Card className={cn(budget.isOver && 'border-red-300 dark:border-red-800')}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: budget.categoryColor }}
            >
              {budget.categoryId ? (
                <span className="text-white font-semibold">
                  {budget.categoryName?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <Target className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {budget.categoryName}
              </p>
              <p className="text-xs text-neutral-500">
                {budget.period === 'yearly' ? `${t('yearly')} (${formatCurrency(budget.amount, currency, locale)})` : t('monthly')}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              {t('spent')}: {formatCurrency(budget.spent, currency, locale)}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatCurrency(effectiveAmount, currency, locale)}
            </span>
          </div>

          <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                budget.isOver
                  ? 'bg-red-500'
                  : budget.percentage > 80
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              )}
              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            {budget.isOver ? (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                {t('over')} {formatCurrency(Math.abs(budget.remaining), currency, locale)}
              </span>
            ) : (
              <span className="text-neutral-600 dark:text-neutral-400">
                {t('remaining')}: {formatCurrency(budget.remaining, currency, locale)}
              </span>
            )}
            <span
              className={cn(
                'font-medium',
                budget.isOver
                  ? 'text-red-600'
                  : budget.percentage > 80
                    ? 'text-amber-600'
                    : 'text-green-600'
              )}
            >
              {budget.percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
