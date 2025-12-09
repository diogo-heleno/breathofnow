// FitLog Plans & Export Components

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileJson,
  Check,
  AlertCircle,
  AlertTriangle,
  Copy,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Download,
  Trash2,
} from 'lucide-react';
import { importPlan, validatePlanJson, generateInitialPrompt, generateAdjustmentPrompt, exportSessionsForLLM } from '@/lib/fitlog-helpers';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { useFitLogStore } from '@/stores/fitlog-store';
import type { WorkoutPlan, ExportData } from '@/types/fitlog';

// ============================================
// JSON IMPORTER
// ============================================

interface JsonImporterProps {
  locale: string;
  onSuccess?: (planId: number) => void;
}

export function JsonImporter({ locale, onSuccess }: JsonImporterProps) {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleValidate = useCallback(() => {
    setIsValidating(true);
    setValidationResult(null);
    setImportError(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const result = validatePlanJson(parsed);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: ['JSON inválido: verifique a sintaxe'],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  }, [jsonInput]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setImportError(null);

    const result = await importPlan(jsonInput);

    if (result.success && result.planId) {
      setImportSuccess(true);
      // Set as active plan
      await fitlogDb.setActivePlan(result.planId);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.planId!);
        } else {
          router.push(`/${locale}/fitlog`);
        }
      }, 1500);
    } else {
      setImportError(result.error || 'Erro ao importar plano');
    }

    setIsImporting(false);
  }, [jsonInput, locale, router, onSuccess]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      setValidationResult(null);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  }, []);

  if (importSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-scale-in">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Plano Importado!</h3>
        <p className="text-neutral-600">A redirecionar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
        <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <FileJson className="w-5 h-5 text-primary" />
          Como importar
        </h3>
        <ol className="text-sm text-neutral-600 space-y-1 list-decimal list-inside">
          <li>Usa um LLM (ChatGPT, Claude) para gerar o teu plano</li>
          <li>Copia o JSON gerado</li>
          <li>Cola aqui em baixo e valida</li>
          <li>Se estiver correto, importa!</li>
        </ol>
      </div>

      {/* JSON Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-neutral-700">
            JSON do Plano de Treino
          </label>
          <button
            onClick={handlePaste}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Colar
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value);
            setValidationResult(null);
            setImportError(null);
          }}
          placeholder='{"planName": "Meu Plano", "workouts": [...]}'
          rows={12}
          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div
          className={`p-4 rounded-xl ${
            validationResult.valid
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {validationResult.valid ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  validationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {validationResult.valid ? 'JSON válido!' : 'JSON inválido'}
              </p>

              {validationResult.errors.length > 0 && (
                <ul className="mt-2 text-sm text-red-700 space-y-1">
                  {validationResult.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Avisos:
                  </p>
                  <ul className="mt-1 text-sm text-amber-700 space-y-1">
                    {validationResult.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Error */}
      {importError && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {importError}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleValidate}
          disabled={!jsonInput.trim() || isValidating}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-neutral-300 rounded-xl font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Validar
        </button>
        <button
          onClick={handleImport}
          disabled={!validationResult?.valid || isImporting}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          Importar
        </button>
      </div>
    </div>
  );
}

// ============================================
// PROMPT GENERATOR
// ============================================

interface PromptGeneratorProps {
  type: 'initial' | 'adjustment';
}

