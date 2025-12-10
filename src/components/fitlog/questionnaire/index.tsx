// FitLog Workout Questionnaire - Generates AI Prompt

'use client';

import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Copy,
  CheckCircle,
  Sparkles,
  User,
  Target,
  Calendar,
  Clock,
  Dumbbell,
  AlertCircle,
  Heart,
  Zap,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface QuestionnaireData {
  // Personal Info
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  weight: string;
  height: string;
  
  // Experience
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
  trainingHistory: string;
  
  // Goals
  primaryGoal: string[];
  targetAreas: string[];
  
  // Availability
  daysPerWeek: number;
  availableDays: number[];
  minutesPerSession: number;
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible' | '';
  
  // Equipment & Location
  gymType: 'full_gym' | 'home_basic' | 'home_advanced' | 'outdoor' | '';
  availableEquipment: string[];
  
  // Limitations
  injuries: string;
  healthConditions: string[];
  exercisesToAvoid: string;
  
  // Preferences
  preferredExercises: string;
  dislikedExercises: string;
  cardioPreference: 'love' | 'tolerate' | 'hate' | '';
}

const initialData: QuestionnaireData = {
  name: '',
  age: '',
  gender: '',
  weight: '',
  height: '',
  experienceLevel: '',
  trainingHistory: '',
  primaryGoal: [],
  targetAreas: [],
  daysPerWeek: 3,
  availableDays: [],
  minutesPerSession: 45,
  preferredTime: '',
  gymType: '',
  availableEquipment: [],
  injuries: '',
  healthConditions: [],
  exercisesToAvoid: '',
  preferredExercises: '',
  dislikedExercises: '',
  cardioPreference: '',
};

// ============================================
// OPTIONS DATA
// ============================================

const GOALS = [
  { id: 'strength', label: 'Ganhar força', icon: '💪' },
  { id: 'muscle', label: 'Ganhar massa muscular', icon: '🏋️' },
  { id: 'fat_loss', label: 'Perder gordura', icon: '🔥' },
  { id: 'endurance', label: 'Melhorar resistência', icon: '🏃' },
  { id: 'flexibility', label: 'Melhorar flexibilidade', icon: '🧘' },
  { id: 'health', label: 'Saúde geral', icon: '❤️' },
  { id: 'sport', label: 'Melhorar para um desporto', icon: '⚽' },
  { id: 'tone', label: 'Tonificar o corpo', icon: '✨' },
];

