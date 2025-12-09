'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import type { ExpenseTransaction, ExpenseCategory } from '@/lib/db';

interface EditTransactionModalProps {
  transaction: ExpenseTransaction;
  categories: ExpenseCategory[];
  locale: string;
  onClose: () => void;
  onSave: (updated: ExpenseTransaction) => void;
}

export function EditTransactionModal({
  transaction,
  categories,
  locale,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  const t = useTranslations('expenseFlow.quickAdd');
  const tCategories = useTranslations('expenseFlow.categories.default');

  const [type, setType] = useState<'expense' | 'income'>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState<number | undefined>(transaction.categoryId);
  const [description, setDescription] = useState(transaction.description || '');
  const [date, setDate] = useState(transaction.date);
  const [isSaving, setIsSaving] = useState(false);

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  );

  const getCategoryDisplayName = (category: ExpenseCategory) => {
    if (category.nameKey) {
      return tCategories(category.nameKey);
    }
    return category.name;
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    const parts = normalized.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(normalized);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0 || !transaction.id) return;

    setIsSaving(true);
    try {
      const updated: ExpenseTransaction = {
        ...transaction,
        type,
        amount: parseFloat(amount),
        categoryId,
        description: description || undefined,
        date,
        updatedAt: new Date(),
      };

      await db.expenseTransactions.update(transaction.id, {
        type,
        amount: parseFloat(amount),
        categoryId,
        description: description || undefined,
        date,
        updatedAt: new Date(),
        syncStatus: 'pending',
      });

      onSave(updated);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('title')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
            <button
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                type === 'expense'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
              )}
            >
              {t('expense')}
            </button>
            <button
              onClick={() => setType('income')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                type === 'income'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
              )}
            >
              {t('income')}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t('amount')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                'w-full px-4 py-3 text-xl font-semibold text-center',
                'bg-white dark:bg-neutral-900 border-2 rounded-xl',
                'focus:outline-none focus:ring-0',
                type === 'expense'
                  ? 'border-red-200 dark:border-red-800 focus:border-red-500 text-red-600'
                  : 'border-green-200 dark:border-green-800 focus:border-green-500 text-green-600'
              )}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t('category')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                    categoryId === cat.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name.charAt(0)}
                  </div>
                  <span className="text-xs text-center text-neutral-700 dark:text-neutral-300 line-clamp-1">
                    {getCategoryDisplayName(cat)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t('description')}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t('date')}
            </label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!amount || parseFloat(amount) <= 0 || isSaving}
              isLoading={isSaving}
              className={cn(
                'flex-1',
                type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              )}
            >
              {t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