export function PromptGenerator({ type }: PromptGeneratorProps) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [weeksToExport, setWeeksToExport] = useState(4);

  const generatePrompt = useCallback(async () => {
    setIsLoading(true);

    if (type === 'initial') {
      setPrompt(generateInitialPrompt());
    } else {
      // Get active plan and export data
      const activePlan = await fitlogDb.getActivePlan();
      if (!activePlan) {
        setPrompt('Erro: Nenhum plano ativo encontrado. Importa um plano primeiro.');
        setIsLoading(false);
        return;
      }

      const data = await exportSessionsForLLM(weeksToExport);
      if (!data) {
        setPrompt('Erro: Não foi possível exportar os dados.');
        setIsLoading(false);
        return;
      }

      setExportData(data);
      setPrompt(generateAdjustmentPrompt(data, activePlan.rawJson));
    }

    setIsLoading(false);
  }, [type, weeksToExport]);

  const copyToClipboard = useCallback(async () => {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [prompt]);

  return (
    <div className="space-y-6">
      {type === 'adjustment' && (
        <div className="p-4 bg-neutral-100 rounded-xl">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Semanas a incluir no histórico
          </label>
          <select
            value={weeksToExport}
            onChange={(e) => setWeeksToExport(parseInt(e.target.value, 10))}
            className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={2}>2 semanas</option>
            <option value={4}>4 semanas</option>
            <option value={6}>6 semanas</option>
            <option value={8}>8 semanas</option>
          </select>
        </div>
      )}

      <button
        onClick={generatePrompt}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {type === 'initial' ? 'Gerar Prompt Inicial' : 'Gerar Prompt de Ajuste'}
      </button>

      {prompt && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700">Prompt Gerado</p>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl max-h-96 overflow-y-auto">
            <pre className="text-sm text-neutral-800 whitespace-pre-wrap font-mono">
              {prompt}
            </pre>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Próximo passo:</strong> Cola este prompt no ChatGPT ou Claude, responde às perguntas,
              e depois copia o JSON gerado para importar aqui.
            </p>
          </div>
        </div>
      )}

      {exportData && (
        <div className="p-4 bg-neutral-100 rounded-xl">
          <h4 className="font-medium text-neutral-900 mb-2">Resumo do Export</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Sessões:</span>{' '}
              <span className="font-medium">{exportData.summary.totalSessions}</span>
            </div>
            <div>
              <span className="text-neutral-500">Duração total:</span>{' '}
              <span className="font-medium">{exportData.summary.totalDuration} min</span>
            </div>
            <div>
              <span className="text-neutral-500">Sensação média:</span>{' '}
              <span className="font-medium">{exportData.summary.avgFeeling}/5</span>
            </div>
            <div>
              <span className="text-neutral-500">Notas progressão:</span>{' '}
              <span className="font-medium">{exportData.progressionNotes.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PLAN CARD
// ============================================

interface PlanCardProps {
  plan: WorkoutPlan;
  onActivate: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function PlanCard({ plan, onActivate, onDelete, onClick }: PlanCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`p-4 bg-white rounded-xl border transition-all ${
        plan.isActive
          ? 'border-primary shadow-sm ring-1 ring-primary/20'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900">{plan.planName}</h3>
            {plan.isActive && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Ativo
              </span>
            )}
          </div>
          {plan.athleteGoal && (
            <p className="text-sm text-neutral-500 mt-1">{plan.athleteGoal}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
        <span>v{plan.version}</span>
        {plan.frequency && <span>{plan.frequency}</span>}
        <span>Importado {formatDate(plan.importedAt)}</span>
      </div>

      <div className="flex items-center gap-2">
        {!plan.isActive && (
          <button
            onClick={onActivate}
            className="flex-1 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
          >
            Ativar
          </button>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800 mb-3">
            Tens a certeza? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPORT OPTIONS
// ============================================

interface ExportOptionsProps {
  locale: string;
}

export function ExportOptions({ locale }: ExportOptionsProps) {
  const [activeTab, setActiveTab] = useState<'initial' | 'adjustment'>('adjustment');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-neutral-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('initial')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'initial'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Novo Plano
        </button>
        <button
          onClick={() => setActiveTab('adjustment')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'adjustment'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Ajustar Plano
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'initial' ? (
          <div className="space-y-4">
            <p className="text-neutral-600">
              Gera um prompt para criar um novo plano de treino personalizado com um LLM.
            </p>
            <PromptGenerator type="initial" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-neutral-600">
              Exporta o teu histórico de treinos e gera um prompt para ajustar o plano atual.
            </p>
            <PromptGenerator type="adjustment" />
          </div>
        )}
      </div>
    </div>
  );
}
