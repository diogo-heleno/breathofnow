// FitLog Workout Questionnaire - Generates AI Prompt

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
  { id: 'strength', labelKey: 'goals.strength', icon: '💪' },
  { id: 'muscle', labelKey: 'goals.muscle', icon: '🏋️' },
  { id: 'fat_loss', labelKey: 'goals.fatLoss', icon: '🔥' },
  { id: 'endurance', labelKey: 'goals.endurance', icon: '🏃' },
  { id: 'flexibility', labelKey: 'goals.flexibility', icon: '🧘' },
  { id: 'health', labelKey: 'goals.health', icon: '❤️' },
  { id: 'sport', labelKey: 'goals.sport', icon: '⚽' },
  { id: 'tone', labelKey: 'goals.tone', icon: '✨' },
];

const TARGET_AREAS = [
  { id: 'glutes', labelKey: 'targetAreas.glutes', icon: '🍑' },
  { id: 'legs', labelKey: 'targetAreas.legs', icon: '🦵' },
  { id: 'abs', labelKey: 'targetAreas.abs', icon: '🎯' },
  { id: 'back', labelKey: 'targetAreas.back', icon: '🔙' },
  { id: 'chest', labelKey: 'targetAreas.chest', icon: '💪' },
  { id: 'arms', labelKey: 'targetAreas.arms', icon: '💪' },
  { id: 'shoulders', labelKey: 'targetAreas.shoulders', icon: '🎯' },
  { id: 'full_body', labelKey: 'targetAreas.fullBody', icon: '🏋️' },
];

const DAYS_OF_WEEK = [
  { id: 0, labelKey: 'daysShort.sunday', fullLabelKey: 'days.sunday' },
  { id: 1, labelKey: 'daysShort.monday', fullLabelKey: 'days.monday' },
  { id: 2, labelKey: 'daysShort.tuesday', fullLabelKey: 'days.tuesday' },
  { id: 3, labelKey: 'daysShort.wednesday', fullLabelKey: 'days.wednesday' },
  { id: 4, labelKey: 'daysShort.thursday', fullLabelKey: 'days.thursday' },
  { id: 5, labelKey: 'daysShort.friday', fullLabelKey: 'days.friday' },
  { id: 6, labelKey: 'daysShort.saturday', fullLabelKey: 'days.saturday' },
];

const GYM_TYPES = [
  { id: 'full_gym', labelKey: 'equipment.fullGym', descriptionKey: 'equipment.fullGymDesc' },
  { id: 'home_basic', labelKey: 'equipment.homeBasic', descriptionKey: 'equipment.homeBasicDesc' },
  { id: 'home_advanced', labelKey: 'equipment.homeAdvanced', descriptionKey: 'equipment.homeAdvancedDesc' },
  { id: 'outdoor', labelKey: 'equipment.outdoor', descriptionKey: 'equipment.outdoorDesc' },
];

const EQUIPMENT = [
  { id: 'barbells', labelKey: 'equipment.barbells' },
  { id: 'dumbbells', labelKey: 'equipment.dumbbells' },
  { id: 'kettlebells', labelKey: 'equipment.kettlebells' },
  { id: 'cables', labelKey: 'equipment.cables' },
  { id: 'machines', labelKey: 'equipment.machines' },
  { id: 'bench', labelKey: 'equipment.bench' },
  { id: 'squat_rack', labelKey: 'equipment.squatRack' },
  { id: 'pull_up_bar', labelKey: 'equipment.pullUpBar' },
  { id: 'resistance_bands', labelKey: 'equipment.resistanceBands' },
  { id: 'trx', labelKey: 'equipment.trx' },
  { id: 'cardio_machines', labelKey: 'equipment.cardioMachines' },
  { id: 'bodyweight', labelKey: 'equipment.bodyweight' },
];

const HEALTH_CONDITIONS = [
  { id: 'back_pain', labelKey: 'health.backPain' },
  { id: 'knee_issues', labelKey: 'health.kneeIssues' },
  { id: 'shoulder_issues', labelKey: 'health.shoulderIssues' },
  { id: 'hypertension', labelKey: 'health.hypertension' },
  { id: 'diabetes', labelKey: 'health.diabetes' },
  { id: 'pregnancy', labelKey: 'health.pregnancy' },
  { id: 'heart_condition', labelKey: 'health.heartCondition' },
  { id: 'none', labelKey: 'health.none' },
];

