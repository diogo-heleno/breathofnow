'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExpensePieChart } from '@/components/expenses/expense-pie-chart';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { getMonthlyExpenseSummary } from '@/lib/db';

interface MonthData {
  month: number;
  year: number;
  expenses: number;
  income: number;
}

export default function ReportsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow.reports');
  const tMonths = useTranslations('expenseFlow.months');

  const { categories, baseCurrency, isInitialized } = useExpenseStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [categoryData, setCategoryData] = useState<Record<number, number>>({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ] as const;

  // Load yearly data
  useEffect(() => {
    async function loadData() {
      if (!isInitialized) return;

      setIsLoading(true);
      try {
        const monthsData: MonthData[] = [];
        const aggregatedCategories: Record<number, number> = {};
        let yearTotal = 0;

        for (let month = 1; month <= 12; month++) {
          const summary = await getMonthlyExpenseSummary(selectedYear, month);
          monthsData.push({
            month,
            year: selectedYear,
            expenses: summary.totalExpenses,
            income: summary.totalIncome,
          });
          yearTotal += summary.totalExpenses;

          // Aggregate category data
          for (const [catId, amount] of Object.entries(summary.byCategory)) {
            const id = Number(catId);
            aggregatedCategories[id] = (aggregatedCategories[id] || 0) + amount;
          }
        }

        setMonthlyData(monthsData);
        setCategoryData(aggregatedCategories);
        setTotalExpenses(yearTotal);
      } catch (error) {
        console.error('Failed to load reports data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedYear, isInitialized]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxMonthValue = useMemo(() => {
    return Math.max(...monthlyData.map((d) => Math.max(d.expenses, d.income)), 1);
  }, [monthlyData]);

  const chartData = useMemo(() => {
    return Object.entries(categoryData)
      .map(([catId, amount]) => {
        const category = categories.find((c) => c.id === Number(catId));
        if (!category) return null;
        return {
          id: Number(catId),
          name: category.name,
          amount,
          color: category.color,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [categoryData, categories]);

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedYear(selectedYear - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('title')} - {selectedYear}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedYear(selectedYear + 1)}
          disabled={selectedYear >= new Date().getFullYear()}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <>
          {/* Monthly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('byMonth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyData.map((data) => (
                  <div key={data.month} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {tMonths(monthNames[data.month - 1])}
                      </span>
                      <div className="flex gap-4">
                        <span className="text-red-500">
                          -{formatCurrency(data.expenses)}
                        </span>
                        <span className="text-green-500">
                          +{formatCurrency(data.income)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-4">
                      {/* Expense bar */}
                      <div
                        className="bg-red-400 dark:bg-red-500 rounded-l"
                        style={{
                          width: `${(data.expenses / maxMonthValue) * 50}%`,
                        }}
                      />
                      {/* Income bar */}
                      <div
                        className="bg-green-400 dark:bg-green-500 rounded-r"
                        style={{
                          width: `${(data.income / maxMonthValue) * 50}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-400" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Expenses
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-400" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Income
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('byCategory')} ({selectedYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ExpensePieChart
                  data={chartData}
                  total={totalExpenses}
                  locale={locale}
                  currency={baseCurrency}
                />
              ) : (
                <p className="text-center text-neutral-500 py-8">
                  No expense data for this year
                </p>
              )}
            </CardContent>
          </Card>

          {/* Year Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Total Expenses</p>
                  <p className="text-lg font-semibold text-red-500">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Total Income</p>
                  <p className="text-lg font-semibold text-green-500">
                    {formatCurrency(
                      monthlyData.reduce((sum, d) => sum + d.income, 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Balance</p>
                  <p
                    className={cn(
                      'text-lg font-semibold',
                      monthlyData.reduce((sum, d) => sum + d.income - d.expenses, 0) >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    )}
                  >
                    {formatCurrency(
                      monthlyData.reduce((sum, d) => sum + d.income - d.expenses, 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
