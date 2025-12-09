'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { db, addExpenseTransaction } from '@/lib/db';
import type { ExpenseCategory } from '@/lib/db';

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  category?: string;
}

interface MappedTransaction {
  date: string;
  amount: number;
  description: string;
  category?: string;
  type: 'income' | 'expense';
  isValid: boolean;
  error?: string;
}

const DEFAULT_MAPPING: ColumnMapping = {
  date: '',
  amount: '',
  description: '',
  category: '',
};

export default function ImportPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow.import');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const { categories, baseCurrency } = useExpenseStore();

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING);
  const [negativeIsExpense, setNegativeIsExpense] = useState(true);
  const [dateFormat, setDateFormat] = useState('auto');
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = (file: File) => {
    setFile(file);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setRawData(results.data as ParsedRow[]);
          setColumns(results.meta.fields || []);
          autoDetectMapping(results.meta.fields || []);
          setStep('mapping');
        },
        error: (error) => {
          setErrors([error.message]);
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
            header: 1,
            raw: false,
          });

          if (jsonData.length > 0) {
            const headers = Object.values(jsonData[0] as Record<string, string>);
            const rows = jsonData.slice(1).map((row) => {
              const obj: ParsedRow = {};
              const rowValues = Object.values(row as Record<string, string>);
              headers.forEach((header, index) => {
                obj[header] = rowValues[index] || '';
              });
              return obj;
            });

            setRawData(rows);
            setColumns(headers);
            autoDetectMapping(headers);
            setStep('mapping');
          }
        } catch (error) {
          setErrors(['Failed to parse Excel file']);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrors(['Unsupported file format. Please use CSV or Excel (.xlsx, .xls)']);
    }
  };

  const autoDetectMapping = (cols: string[]) => {
    const lowerCols = cols.map((c) => c.toLowerCase());
    const newMapping: ColumnMapping = { ...DEFAULT_MAPPING };

    // Date detection
    const datePatterns = ['date', 'data', 'fecha', 'datum', 'transaction date', 'posting date'];
    const dateCol = cols.find((c) => datePatterns.some((p) => c.toLowerCase().includes(p)));
    if (dateCol) newMapping.date = dateCol;

    // Amount detection
    const amountPatterns = ['amount', 'value', 'valor', 'importe', 'montant', 'betrag', 'debit', 'credit'];
    const amountCol = cols.find((c) => amountPatterns.some((p) => c.toLowerCase().includes(p)));
    if (amountCol) newMapping.amount = amountCol;

    // Description detection
    const descPatterns = ['description', 'descricao', 'descripcion', 'memo', 'reference', 'details', 'narrative'];
    const descCol = cols.find((c) => descPatterns.some((p) => c.toLowerCase().includes(p)));
    if (descCol) newMapping.description = descCol;

    // Category detection
    const catPatterns = ['category', 'categoria', 'categorie', 'type'];
    const catCol = cols.find((c) => catPatterns.some((p) => c.toLowerCase().includes(p)));
    if (catCol) newMapping.category = catCol;

    setMapping(newMapping);
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return '';

    // Try various date formats
    const formats = [
      // ISO format
      /^(\d{4})-(\d{2})-(\d{2})/,
      // DD/MM/YYYY
      /^(\d{2})\/(\d{2})\/(\d{4})/,
      // MM/DD/YYYY
      /^(\d{2})\/(\d{2})\/(\d{4})/,
      // DD-MM-YYYY
      /^(\d{2})-(\d{2})-(\d{4})/,
    ];

    // Try ISO first
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    const ddmmMatch = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (ddmmMatch) {
      // Assuming DD/MM/YYYY format
      return `${ddmmMatch[3]}-${ddmmMatch[2]}-${ddmmMatch[1]}`;
    }

    // Fallback: try native Date parsing
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return '';
  };

  const parseAmount = (amountStr: string): number => {
    if (!amountStr) return 0;

    // Remove currency symbols and whitespace
    let cleaned = amountStr.replace(/[€$£¥R\$\s]/g, '');

    // Handle European format (1.234,56) vs US format (1,234.56)
    const hasCommaDecimal = cleaned.match(/,\d{2}$/);
    if (hasCommaDecimal) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }

    return parseFloat(cleaned) || 0;
  };

  const mappedTransactions = useMemo((): MappedTransaction[] => {
    if (!mapping.date || !mapping.amount) return [];

    return rawData.map((row) => {
      const dateStr = parseDate(row[mapping.date] || '');
      const amount = parseAmount(row[mapping.amount] || '');
      const description = row[mapping.description] || '';
      const category = mapping.category ? row[mapping.category] : undefined;

      let type: 'income' | 'expense';
      let finalAmount = Math.abs(amount);

      if (negativeIsExpense) {
        type = amount < 0 ? 'expense' : 'income';
      } else {
        type = amount > 0 ? 'expense' : 'income';
      }

      const isValid = !!dateStr && finalAmount > 0;
      const error = !dateStr ? 'Invalid date' : finalAmount === 0 ? 'Invalid amount' : undefined;

      return {
        date: dateStr,
        amount: finalAmount,
        description,
        category,
        type,
        isValid,
        error,
      };
    });
  }, [rawData, mapping, negativeIsExpense]);

  const validTransactions = mappedTransactions.filter((t) => t.isValid);
  const invalidTransactions = mappedTransactions.filter((t) => !t.isValid);

  const findCategoryId = (categoryName: string | undefined): number | undefined => {
    if (!categoryName) return undefined;

    const lowerName = categoryName.toLowerCase();
    const found = categories.find(
      (c) =>
        c.name.toLowerCase() === lowerName ||
        c.nameKey?.toLowerCase() === lowerName
    );
    return found?.id;
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);
    const importErrors: string[] = [];

    const batchId = `import_${Date.now()}`;

    for (let i = 0; i < validTransactions.length; i++) {
      const tx = validTransactions[i];
      try {
        await addExpenseTransaction({
          amount: tx.amount,
          currency: baseCurrency,
          type: tx.type,
          description: tx.description || undefined,
          date: tx.date,
          categoryId: findCategoryId(tx.category),
          importBatchId: batchId,
        });
        setImportedCount((prev) => prev + 1);
      } catch (error) {
        importErrors.push(`Row ${i + 1}: ${error}`);
      }
      setImportProgress(Math.round(((i + 1) / validTransactions.length) * 100));
    }

    setErrors(importErrors);
    setStep('done');
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setColumns([]);
    setMapping(DEFAULT_MAPPING);
    setImportProgress(0);
    setImportedCount(0);
    setErrors([]);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        {t('title')}
      </h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {(['upload', 'mapping', 'preview', 'done'] as const).map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step === s || (step === 'importing' && s === 'preview')
                  ? 'bg-primary-500 text-white'
                  : step === 'done' || idx < ['upload', 'mapping', 'preview', 'done'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
              )}
            >
              {idx < ['upload', 'mapping', 'preview', 'done'].indexOf(step) || step === 'done' ? (
                <Check className="w-4 h-4" />
              ) : (
                idx + 1
              )}
            </div>
            {idx < 3 && (
              <div
                className={cn(
                  'w-12 h-1 mx-1',
                  idx < ['upload', 'mapping', 'preview', 'done'].indexOf(step)
                    ? 'bg-green-500'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card>
          <CardContent className="pt-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
                'border-neutral-300 dark:border-neutral-700',
                'hover:border-primary-400 dark:hover:border-primary-600'
              )}
            >
              <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t('dragDrop')}
              </p>
              <p className="text-sm text-neutral-500 mb-4">{t('supported')}</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className={cn(
                  'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg',
                  'bg-neutral-100 dark:bg-neutral-800',
                  'text-neutral-700 dark:text-neutral-300',
                  'hover:bg-neutral-200 dark:hover:bg-neutral-700',
                  'cursor-pointer transition-colors'
                )}
              >
                Select File
              </label>
            </div>

            {errors.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    {errors.map((error, i) => (
                      <p key={i} className="text-sm">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              {t('mapping')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {file && (
              <p className="text-sm text-neutral-500">
                File: {file.name} ({rawData.length} rows)
              </p>
            )}

            <div className="space-y-3">
              <MappingSelect
                label="Date Column *"
                value={mapping.date}
                onChange={(v) => setMapping({ ...mapping, date: v })}
                options={columns}
              />
              <MappingSelect
                label="Amount Column *"
                value={mapping.amount}
                onChange={(v) => setMapping({ ...mapping, amount: v })}
                options={columns}
              />
              <MappingSelect
                label="Description Column"
                value={mapping.description}
                onChange={(v) => setMapping({ ...mapping, description: v })}
                options={columns}
                optional
              />
              <MappingSelect
                label="Category Column"
                value={mapping.category || ''}
                onChange={(v) => setMapping({ ...mapping, category: v })}
                options={columns}
                optional
              />
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={negativeIsExpense}
                  onChange={(e) => setNegativeIsExpense(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Negative amounts are expenses
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={handleReset} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!mapping.date || !mapping.amount}
                className="flex-1"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('preview')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('preview')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>{validTransactions.length} valid</span>
              </div>
              {invalidTransactions.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>{invalidTransactions.length} invalid (will be skipped)</span>
                </div>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {mappedTransactions.slice(0, 50).map((tx, i) => (
                    <tr
                      key={i}
                      className={cn(!tx.isValid && 'bg-red-50 dark:bg-red-900/10 text-red-600')}
                    >
                      <td className="px-3 py-2">{tx.date || '-'}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{tx.description || '-'}</td>
                      <td className={cn('px-3 py-2 text-right font-medium', tx.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                        {tx.type === 'expense' ? '-' : '+'}
                        {tx.amount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs',
                            tx.type === 'income'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          )}
                        >
                          {tx.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mappedTransactions.length > 50 && (
                <div className="px-3 py-2 text-center text-sm text-neutral-500 bg-neutral-50 dark:bg-neutral-800">
                  ... and {mappedTransactions.length - 50} more rows
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setStep('mapping')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validTransactions.length === 0}
                className="flex-1"
                rightIcon={<Check className="w-4 h-4" />}
              >
                Import {validTransactions.length} transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-primary-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t('importing')}
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              {importedCount} of {validTransactions.length} imported
            </p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t('success', { count: importedCount })}
            </p>
            {errors.length > 0 && (
              <p className="text-sm text-amber-600 mb-4">
                {errors.length} errors occurred
              </p>
            )}
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="ghost" onClick={handleReset}>
                Import More
              </Button>
              <Button onClick={() => router.push(`/${locale}/expenses`)}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MappingSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optional?: boolean;
}

function MappingSelect({ label, value, onChange, options, optional }: MappingSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full px-3 py-2 rounded-lg border',
          'bg-white dark:bg-neutral-800',
          'border-neutral-200 dark:border-neutral-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500'
        )}
      >
        <option value="">{optional ? '-- None --' : '-- Select --'}</option>
        {options.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>
    </div>
  );
}
