'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TransactionItem } from '@/components/expenses/transaction-item';
import { EditTransactionModal } from '@/components/expenses/edit-transaction-modal';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { db } from '@/lib/db';
import type { ExpenseTransaction } from '@/lib/db';

export default function TransactionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow.transactions');
  const tMonths = useTranslations('expenseFlow.months');

  const {
    selectedMonth,
    selectedYear,
    categories,
    baseCurrency,
    filterCategoryId,
    setFilterCategoryId,
    searchQuery,
    setSearchQuery,
    isInitialized,
  } = useExpenseStore();

  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ExpenseTransaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<ExpenseTransaction | null>(null);

  // Load transactions
  useEffect(() => {
    async function loadTransactions() {
      if (!isInitialized) return;

      setIsLoading(true);
      try {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;

        const txns = await db.expenseTransactions
          .where('date')
          .between(startDate, endDate, true, true)
          .filter((t) => !t.deletedAt)
          .toArray();

        // Sort by date descending
        txns.sort((a, b) => b.date.localeCompare(a.date));
        setTransactions(txns);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTransactions();
  }, [selectedMonth, selectedYear, isInitialized]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Category filter
    if (filterCategoryId !== null) {
      filtered = filtered.filter((t) => t.categoryId === filterCategoryId);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description?.toLowerCase().includes(query) ||
          categories.find((c) => c.id === t.categoryId)?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [transactions, typeFilter, filterCategoryId, searchQuery, categories]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, ExpenseTransaction[]> = {};
    for (const txn of filteredTransactions) {
      if (!groups[txn.date]) {
        groups[txn.date] = [];
      }
      groups[txn.date].push(txn);
    }
    return groups;
  }, [filteredTransactions]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return t('today');
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return t('yesterday');
    }

    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const getCategoryById = (id: number) => categories.find((c) => c.id === id);

  const handleDelete = async (transaction: ExpenseTransaction) => {
    if (!transaction.id) return;

    try {
      await db.expenseTransactions.update(transaction.id, {
        deletedAt: new Date(),
        updatedAt: new Date(),
      });
      setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleEdit = (transaction: ExpenseTransaction) => {
    setEditTransaction(transaction);
  };

  const handleEditSave = (updated: ExpenseTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setEditTransaction(null);
  };

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ] as const;

  const hasActiveFilters = typeFilter !== 'all' || filterCategoryId !== null || searchQuery.trim();

  return (
    <div className="space-y-4">
      {/* Header with month */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('title')} - {tMonths(monthNames[selectedMonth - 1])} {selectedYear}
        </h1>
        <Button
          variant={showFilters ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<Filter className="h-4 w-4" />}
        >
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-500 absolute top-1 right-1" />
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search')}
          className="pl-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card padding="sm">
          <CardContent className="space-y-4">
            {/* Type Filter */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">{t('type')}</p>
              <div className="flex gap-2">
                {(['all', 'expense', 'income'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      typeFilter === type
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    {t(type === 'all' ? 'all' : type === 'expense' ? 'expenses' : 'income')}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">{t('category')}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategoryId(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterCategoryId === null
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {t('all')}
                </button>
                {categories
                  .filter((c) => typeFilter === 'all' || c.type === typeFilter || c.type === 'both')
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategoryId(cat.id ?? null)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterCategoryId === cat.id
                          ? 'text-white'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      )}
                      style={
                        filterCategoryId === cat.id
                          ? { backgroundColor: cat.color }
                          : undefined
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setFilterCategoryId(null);
                  setSearchQuery('');
                }}
              >
                {t('clearFilters')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <div className="py-12 text-center text-neutral-500">{t('loading')}</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">{t('noResults')}</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txns]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-neutral-500 mb-2">
                {formatDateHeader(date)}
              </h3>
              <Card padding="none">
                <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {txns.map((txn) => (
                    <TransactionItem
                      key={txn.id}
                      transaction={txn}
                      category={txn.categoryId ? getCategoryById(txn.categoryId) : undefined}
                      locale={locale}
                      currency={baseCurrency}
                      onEdit={handleEdit}
                      onDelete={(t) => setDeleteConfirm(t)}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTransaction && (
        <EditTransactionModal
          transaction={editTransaction}
          categories={categories}
          locale={locale}
          onClose={() => setEditTransaction(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Modal */}
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
