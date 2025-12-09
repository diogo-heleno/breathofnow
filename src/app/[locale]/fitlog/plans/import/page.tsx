// FitLog Import Plan Page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, CheckCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { JsonImporter } from '@/components/fitlog/plans';

interface ImportPageProps {
  params: { locale: string };
}

const EXAMPLE_PROMPT = `Cria um plano de treino de musculação personalizado para mim com as seguintes características:

- Objetivo: [hipertrofia/força/perda de peso/resistência]
- Frequência: [X] dias por semana
- Duração por sessão: [X] minutos
- Nível: [iniciante/intermédio/avançado]
- Equipamento disponível: [ginásio completo/casa com halteres/etc.]
- Limitações: [lesões ou restrições, se houver]

Por favor, gera o plano no seguinte formato JSON exato:

\`\`\`json
{
  "planName": "Nome do Plano",
  "version": "1.0",
  "athlete": {
    "name": "O meu nome",
    "goal": "Objetivo principal",
    "frequency": "Xz semana",
    "sessionDuration": 45
  },
  "weeks": 8,
  "workouts": [
    {
      "id": "workout-a",
      "name": "Treino A - Peito e Tríceps",
      "dayOfWeek": 1,
      "targetDuration": 45,
      "warmup": {
        "description": "5 min cardio leve + mobilidade articular",
        "duration": 5
      },
      "exercises": [
        {
          "id": "ex-1",
          "name": "Supino Plano com Barra",
          "muscleGroups": ["chest", "triceps", "shoulders"],
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Manter os ombros para trás e o peito alto",
          "videoUrl": "https://youtube.com/watch?v=exemplo",
          "equipmentNeeded": "Barra e banco"
        }
      ],
      "cardio": {
        "description": "10 min passadeira inclinada",
        "duration": 10,
        "alternatives": ["bicicleta", "elíptica"]
      }
    }
  ]
}
\`\`\`

IMPORTANTE:
- dayOfWeek: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
- muscleGroups aceites: chest, back, shoulders, biceps, triceps, forearms, core, abs, quadriceps, hamstrings, glutes, calves, hip_flexors, adductors, abductors
- Inclui links de YouTube reais para demonstração de cada exercício
- reps pode ser número (12) ou range ("8-10")
- Gera um plano completo com todos os dias de treino`;

const EXAMPLE_JSON = `{
  "planName": "Plano Hipertrofia 4x",
  "version": "1.0",
  "athlete": {
    "name": "Atleta",
    "goal": "Ganho de massa muscular",
    "frequency": "4x semana",
    "sessionDuration": 50
  },
  "weeks": 8,
  "workouts": [
    {
      "id": "workout-a",
      "name": "Treino A - Peito e Tríceps",
      "dayOfWeek": 1,
      "targetDuration": 50,
      "warmup": {
        "description": "5 min cardio leve + rotações de ombros",
        "duration": 5
      },
      "exercises": [
        {
          "id": "chest-1",
          "name": "Supino Plano com Barra",
          "muscleGroups": ["chest", "triceps"],
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Descer a barra até ao peito, manter ombros retraídos",
          "videoUrl": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
          "equipmentNeeded": "Barra olímpica e banco"
        },
        {
          "id": "chest-2",
          "name": "Supino Inclinado com Halteres",
          "muscleGroups": ["chest", "shoulders"],
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 75,
          "notes": "Banco a 30-45 graus",
          "videoUrl": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
          "equipmentNeeded": "Halteres e banco inclinado"
        },
        {
          "id": "triceps-1",
          "name": "Extensão de Tríceps na Polia",
          "muscleGroups": ["triceps"],
          "sets": 3,
          "reps": "12-15",
          "restSeconds": 60,
          "notes": "Cotovelos junto ao corpo",
          "videoUrl": "https://www.youtube.com/watch?v=2-LAMcpzODU",
          "equipmentNeeded": "Polia alta com corda"
        }
      ]
    },
    {
      "id": "workout-b",
      "name": "Treino B - Costas e Bíceps",
      "dayOfWeek": 2,
      "targetDuration": 50,
      "warmup": {
        "description": "5 min remo leve + mobilidade",
        "duration": 5
      },
      "exercises": [
        {
          "id": "back-1",
          "name": "Puxada à Frente",
          "muscleGroups": ["back", "biceps"],
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Puxar até ao peito, apertar omoplatas",
          "videoUrl": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
          "equipmentNeeded": "Máquina de puxada"
        },
        {
          "id": "back-2",
          "name": "Remada Baixa",
          "muscleGroups": ["back"],
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 75,
          "notes": "Manter costas direitas",
          "videoUrl": "https://www.youtube.com/watch?v=GZbfZ033f74",
          "equipmentNeeded": "Polia baixa"
        },
        {
          "id": "biceps-1",
          "name": "Curl com Barra",
          "muscleGroups": ["biceps"],
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 60,
          "notes": "Não balançar o corpo",
          "videoUrl": "https://www.youtube.com/watch?v=kwG2ipFRgfo",
          "equipmentNeeded": "Barra reta ou EZ"
        }
      ]
    }
  ]
}`;

export default function ImportPage({ params }: ImportPageProps) {
  const { locale } = params;
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const copyToClipboard = async (text: string, type: 'prompt' | 'json') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'prompt') {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      } else {
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Importar Plano</h1>
        <p className="text-neutral-600">
          Cola o JSON do plano de treino gerado pelo ChatGPT ou Claude.
        </p>
      </div>

      {/* Example Prompt Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-neutral-900">Prompt para ChatGPT/Claude</p>
              <p className="text-sm text-neutral-500">Copia e cola no teu LLM favorito</p>
            </div>
          </div>
          {showPrompt ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </button>

        {showPrompt && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">Prompt de exemplo</p>
              <button
                onClick={() => copyToClipboard(EXAMPLE_PROMPT, 'prompt')}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {copiedPrompt ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar prompt
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-white rounded-lg border border-neutral-200 text-xs text-neutral-700 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
              {EXAMPLE_PROMPT}
            </pre>
          </div>
        )}
      </div>

      {/* Example JSON Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowExample(!showExample)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-neutral-900">Exemplo de JSON válido</p>
              <p className="text-sm text-neutral-500">Vê como deve ficar o resultado</p>
            </div>
          </div>
          {showExample ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </button>

        {showExample && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">JSON de exemplo (2 treinos)</p>
              <button
                onClick={() => copyToClipboard(EXAMPLE_JSON, 'json')}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {copiedJson ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar JSON
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-white rounded-lg border border-neutral-200 text-xs text-neutral-700 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto font-mono">
              {EXAMPLE_JSON}
            </pre>
          </div>
        )}
      </div>

      {/* Importer */}
      <JsonImporter
        locale={locale}
        onSuccess={(planId) => {
          router.push(`/${locale}/fitlog`);
        }}
      />
    </div>
  );
}