const TARGET_AREAS = [
  { id: 'glutes', label: 'Glúteos', icon: '🍑' },
  { id: 'legs', label: 'Pernas', icon: '🦵' },
  { id: 'abs', label: 'Abdominais', icon: '🎯' },
  { id: 'back', label: 'Costas', icon: '🔙' },
  { id: 'chest', label: 'Peito', icon: '💪' },
  { id: 'arms', label: 'Braços', icon: '💪' },
  { id: 'shoulders', label: 'Ombros', icon: '🎯' },
  { id: 'full_body', label: 'Corpo inteiro', icon: '🏋️' },
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom', fullLabel: 'Domingo' },
  { id: 1, label: 'Seg', fullLabel: 'Segunda' },
  { id: 2, label: 'Ter', fullLabel: 'Terça' },
  { id: 3, label: 'Qua', fullLabel: 'Quarta' },
  { id: 4, label: 'Qui', fullLabel: 'Quinta' },
  { id: 5, label: 'Sex', fullLabel: 'Sexta' },
  { id: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

const GYM_TYPES = [
  { id: 'full_gym', label: 'Ginásio completo', description: 'Máquinas, pesos livres, cabos' },
  { id: 'home_basic', label: 'Casa - básico', description: 'Poucos halteres, tapete' },
  { id: 'home_advanced', label: 'Casa - equipado', description: 'Barra, banco, vários pesos' },
  { id: 'outdoor', label: 'Ao ar livre', description: 'Parque, calistenia' },
];

const EQUIPMENT = [
  { id: 'barbells', label: 'Barras' },
  { id: 'dumbbells', label: 'Halteres' },
  { id: 'kettlebells', label: 'Kettlebells' },
  { id: 'cables', label: 'Cabos/Polias' },
  { id: 'machines', label: 'Máquinas' },
  { id: 'bench', label: 'Banco' },
  { id: 'squat_rack', label: 'Rack de agachamento' },
  { id: 'pull_up_bar', label: 'Barra de pull-ups' },
  { id: 'resistance_bands', label: 'Elásticos' },
  { id: 'trx', label: 'TRX/Suspensão' },
  { id: 'cardio_machines', label: 'Máquinas cardio' },
  { id: 'bodyweight', label: 'Apenas peso corporal' },
];

const HEALTH_CONDITIONS = [
  { id: 'back_pain', label: 'Dores nas costas' },
  { id: 'knee_issues', label: 'Problemas nos joelhos' },
  { id: 'shoulder_issues', label: 'Problemas nos ombros' },
  { id: 'hypertension', label: 'Hipertensão' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'pregnancy', label: 'Gravidez/Pós-parto' },
  { id: 'heart_condition', label: 'Condição cardíaca' },
  { id: 'none', label: 'Nenhuma' },
];

// ============================================
// MAIN COMPONENT
// ============================================

interface WorkoutQuestionnaireProps {
  onComplete?: (prompt: string) => void;
}

export function WorkoutQuestionnaire({ onComplete }: WorkoutQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuestionnaireData>(initialData);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const steps = [
    { id: 'personal', title: 'Sobre Ti', icon: User },
    { id: 'goals', title: 'Objetivos', icon: Target },
    { id: 'schedule', title: 'Disponibilidade', icon: Calendar },
    { id: 'equipment', title: 'Equipamento', icon: Dumbbell },
    { id: 'health', title: 'Saúde', icon: Heart },
    { id: 'preferences', title: 'Preferências', icon: Zap },
  ];

  const updateData = (updates: Partial<QuestionnaireData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (field: keyof QuestionnaireData, item: string | number) => {
    setData((prev) => {
      const currentArray = prev[field] as (string | number)[];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return { ...prev, [field]: newArray };
    });
  };

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Personal
        return data.name && data.experienceLevel;
      case 1: // Goals
        return data.primaryGoal.length > 0;
      case 2: // Schedule
        return data.availableDays.length > 0 && data.availableDays.length >= data.daysPerWeek;
      case 3: // Equipment
        return data.gymType !== '';
      case 4: // Health
        return true; // Optional
      case 5: // Preferences
        return true; // Optional
      default:
        return true;
    }
  }, [currentStep, data]);

  const generatePrompt = (): string => {
    const goalLabels = data.primaryGoal.map(
      (g) => GOALS.find((goal) => goal.id === g)?.label
    ).filter(Boolean);
    
    const areaLabels = data.targetAreas.map(
      (a) => TARGET_AREAS.find((area) => area.id === a)?.label
    ).filter(Boolean);
    
    const dayLabels = data.availableDays
      .sort((a, b) => a - b)
      .map((d) => DAYS_OF_WEEK.find((day) => day.id === d)?.fullLabel)
      .filter(Boolean);
    
    const equipmentLabels = data.availableEquipment.map(
      (e) => EQUIPMENT.find((eq) => eq.id === e)?.label
    ).filter(Boolean);
    
    const healthLabels = data.healthConditions
      .filter((h) => h !== 'none')
      .map((h) => HEALTH_CONDITIONS.find((hc) => hc.id === h)?.label)
      .filter(Boolean);

    const gymLabel = GYM_TYPES.find((g) => g.id === data.gymType)?.label || data.gymType;

    return `# Pedido de Plano de Treino Personalizado

## Informação do Atleta

**Dados Pessoais:**
- Nome: ${data.name || 'Não especificado'}
${data.age ? `- Idade: ${data.age} anos` : ''}
${data.gender ? `- Género: ${data.gender === 'male' ? 'Masculino' : data.gender === 'female' ? 'Feminino' : 'Outro'}` : ''}
${data.weight ? `- Peso: ${data.weight} kg` : ''}
${data.height ? `- Altura: ${data.height} cm` : ''}

**Experiência:**
- Nível: ${data.experienceLevel === 'beginner' ? 'Iniciante' : data.experienceLevel === 'intermediate' ? 'Intermédio' : data.experienceLevel === 'advanced' ? 'Avançado' : 'Não especificado'}
${data.trainingHistory ? `- Histórico: ${data.trainingHistory}` : ''}

## Objetivos

**Objetivos Principais:**
${goalLabels.map((g) => `- ${g}`).join('\n')}

${areaLabels.length > 0 ? `**Zonas Prioritárias:**\n${areaLabels.map((a) => `- ${a}`).join('\n')}` : ''}

## Disponibilidade

- **Dias por semana:** ${data.daysPerWeek}
- **Dias disponíveis:** ${dayLabels.join(', ')}
- **Duração por sessão:** ${data.minutesPerSession} minutos
${data.preferredTime ? `- **Horário preferido:** ${data.preferredTime === 'morning' ? 'Manhã' : data.preferredTime === 'afternoon' ? 'Tarde' : data.preferredTime === 'evening' ? 'Noite' : 'Flexível'}` : ''}

## Equipamento e Local

- **Local de treino:** ${gymLabel}
${equipmentLabels.length > 0 ? `- **Equipamento disponível:** ${equipmentLabels.join(', ')}` : ''}

## Considerações de Saúde

${healthLabels.length > 0 ? `**Condições a considerar:**\n${healthLabels.map((h) => `- ${h}`).join('\n')}` : '- Sem condições especiais'}
${data.injuries ? `\n**Lesões/Limitações:** ${data.injuries}` : ''}
${data.exercisesToAvoid ? `\n**Exercícios a evitar:** ${data.exercisesToAvoid}` : ''}

## Preferências

${data.preferredExercises ? `**Exercícios favoritos:** ${data.preferredExercises}` : ''}
${data.dislikedExercises ? `**Exercícios que não gosta:** ${data.dislikedExercises}` : ''}
${data.cardioPreference ? `**Relação com cardio:** ${data.cardioPreference === 'love' ? 'Gosta muito' : data.cardioPreference === 'tolerate' ? 'Tolera' : 'Não gosta'}` : ''}

---

## Instruções para Gerar o Plano

Por favor, cria um plano de treino completo baseado nas informações acima. O plano deve:

1. Ter ${data.daysPerWeek} treinos por semana nos dias: ${dayLabels.join(', ')}
2. Cada sessão deve durar aproximadamente ${data.minutesPerSession} minutos
3. Incluir aquecimento e cardio final quando apropriado
4. Ter exercícios adequados ao nível de experiência (${data.experienceLevel === 'beginner' ? 'iniciante' : data.experienceLevel === 'intermediate' ? 'intermédio' : 'avançado'})
5. Focar nos objetivos: ${goalLabels.join(', ')}
${healthLabels.length > 0 ? `6. Evitar exercícios que possam agravar: ${healthLabels.join(', ')}` : ''}

**IMPORTANTE: Gera o plano no seguinte formato JSON:**

\`\`\`json
{
  "planName": "Nome descritivo do plano",
  "version": "1.0",
  "createdAt": "${new Date().toISOString().split('T')[0]}",
  "athlete": {
    "name": "${data.name}",
    "goal": "${goalLabels.join(' + ')}",
    "frequency": "${data.daysPerWeek}x semana",
    "sessionDuration": ${data.minutesPerSession}
  },
  "weeks": 8,
  "workouts": [
    {
      "id": "workout-a",
      "name": "Treino A - Nome Descritivo",
      "dayOfWeek": ${data.availableDays[0] || 1},
      "targetDuration": ${data.minutesPerSession},
      "warmup": {
        "description": "Descrição do aquecimento",
        "duration": 5
      },
      "exercises": [
        {
          "id": "ex-1",
          "name": "Nome do Exercício",
          "muscleGroups": ["grupo1", "grupo2"],
          "sets": 4,
          "reps": 12,
          "restSeconds": 90,
          "notes": "Dicas de execução importantes",
          "videoUrl": "https://youtube.com/watch?v=VIDEO_ID",
          "equipmentNeeded": "Equipamento necessário"
        }
      ],
      "cardio": {
        "description": "Descrição do cardio final",
        "duration": 10,
        "alternatives": ["alternativa 1", "alternativa 2"]
      }
    }
  ]
}
\`\`\`

**Notas sobre o formato JSON:**
- \`dayOfWeek\`: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
- \`muscleGroups\`: usar valores como "chest", "back", "shoulders", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "calves", "core", "abs"
- \`reps\`: pode ser número (12) ou string para exercícios especiais ("30-45 seg", "12 cada lado")
- \`videoUrl\`: incluir links reais do YouTube para demonstração de cada exercício
- Incluir 4-8 exercícios por treino dependendo da duração

Por favor gera o plano completo em JSON válido, pronto para importar na app FitLog.`;
  };

  const handleGenerate = () => {
    setShowPrompt(true);
  };

  const handleCopy = async () => {
    const prompt = generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onComplete?.(prompt);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (showPrompt) {
      setShowPrompt(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ============================================
  // RENDER PROMPT VIEW
  // ============================================

  if (showPrompt) {
    const prompt = generatePrompt();
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao questionário
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Prompt
              </>
            )}
          </button>
        </div>

        {/* Success message */}
        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">Prompt gerado com sucesso!</h3>
              <p className="text-sm text-green-700 mt-1">
                Copia o prompt abaixo e cola no ChatGPT ou Claude. Depois de gerar o plano, 
                copia o JSON e importa na página "Importar Plano".
              </p>
            </div>
          </div>
        </div>

        {/* Prompt display */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden">
          <div className="p-3 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Prompt para o LLM</span>
            <span className="text-xs text-neutral-500">{prompt.length} caracteres</span>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-sm text-neutral-800 whitespace-pre-wrap font-mono leading-relaxed">
              {prompt}
            </pre>
          </div>
        </div>

        {/* Next steps */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Próximos passos:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Copia o prompt acima</li>
            <li>Abre o ChatGPT ou Claude</li>
            <li>Cola o prompt e envia</li>
            <li>Copia o JSON gerado</li>
            <li>Volta à app e importa o plano</li>
          </ol>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER QUESTIONNAIRE
  // ============================================

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Passo {currentStep + 1} de {steps.length}
          </span>
          <span className="font-medium text-neutral-900">{steps[currentStep].title}</span>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <button
              key={step.id}
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
              className={`flex flex-col items-center gap-1 ${
                index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs ${isActive ? 'text-primary-600 font-medium' : 'text-neutral-500'}`}>
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <StepPersonal data={data} updateData={updateData} />
        )}
        {currentStep === 1 && (
          <StepGoals data={data} toggleArrayItem={toggleArrayItem} />
        )}
        {currentStep === 2 && (
          <StepSchedule data={data} updateData={updateData} toggleArrayItem={toggleArrayItem} />
        )}
        {currentStep === 3 && (
          <StepEquipment data={data} updateData={updateData} toggleArrayItem={toggleArrayItem} />
        )}
        {currentStep === 4 && (
          <StepHealth data={data} updateData={updateData} toggleArrayItem={toggleArrayItem} />
        )}
        {currentStep === 5 && (
          <StepPreferences data={data} updateData={updateData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-4 py-3 border border-neutral-300 rounded-xl font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === steps.length - 1 ? (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Prompt
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {!canProceed && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Preenche os campos obrigatórios para continuar
        </p>
      )}
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

interface StepProps {
  data: QuestionnaireData;
  updateData?: (updates: Partial<QuestionnaireData>) => void;
  toggleArrayItem?: (field: keyof QuestionnaireData, item: string | number) => void;
}

function StepPersonal({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Conta-nos sobre ti</h2>
        <p className="text-neutral-600">Informação básica para personalizar o teu plano.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateData?.({ name: e.target.value })}
            placeholder="Como te chamas?"
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              value={data.weight}
              onChange={(e) => updateData?.({ weight: e.target.value })}
              placeholder="70"
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Altura (cm)
            </label>
            <input
              type="number"
              value={data.height}
              onChange={(e) => updateData?.({ height: e.target.value })}
              placeholder="175"
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Nível de experiência <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'beginner', label: 'Iniciante', desc: '< 6 meses' },
              { id: 'intermediate', label: 'Intermédio', desc: '6 meses - 2 anos' },
              { id: 'advanced', label: 'Avançado', desc: '> 2 anos' },
            ].map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => updateData?.({ experienceLevel: level.id as any })}
                className={`p-4 rounded-xl border text-center transition-all ${
                  data.experienceLevel === level.id
                    ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-neutral-300 hover:border-neutral-400 bg-white'
                }`}
              >
                <p className="font-medium text-neutral-900">{level.label}</p>
                <p className="text-xs text-neutral-500 mt-1">{level.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Histórico de treino (opcional)
          </label>
          <textarea
            value={data.trainingHistory}
            onChange={(e) => updateData?.({ trainingHistory: e.target.value })}
            placeholder="Ex: Treinei musculação há 2 anos, parei durante 1 ano..."
            rows={2}
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function StepGoals({ data, toggleArrayItem }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Quais são os teus objetivos?</h2>
        <p className="text-neutral-600">Seleciona um ou mais objetivos principais.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Objetivos principais <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleArrayItem?.('primaryGoal', goal.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                data.primaryGoal.includes(goal.id)
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <span className="text-2xl">{goal.icon}</span>
              <p className="font-medium text-neutral-900 mt-1">{goal.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Zonas do corpo prioritárias (opcional)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TARGET_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => toggleArrayItem?.('targetAreas', area.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                data.targetAreas.includes(area.id)
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <span className="text-xl">{area.icon}</span>
              <p className="font-medium text-neutral-900 text-sm mt-1">{area.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepSchedule({ data, updateData, toggleArrayItem }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Qual a tua disponibilidade?</h2>
        <p className="text-neutral-600">Define quantos dias e quanto tempo podes treinar.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Quantos dias por semana? <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          {[2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => updateData?.({ daysPerWeek: num })}
              className={`w-12 h-12 rounded-xl border font-bold transition-all ${
                data.daysPerWeek === num
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 bg-white'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Quais dias? <span className="text-red-500">*</span>
          <span className="text-neutral-500 font-normal ml-1">
            (seleciona pelo menos {data.daysPerWeek})
          </span>
        </label>
        <div className="flex items-center gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleArrayItem?.('availableDays', day.id)}
              className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                data.availableDays.includes(day.id)
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 bg-white'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Duração de cada sessão
        </label>
        <div className="flex items-center gap-3">
          {[30, 45, 60, 75, 90].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => updateData?.({ minutesPerSession: mins })}
              className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                data.minutesPerSession === mins
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 bg-white'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Horário preferido (opcional)
        </label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'morning', label: 'Manhã', icon: '🌅' },
            { id: 'afternoon', label: 'Tarde', icon: '☀️' },
            { id: 'evening', label: 'Noite', icon: '🌙' },
            { id: 'flexible', label: 'Flexível', icon: '🔄' },
          ].map((time) => (
            <button
              key={time.id}
              type="button"
              onClick={() => updateData?.({ preferredTime: time.id as any })}
              className={`p-3 rounded-xl border text-center transition-all ${
                data.preferredTime === time.id
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <span className="text-xl">{time.icon}</span>
              <p className="text-sm font-medium text-neutral-900 mt-1">{time.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepEquipment({ data, updateData, toggleArrayItem }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Onde vais treinar?</h2>
        <p className="text-neutral-600">Seleciona o teu local e equipamento disponível.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Tipo de local <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {GYM_TYPES.map((gym) => (
            <button
              key={gym.id}
              type="button"
              onClick={() => updateData?.({ gymType: gym.id as any })}
              className={`p-4 rounded-xl border text-left transition-all ${
                data.gymType === gym.id
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <p className="font-medium text-neutral-900">{gym.label}</p>
              <p className="text-xs text-neutral-500 mt-1">{gym.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Equipamento disponível (opcional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EQUIPMENT.map((eq) => (
            <button
              key={eq.id}
              type="button"
              onClick={() => toggleArrayItem?.('availableEquipment', eq.id)}
              className={`p-3 rounded-xl border text-left transition-all text-sm ${
                data.availableEquipment.includes(eq.id)
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              {eq.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHealth({ data, updateData, toggleArrayItem }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Considerações de saúde</h2>
        <p className="text-neutral-600">
          Informação importante para adaptar o treino de forma segura.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Condições de saúde
        </label>
        <div className="grid grid-cols-2 gap-2">
          {HEALTH_CONDITIONS.map((condition) => (
            <button
              key={condition.id}
              type="button"
              onClick={() => toggleArrayItem?.('healthConditions', condition.id)}
              className={`p-3 rounded-xl border text-left transition-all text-sm ${
                data.healthConditions.includes(condition.id)
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              {condition.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Lesões ou limitações específicas
        </label>
        <textarea
          value={data.injuries}
          onChange={(e) => updateData?.({ injuries: e.target.value })}
          placeholder="Ex: Hérnia discal L5-S1, tendinite no ombro direito..."
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Exercícios a evitar
        </label>
        <textarea
          value={data.exercisesToAvoid}
          onChange={(e) => updateData?.({ exercisesToAvoid: e.target.value })}
          placeholder="Ex: Agachamento profundo, extensão de pernas..."
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>
    </div>
  );
}

function StepPreferences({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Preferências pessoais</h2>
        <p className="text-neutral-600">Ajuda-nos a criar um plano que vais gostar de seguir.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Exercícios favoritos
        </label>
        <textarea
          value={data.preferredExercises}
          onChange={(e) => updateData?.({ preferredExercises: e.target.value })}
          placeholder="Ex: Hip thrust, deadlift, pull-ups..."
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Exercícios que não gostas
        </label>
        <textarea
          value={data.dislikedExercises}
          onChange={(e) => updateData?.({ dislikedExercises: e.target.value })}
          placeholder="Ex: Burpees, lunges..."
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Qual a tua relação com cardio?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'love', label: 'Adoro', icon: '❤️' },
            { id: 'tolerate', label: 'Tolero', icon: '😐' },
            { id: 'hate', label: 'Odeio', icon: '😤' },
          ].map((pref) => (
            <button
              key={pref.id}
              type="button"
              onClick={() => updateData?.({ cardioPreference: pref.id as any })}
              className={`p-4 rounded-xl border text-center transition-all ${
                data.cardioPreference === pref.id
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <span className="text-2xl">{pref.icon}</span>
              <p className="font-medium text-neutral-900 mt-1">{pref.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-sm text-amber-800">
          💡 <strong>Dica:</strong> Quanto mais informação forneceres, mais personalizado será o
          teu plano de treino!
        </p>
      </div>
    </div>
  );
}
