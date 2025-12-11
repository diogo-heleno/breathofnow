'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCIES, getCurrencyInfo, type CurrencyCode } from '@/services/currency-service';
import { useTranslations } from 'next-intl';

interface CurrencySelectProps {
  value: string;
  onChange: (currency: string) => void;
  favorites?: string[];
  className?: string;
}

export function CurrencySelect({
  value,
  onChange,
  favorites = ['EUR', 'USD', 'GBP', 'BRL'],
  className,
}: CurrencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('expenseFlow.currency');
  const tCommon = useTranslations('common');

  const currencies = Object.entries(CURRENCIES);
  const currentCurrency = getCurrencyInfo(value);

  // Filter currencies based on search
  const filteredCurrencies = currencies.filter(([code, info]) => {
    const searchLower = search.toLowerCase();
    return (
      code.toLowerCase().includes(searchLower) ||
      info.name.toLowerCase().includes(searchLower)
    );
  });

  // Separate favorites and others
  const favoriteCurrencies = filteredCurrencies.filter(([code]) =>
    favorites.includes(code)
  );
  const otherCurrencies = filteredCurrencies.filter(
    ([code]) => !favorites.includes(code)
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border',
          'bg-white dark:bg-neutral-800',
          'border-neutral-200 dark:border-neutral-700',
          'hover:border-primary-300 dark:hover:border-primary-600',
          'transition-colors'
        )}
      >
        <span className="text-lg">{currentCurrency.flag}</span>
        <span className="font-medium">{value}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-64',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-700',
            'rounded-xl shadow-lg',
            'max-h-80 overflow-hidden'
          )}
        >
          {/* Search */}
          <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className={cn(
                  'w-full pl-9 pr-3 py-2 text-sm',
                  'bg-neutral-50 dark:bg-neutral-800',
                  'border border-neutral-200 dark:border-neutral-700',
                  'rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
              />
            </div>
          </div>

          {/* Currency List */}
          <div className="overflow-y-auto max-h-60">
            {/* Favorites */}
            {favoriteCurrencies.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 bg-neutral-50 dark:bg-neutral-800">
                  {tCommon('favorites')}
                </div>
                {favoriteCurrencies.map(([code, info]) => (
                  <CurrencyOption
                    key={code}
                    code={code}
                    info={info}
                    isSelected={code === value}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* Other Currencies */}
            {otherCurrencies.length > 0 && (
              <div>
                {favoriteCurrencies.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 bg-neutral-50 dark:bg-neutral-800">
                    {t('allCurrencies')}
                  </div>
                )}
                {otherCurrencies.map(([code, info]) => (
                  <CurrencyOption
                    key={code}
                    code={code}
                    info={info}
                    isSelected={code === value}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredCurrencies.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-neutral-500">
                {t('noResults')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CurrencyOptionProps {
  code: string;
  info: { symbol: string; name: string; flag: string };
  isSelected: boolean;
  onSelect: (code: string) => void;
}

function CurrencyOption({ code, info, isSelected, onSelect }: CurrencyOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(code)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'transition-colors',
        isSelected && 'bg-primary-50 dark:bg-primary-900/20'
      )}
    >
      <span className="text-lg">{info.flag}</span>
      <div className="flex-1 text-left">
        <span className="font-medium">{code}</span>
        <span className="text-sm text-neutral-500 ml-2">{info.name}</span>
      </div>
      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
    </button>
  );
}