// ============================================
// MAIN COMPONENT
// ============================================

interface WorkoutQuestionnaireProps {
  onComplete?: (prompt: string) => void;
}

export function WorkoutQuestionnaire({ onComplete }: WorkoutQuestionnaireProps) {
  const t = useTranslations('fitLog.questionnaire');
  const tFitLog = useTranslations('fitLog');
  const tCommon = useTranslations('common');
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuestionnaireData>(initialData);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const steps = [
    { id: 'personal', titleKey: 'stepTitles.personal', icon: User },
    { id: 'goals', titleKey: 'stepTitles.goals', icon: Target },
    { id: 'schedule', titleKey: 'stepTitles.schedule', icon: Calendar },
    { id: 'equipment', titleKey: 'stepTitles.equipment', icon: Dumbbell },
    { id: 'health', titleKey: 'stepTitles.health', icon: Heart },
    { id: 'preferences', titleKey: 'stepTitles.preferences', icon: Zap },
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
            {t('backToQuestionnaire')}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                {tCommon('copied')}
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                {t('copyPrompt')}
              </>
            )}
          </button>
        </div>

        {/* Success message */}
        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">{t('promptGenerated')}</h3>
              <p className="text-sm text-green-700 mt-1">
                {t('promptInstructions')}
              </p>
            </div>
          </div>
        </div>

        {/* Prompt display */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden">
          <div className="p-3 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">{t('llmPrompt')}</span>
            <span className="text-xs text-neutral-500">{prompt.length} {t('characters')}</span>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-sm text-neutral-800 whitespace-pre-wrap font-mono leading-relaxed">
              {prompt}
            </pre>
          </div>
        </div>

        {/* Next steps */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">{t('nextSteps')}</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>{t('steps.copyPrompt')}</li>
            <li>{t('steps.openAI')}</li>
            <li>{t('steps.pastePrompt')}</li>
            <li>{t('steps.copyJSON')}</li>
            <li>{t('steps.returnAndImport')}</li>
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
            {t('stepOf', { current: currentStep + 1, total: steps.length })}
          </span>
          <span className="font-medium text-neutral-900">{t(steps[currentStep].titleKey)}</span>
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
                {t(step.titleKey)}
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
            {tCommon('back')}
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
              {t('generatePrompt')}
            </>
          ) : (
            <>
              {tCommon('continue')}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {!canProceed && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {t('fillRequired')}
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
  const t = useTranslations('fitLog.questionnaire');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('personal.title')}</h2>
        <p className="text-neutral-600">{t('personal.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('personal.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateData?.({ name: e.target.value })}
            placeholder={t('namePlaceholder')}
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('personal.weight')}
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
              {t('personal.height')}
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
            {t('personal.experienceLevel')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'beginner', labelKey: 'experience.beginner', descKey: 'experience.beginnerDesc' },
              { id: 'intermediate', labelKey: 'experience.intermediate', descKey: 'experience.intermediateDesc' },
              { id: 'advanced', labelKey: 'experience.advanced', descKey: 'experience.advancedDesc' },
            ].map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => updateData?.({ experienceLevel: level.id as 'beginner' | 'intermediate' | 'advanced' })}
                className={`p-4 rounded-xl border text-center transition-all ${
                  data.experienceLevel === level.id
                    ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-neutral-300 hover:border-neutral-400 bg-white'
                }`}
              >
                <p className="font-medium text-neutral-900">{t(level.labelKey)}</p>
                <p className="text-xs text-neutral-500 mt-1">{t(level.descKey)}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('personal.trainingHistory')}
          </label>
          <textarea
            value={data.trainingHistory}
            onChange={(e) => updateData?.({ trainingHistory: e.target.value })}
            placeholder={t('experiencePlaceholder')}
            rows={2}
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function StepGoals({ data, toggleArrayItem }: StepProps) {
  const t = useTranslations('fitLog.questionnaire');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('goals.title')}</h2>
        <p className="text-neutral-600">{t('goals.subtitle')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('goals.mainGoals')} <span className="text-red-500">*</span>
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
              <p className="font-medium text-neutral-900 mt-1">{t(goal.labelKey)}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('goals.targetAreas')}
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
              <p className="font-medium text-neutral-900 text-sm mt-1">{t(area.labelKey)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepSchedule({ data, updateData, toggleArrayItem }: StepProps) {
  const t = useTranslations('fitLog.questionnaire');
  const tFitLog = useTranslations('fitLog');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('schedule.title')}</h2>
        <p className="text-neutral-600">{t('schedule.subtitle')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('schedule.daysPerWeek')} <span className="text-red-500">*</span>
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
          {t('schedule.whichDays')} <span className="text-red-500">*</span>
          <span className="text-neutral-500 font-normal ml-1">
            {t('schedule.selectAtLeast', { count: data.daysPerWeek })}
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
              {tFitLog(day.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('schedule.sessionDuration')}
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
          {t('schedule.preferredTime')}
        </label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'morning', labelKey: 'schedule.morning', icon: '🌅' },
            { id: 'afternoon', labelKey: 'schedule.afternoon', icon: '☀️' },
            { id: 'evening', labelKey: 'schedule.evening', icon: '🌙' },
            { id: 'flexible', labelKey: 'schedule.flexible', icon: '🔄' },
          ].map((time) => (
            <button
              key={time.id}
              type="button"
              onClick={() => updateData?.({ preferredTime: time.id as 'morning' | 'afternoon' | 'evening' | 'flexible' })}
              className={`p-3 rounded-xl border text-center transition-all ${
                data.preferredTime === time.id
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <span className="text-xl">{time.icon}</span>
              <p className="text-sm font-medium text-neutral-900 mt-1">{t(time.labelKey)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepEquipment({ data, updateData, toggleArrayItem }: StepProps) {
  const t = useTranslations('fitLog.questionnaire');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('equipment.title')}</h2>
        <p className="text-neutral-600">{t('equipment.subtitle')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('equipment.locationType')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {GYM_TYPES.map((gym) => (
            <button
              key={gym.id}
              type="button"
              onClick={() => updateData?.({ gymType: gym.id as 'full_gym' | 'home_basic' | 'home_advanced' | 'outdoor' })}
              className={`p-4 rounded-xl border text-left transition-all ${
                data.gymType === gym.id
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <p className="font-medium text-neutral-900">{t(gym.labelKey)}</p>
              <p className="text-xs text-neutral-500 mt-1">{t(gym.descriptionKey)}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('equipment.availableEquipment')}
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
              {t(eq.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHealth({ data, updateData, toggleArrayItem }: StepProps) {
  const t = useTranslations('fitLog.questionnaire');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('health.title')}</h2>
        <p className="text-neutral-600">
          {t('health.subtitle')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('health.conditions')}
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
              {t(condition.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {t('health.injuries')}
        </label>
        <textarea
          value={data.injuries}
          onChange={(e) => updateData?.({ injuries: e.target.value })}
          placeholder={t('injuriesPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {t('health.exercisesToAvoid')}
        </label>
        <textarea
          value={data.exercisesToAvoid}
          onChange={(e) => updateData?.({ exercisesToAvoid: e.target.value })}
          placeholder={t('avoidExercisesPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>
    </div>
  );
}

function StepPreferences({ data, updateData }: StepProps) {
  const t = useTranslations('fitLog.questionnaire');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('preferences.title')}</h2>
        <p className="text-neutral-600">{t('preferences.subtitle')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {t('preferences.favoriteExercises')}
        </label>
        <textarea
          value={data.preferredExercises}
          onChange={(e) => updateData?.({ preferredExercises: e.target.value })}
          placeholder={t('favoriteExercisesPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {t('preferences.dislikedExercises')}
        </label>
        <textarea
          value={data.dislikedExercises}
          onChange={(e) => updateData?.({ dislikedExercises: e.target.value })}
          placeholder={t('otherAvoidPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t('preferences.cardioRelation')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'love', labelKey: 'preferences.love', icon: '❤️' },
            { id: 'tolerate', labelKey: 'preferences.tolerate', icon: '😐' },
            { id: 'hate', labelKey: 'preferences.hate', icon: '😤' },
          ].map((pref) => (
            <button
              key={pref.id}
              type="button"
              onClick={() => updateData?.({ cardioPreference: pref.id as 'love' | 'tolerate' | 'hate' })}
              className={`p-4 rounded-xl border text-center transition-all ${
                data.cardioPreference === pref.id
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <span className="text-2xl">{pref.icon}</span>
              <p className="font-medium text-neutral-900 mt-1">{t(pref.labelKey)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-sm text-amber-800">
          💡 {t('preferences.tip')}
        </p>
      </div>
    </div>
  );
}
