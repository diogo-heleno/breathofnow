'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ExpenseTransaction, ExpenseCategory } from '@/lib/db';

interface TransactionItemProps {
  transaction: ExpenseTransaction;
  category?: ExpenseCategory;
  locale: string;
  currency: string;
  onEdit?: (transaction: ExpenseTransaction) => void;
  onDelete?: (transaction: ExpenseTransaction) => void;
}

export function TransactionItem({
  transaction,
  category,
  locale,
  currency,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const t = useTranslations('expenseFlow.transactions');
  const tCategories = useTranslations('expenseFlow.categories.default');
  const [showActions, setShowActions] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: transaction.currency || currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const getCategoryDisplayName = () => {
    if (!category) return '';
    if (category.nameKey) {
      return tCategories(category.nameKey);
    }
    return category.name;
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 py-3 px-4 -mx-4',
        'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors rounded-xl'
      )}
    >
      {/* Category Icon */}
      {category && (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: category.color + '20' }}
        >
          <span
            className="text-lg font-semibold"
            style={{ color: category.color }}
          >
            {category.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {transaction.description || getCategoryDisplayName() || 'Transaction'}
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{formatDate(transaction.date)}</span>
          {category && (
            <>
              <span>·</span>
              <span style={{ color: category.color }}>{getCategoryDisplayName()}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <p
        className={cn(
          'font-semibold shrink-0',
          transaction.type === 'expense'
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        )}
      >
        {transaction.type === 'expense' ? '-' : '+'}
        {formatCurrency(transaction.amount)}
      </p>

      {/* Actions Button (Desktop) */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowActions(!showActions)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {/* Actions Dropdown */}
        {showActions && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowActions(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[140px]">
              <button
                onClick={() => {
                  setShowActions(false);
                  onEdit?.(transaction);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" />
                {t('edit')}
              </button>
              <button
                onClick={() => {
                  setShowActions(false);
                  onDelete?.(transaction);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                {t('delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
