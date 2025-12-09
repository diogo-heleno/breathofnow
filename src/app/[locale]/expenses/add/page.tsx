'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useExpenseStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/expense-store';
import { addExpenseTransaction } from '@/lib/db';
import type { ExpenseCategory } from '@/lib/db';

// Dynamic icon component (simplified - uses first letter as fallback)
function CategoryIcon({ category }: { category: ExpenseCategory }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
      style={{ backgroundColor: category.color }}
    >
      {category.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function QuickAddPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow');
  const tCategories = useTranslations('expenseFlow.categories.default');
  const router = useRouter();

  const { quickAddType, setQuickAddType, categories, baseCurrency } = useExpenseStore();

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter categories based on type
  const filteredCategories = categories.filter(
    (c) => c.type === quickAddType || c.type === 'both'
  );

  const getCategoryDisplayName = (category: ExpenseCategory) => {
    if (category.nameKey) {
      return tCategories(category.nameKey);
    }
    return category.name;
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal separator
    const cleaned = value.replace(/[^0-9.,]/g, '');
    // Replace comma with period for consistency
    const normalized = cleaned.replace(',', '.');
    // Prevent multiple decimal points
    const parts = normalized.split('.');
    if (parts.length > 2) return;
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return;
    setAmount(normalized);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSaving(true);
    try {
      await addExpenseTransaction({
        amount: parseFloat(amount),
        currency: baseCurrency,
        type: quickAddType,
        categoryId: selectedCategory?.id,
        description: description || undefined,
        date,
      });

      setShowSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        setSelectedCategory(null);
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        // Navigate back to dashboard
        router.push(`/${locale}/expenses`);
      }, 1000);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrencySymbol = () => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: baseCurrency,
    })
      .format(0)
      .replace(/[\d.,\s]/g, '')
      .trim();
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          {t('quickAdd.saved')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Type Toggle */}
      <Card padding="sm">
        <CardContent>
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
            <button
              onClick={() => setQuickAddType('expense')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                quickAddType === 'expense'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              {t('quickAdd.expense')}
            </button>
            <button
              onClick={() => setQuickAddType('income')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                quickAddType === 'income'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              {t('quickAdd.income')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <Card>
        <CardContent className="pt-6">
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            {t('quickAdd.amount')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-neutral-400">
              {formatCurrencySymbol()}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={t('quickAdd.amountPlaceholder')}
              className={cn(
                'w-full pl-12 pr-4 py-4 text-3xl font-semibold text-center',
                'bg-transparent border-2 rounded-xl',
                'focus:outline-none focus:ring-0',
                quickAddType === 'expense'
                  ? 'border-red-200 dark:border-red-800 focus:border-red-500 text-red-600 dark:text-red-400'
                  : 'border-green-200 dark:border-green-800 focus:border-green-500 text-green-600 dark:text-green-400'
              )}
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card>
        <CardContent className="pt-6">
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
            {t('quickAdd.category')}
          </label>
          <div className="grid grid-cols-4 gap-3">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                  selectedCategory?.id === category.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                <CategoryIcon category={category} />
                <span className="text-xs text-center text-neutral-700 dark:text-neutral-300 line-clamp-1">
                  {getCategoryDisplayName(category)}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optional Fields */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t('quickAdd.description')}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('quickAdd.descriptionPlaceholder')}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t('quickAdd.date')}
            </label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!amount || parseFloat(amount) <= 0 || isSaving}
        isLoading={isSaving}
        className={cn(
          'w-full',
          quickAddType === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
        )}
        size="lg"
      >
        {t('quickAdd.save')}
      </Button>
    </div>
  );
}
