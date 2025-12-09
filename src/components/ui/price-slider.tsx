'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface PriceSliderProps {
  suggestedPrice: number;
  currency: string;
  currencySymbol: string;
  locale: string;
  onChange: (price: number) => void;
  minLabel?: string;
  suggestedLabel?: string;
  maxLabel?: string;
  customLabel?: string;
}

export function PriceSlider({
  suggestedPrice,
  currency,
  currencySymbol,
  locale,
  onChange,
  minLabel = 'Minimum',
  suggestedLabel = 'Suggested',
  maxLabel = 'Pay what you want',
  customLabel = 'Your price',
}: PriceSliderProps) {
  const minPrice = Math.round(suggestedPrice * 0.5);
  const maxPrice = Math.round(suggestedPrice * 1.5);

  const [sliderValue, setSliderValue] = useState(suggestedPrice);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, [locale, currency]);

  useEffect(() => {
    if (!isCustomMode) {
      onChange(sliderValue);
    }
  }, [sliderValue, isCustomMode, onChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);

    if (value >= maxPrice) {
      setIsCustomMode(true);
      setCustomValue(value.toString());
    } else {
      setIsCustomMode(false);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue);
    }
  };

  const handleCustomBlur = () => {
    const numValue = parseInt(customValue);
    if (isNaN(numValue) || numValue < maxPrice) {
      setIsCustomMode(false);
      setSliderValue(suggestedPrice);
      onChange(suggestedPrice);
    }
  };

  // Calculate slider position percentage for styling
  const percentage = ((sliderValue - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="space-y-4">
      {/* Price Display */}
      <div className="text-center">
        {isCustomMode ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg text-neutral-500">{currencySymbol}</span>
            <Input
              type="number"
              min={maxPrice}
              value={customValue}
              onChange={handleCustomChange}
              onBlur={handleCustomBlur}
              className="w-28 text-center text-3xl font-display font-bold"
              autoFocus
            />
          </div>
        ) : (
          <span className="text-4xl font-display font-bold text-neutral-900 dark:text-neutral-100">
            {formatPrice(sliderValue)}
          </span>
        )}
      </div>

      {/* Slider */}
      <div className="relative pt-2 pb-6">
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={sliderValue}
          onChange={handleSliderChange}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "bg-gradient-to-r from-neutral-200 via-primary-500 to-accent-500",
            "dark:from-neutral-700 dark:via-primary-600 dark:to-accent-600",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-6",
            "[&::-webkit-slider-thumb]:h-6",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-white",
            "[&::-webkit-slider-thumb]:border-2",
            "[&::-webkit-slider-thumb]:border-primary-500",
            "[&::-webkit-slider-thumb]:shadow-lg",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:w-6",
            "[&::-moz-range-thumb]:h-6",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-white",
            "[&::-moz-range-thumb]:border-2",
            "[&::-moz-range-thumb]:border-primary-500",
            "[&::-moz-range-thumb]:shadow-lg",
            "[&::-moz-range-thumb]:cursor-pointer"
          )}
        />

        {/* Labels */}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-xs text-neutral-500">
          <span>{formatPrice(minPrice)}</span>
          <span className="absolute left-1/2 -translate-x-1/2 text-primary-600 font-medium">
            {suggestedLabel}: {formatPrice(suggestedPrice)}
          </span>
          <span>{maxLabel}</span>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-center text-neutral-500">
        {sliderValue < suggestedPrice
          ? minLabel
          : sliderValue >= maxPrice
            ? customLabel
            : suggestedLabel}
      </p>
    </div>
  );
}
