'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CategoryData {
  id: number;
  name: string;
  amount: number;
  color: string;
}

interface ExpensePieChartProps {
  data: CategoryData[];
  total: number;
  locale: string;
  currency: string;
  className?: string;
}

export function ExpensePieChart({
  data,
  total,
  locale,
  currency,
  className,
}: ExpensePieChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (amount: number) => {
    if (total === 0) return '0%';
    return `${Math.round((amount / total) * 100)}%`;
  };

  // Sort by amount descending
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.amount - a.amount);
  }, [data]);

  // Calculate pie chart segments
  const segments = useMemo(() => {
    if (total === 0) return [];

    let currentAngle = 0;
    return sortedData.map((item) => {
      const percentage = item.amount / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      return {
        ...item,
        percentage,
        startAngle,
        endAngle: currentAngle,
      };
    });
  }, [sortedData, total]);

  // Generate SVG arc path
  const getArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  if (data.length === 0 || total === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="w-32 h-32 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <span className="text-neutral-400 text-sm">No data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col md:flex-row items-center gap-6', className)}>
      {/* Pie Chart */}
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((segment, index) => (
            <path
              key={segment.id}
              d={getArcPath(segment.startAngle, segment.endAngle, 40)}
              fill={segment.color}
              className="transition-all duration-300 hover:opacity-80"
              style={{ transformOrigin: '50% 50%' }}
            />
          ))}
          {/* Center hole for donut effect */}
          <circle cx="50" cy="50" r="25" className="fill-white dark:fill-neutral-900" />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-neutral-500">Total</span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {sortedData.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate flex-1">
              {item.name}
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 shrink-0">
              {formatCurrency(item.amount)}
            </span>
            <span className="text-xs text-neutral-500 shrink-0 w-10 text-right">
              {formatPercent(item.amount)}
            </span>
          </div>
        ))}
        {sortedData.length > 5 && (
          <p className="text-xs text-neutral-500">
            +{sortedData.length - 5} more categories
          </p>
        )}
      </div>
    </div>
  );
}
