// FitLog Import/Export Helpers

import { fitlogDb } from '@/lib/db/fitlog-db';
import type {
  ImportedPlan,
  ImportedWorkout,
  ImportedExercise,
  WorkoutPlan,
  Workout,
  Exercise,
  ExportData,
  ExportedSession,
  ExportedExercise,
} from '@/types/fitlog';

// ============================================
// VALIDATION
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePlanJson(json: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['JSON inválido'], warnings: [] };
  }

  const plan = json as Record<string, unknown>;

  // Required fields
  if (!plan.planName || typeof plan.planName !== 'string') {
    errors.push('Campo "planName" é obrigatório');
  }

  if (!plan.workouts || !Array.isArray(plan.workouts)) {
    errors.push('Campo "workouts" é obrigatório e deve ser um array');
  } else {
    // Validate each workout
    (plan.workouts as unknown[]).forEach((workout, wIndex) => {
      if (!workout || typeof workout !== 'object') {
        errors.push(`Treino ${wIndex + 1}: formato inválido`);
        return;
      }

      const w = workout as Record<string, unknown>;

      if (!w.id || typeof w.id !== 'string') {
        errors.push(`Treino ${wIndex + 1}: campo "id" é obrigatório`);
      }

      if (!w.name || typeof w.name !== 'string') {
        errors.push(`Treino ${wIndex + 1}: campo "name" é obrigatório`);
      }

      if (typeof w.dayOfWeek !== 'number' || w.dayOfWeek < 0 || w.dayOfWeek > 6) {
        errors.push(`Treino ${wIndex + 1}: "dayOfWeek" deve ser um número entre 0 e 6`);
      }

      if (!w.exercises || !Array.isArray(w.exercises)) {
        errors.push(`Treino ${wIndex + 1}: campo "exercises" é obrigatório`);
      } else {
        // Validate each exercise
        (w.exercises as unknown[]).forEach((exercise, eIndex) => {
          if (!exercise || typeof exercise !== 'object') {
            errors.push(`Treino ${wIndex + 1}, Exercício ${eIndex + 1}: formato inválido`);
            return;
          }

          const e = exercise as Record<string, unknown>;

          if (!e.id || typeof e.id !== 'string') {
            errors.push(`Treino ${wIndex + 1}, Exercício ${eIndex + 1}: campo "id" é obrigatório`);
          }

          if (!e.name || typeof e.name !== 'string') {
            errors.push(`Treino ${wIndex + 1}, Exercício ${eIndex + 1}: campo "name" é obrigatório`);
          }

          if (typeof e.sets !== 'number' || e.sets < 1) {
            errors.push(`Treino ${wIndex + 1}, Exercício ${eIndex + 1}: "sets" deve ser >= 1`);
          }

          if (e.reps === undefined || e.reps === null) {
            errors.push(`Treino ${wIndex + 1}, Exercício ${eIndex + 1}: campo "reps" é obrigatório`);
          }

          // Warnings
          if (!e.restSeconds) {
            warnings.push(`Treino ${wIndex + 1}, Exercício ${eIndex + 1}: sem tempo de descanso definido`);
          }

          if (!e.videoUrl) {
            warnings.push(`Treino ${wIndex + 1}, Exercício ${eIndex + 1}: sem link de vídeo`);
          }
        });
      }
    });
  }

  // Optional fields warnings
  if (!plan.athlete) {
    warnings.push('Dados do atleta não incluídos');
  }

  if (!plan.weeks) {
    warnings.push('Número de semanas não definido');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// IMPORT
// ============================================

export async function importPlan(jsonString: string): Promise<{
  success: boolean;
  planId?: number;
  error?: string;
}> {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validatePlanJson(parsed);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('\n'),
      };
    }

    const plan = parsed as ImportedPlan;

    // Create plan record
    const workoutPlan: WorkoutPlan = {
      planName: plan.planName,
      version: plan.version || '1.0',
      rawJson: jsonString,
      isActive: false,
      athleteName: plan.athlete?.name,
      athleteGoal: plan.athlete?.goal,
      frequency: plan.athlete?.frequency,
      sessionDuration: plan.athlete?.sessionDuration,
      totalWeeks: plan.weeks,
      importedAt: new Date(),
      updatedAt: new Date(),
    };

    const planId = await fitlogDb.workoutPlans.add(workoutPlan);

    // Create workouts and exercises
    for (let wIndex = 0; wIndex < plan.workouts.length; wIndex++) {
      const importedWorkout = plan.workouts[wIndex];

      const workout: Workout = {
        planId,
        workoutId: importedWorkout.id,
        name: importedWorkout.name,
        dayOfWeek: importedWorkout.dayOfWeek,
        targetDuration: importedWorkout.targetDuration || 45,
        warmupDescription: importedWorkout.warmup?.description,
        warmupDuration: importedWorkout.warmup?.duration,
        cardioDescription: importedWorkout.cardio?.description,
        cardioDuration: importedWorkout.cardio?.duration,
        cardioAlternatives: importedWorkout.cardio?.alternatives,
        order: wIndex,
      };

      const workoutId = await fitlogDb.workouts.add(workout);

      // Create exercises
      for (let eIndex = 0; eIndex < importedWorkout.exercises.length; eIndex++) {
        const importedExercise = importedWorkout.exercises[eIndex];

        const exercise: Exercise = {
          workoutId,
          exerciseId: importedExercise.id,
          name: importedExercise.name,
          muscleGroups: importedExercise.muscleGroups || [],
          sets: importedExercise.sets,
          reps: String(importedExercise.reps),
          restSeconds: importedExercise.restSeconds || 60,
          notes: importedExercise.notes,
          videoUrl: importedExercise.videoUrl,
          equipmentNeeded: importedExercise.equipmentNeeded,
          order: eIndex,
        };

        await fitlogDb.exercises.add(exercise);
      }
    }

    // Set as active plan if no other active plan
    const activePlan = await fitlogDb.getActivePlan();
    if (!activePlan) {
      await fitlogDb.setActivePlan(planId);
    }

    return { success: true, planId };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao importar plano',
    };
  }
}

// ============================================
// EXPORT
// ============================================

export async function exportSessionsForLLM(
  weeksToInclude: number = 4,
  includeNotes: boolean = true
): Promise<ExportData | null> {
  try {
    const activePlan = await fitlogDb.getActivePlan();
    if (!activePlan) return null;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksToInclude * 7);

    // Get sessions in range
    const sessions = await fitlogDb.getSessionsInDateRange(startDate, endDate);
    const completedSessions = sessions.filter((s) => s.completedAt);

    // Build exported sessions
    const exportedSessions: ExportedSession[] = [];

    for (const session of completedSessions) {
      const sets = await fitlogDb.getSetsBySession(session.id!);

      // Group sets by exercise
      const exerciseMap = new Map<number, typeof sets>();
      sets.forEach((set) => {
        if (!exerciseMap.has(set.exerciseId)) {
          exerciseMap.set(set.exerciseId, []);
        }
        exerciseMap.get(set.exerciseId)!.push(set);
      });

      const exportedExercises: ExportedExercise[] = [];

      for (const [exerciseId, exerciseSets] of Array.from(exerciseMap.entries())) {
        // Get exercise info
        const exercise = await fitlogDb.exercises.get(exerciseId);
        if (!exercise) continue;

        const exportedExercise: ExportedExercise = {
          name: exercise.name,
          targetSets: exercise.sets,
          targetReps: exercise.reps,
          actual: exerciseSets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
            duration: s.duration,
            difficulty: s.difficulty,
          })),
        };

        // Add notes if enabled
        if (includeNotes) {
          const notesFromSets = exerciseSets
            .filter((s) => s.notes)
            .map((s) => s.notes)
            .join('; ');
          if (notesFromSets) {
            exportedExercise.notes = notesFromSets;
          }
        }

        exportedExercises.push(exportedExercise);
      }

      exportedSessions.push({
        date: session.startedAt.toISOString().split('T')[0],
        workout: session.workoutName || `Treino ${session.workoutId}`,
        duration: session.duration,
        feeling: session.feeling,
        exercises: exportedExercises,
      });
    }

    // Calculate summary
    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgDuration = completedSessions.length > 0 ? totalDuration / completedSessions.length : 0;
    const feelings = completedSessions.filter((s) => s.feeling).map((s) => s.feeling!);
    const avgFeeling = feelings.length > 0 ? feelings.reduce((a, b) => a + b, 0) / feelings.length : 0;

    // Generate progression notes
    const progressionNotes = await generateProgressionNotes(activePlan.id!, completedSessions);

    return {
      exportDate: new Date().toISOString().split('T')[0],
      weeksIncluded: weeksToInclude,
      athlete: {
        name: activePlan.athleteName,
        currentPlan: `${activePlan.planName} v${activePlan.version}`,
      },
      summary: {
        totalSessions: completedSessions.length,
        totalDuration,
        avgSessionDuration: Math.round(avgDuration),
        completionRate: 100, // TODO: calcular baseado em treinos esperados vs feitos
        avgFeeling: Math.round(avgFeeling * 10) / 10,
      },
      sessions: exportedSessions,
      progressionNotes,
    };
  } catch (error) {
    console.error('Export error:', error);
    return null;
  }
}

async function generateProgressionNotes(
  planId: number,
  sessions: { id?: number }[]
): Promise<string[]> {
  const notes: string[] = [];

  // Get all exercises from plan
  const workouts = await fitlogDb.getWorkoutsByPlan(planId);
  const exerciseIds = new Set<number>();

  for (const workout of workouts) {
    const exercises = await fitlogDb.getExercisesByWorkout(workout.id!);
    exercises.forEach((e) => exerciseIds.add(e.id!));
  }

  // Analyze progression for each exercise
  for (const exerciseId of Array.from(exerciseIds)) {
    const progression = await fitlogDb.getExerciseProgression(exerciseId, 4);
    if (progression.length < 2) continue;

    const exercise = await fitlogDb.exercises.get(exerciseId);
    if (!exercise) continue;

    const first = progression[0];
    const last = progression[progression.length - 1];

    if (last.maxWeight > first.maxWeight) {
      const diff = last.maxWeight - first.maxWeight;
      notes.push(`${exercise.name}: +${diff}kg nas últimas semanas`);
    } else if (last.maxWeight === first.maxWeight && last.totalReps > first.totalReps) {
      notes.push(`${exercise.name}: manteve peso, aumentou reps`);
    } else if (last.maxWeight < first.maxWeight) {
      notes.push(`${exercise.name}: reduziu peso (verificar)`);
    }
  }

  return notes;
}

// ============================================
// PROMPT GENERATORS
// ============================================

export function generateInitialPrompt(): string {
  return `# Prompt para Gerar Plano de Treino

Preciso que cries um plano de treino personalizado. Por favor, faz-me as perguntas necessárias para criar um plano adequado, incluindo:

1. **Dados Pessoais**
   - Nome, idade, género
   - Peso e altura atual
   - Nível de experiência (iniciante/intermédio/avançado)

2. **Objetivos**
   - Objetivo principal (força, hipertrofia, perda de peso, resistência)
   - Zonas do corpo prioritárias
   - Prazo/timeline

3. **Disponibilidade**
   - Dias disponíveis por semana
   - Tempo por sessão
   - Horário preferido

4. **Contexto**
   - Tipo de ginásio/equipamento disponível
   - Lesões ou limitações
   - Exercícios que gostas/não gostas

5. **Histórico**
   - Experiência prévia
   - Último programa de treino

Depois de recolheres esta informação, gera o plano no seguinte formato JSON:

\`\`\`json
{
  "planName": "Nome do Plano",
  "version": "1.0",
  "createdAt": "YYYY-MM-DD",
  "athlete": {
    "name": "Nome",
    "goal": "Objetivo",
    "frequency": "Xz semana",
    "sessionDuration": 45
  },
  "weeks": 8,
  "workouts": [
    {
      "id": "workout-a",
      "name": "Treino A - Descrição",
      "dayOfWeek": 1,
      "targetDuration": 45,
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
          "notes": "Dicas de execução",
          "videoUrl": "https://youtube.com/watch?v=...",
          "equipmentNeeded": "Equipamento necessário"
        }
      ],
      "cardio": {
        "description": "Descrição do cardio",
        "duration": 10,
        "alternatives": ["alternativa 1"]
      }
    }
  ]
}
\`\`\`

**Importante:**
- dayOfWeek: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
- Inclui links de YouTube para demonstração de cada exercício
- Adapta os tempos de descanso ao objetivo
- O JSON deve ser válido e completo`;
}

export function generateAdjustmentPrompt(exportData: ExportData, activePlanJson: string): string {
  return `# Pedido de Ajuste de Plano de Treino

## Contexto do Atleta
- **Nome:** ${exportData.athlete.name || 'Não especificado'}
- **Plano atual:** ${exportData.athlete.currentPlan}

## Plano Atual
\`\`\`json
${activePlanJson}
\`\`\`

## Histórico das Últimas ${exportData.weeksIncluded} Semanas

### Resumo
- **Sessões completadas:** ${exportData.summary.totalSessions}
- **Duração total:** ${exportData.summary.totalDuration} min
- **Duração média:** ${exportData.summary.avgSessionDuration} min
- **Sensação média:** ${exportData.summary.avgFeeling}/5

### Notas de Progressão
${exportData.progressionNotes.length > 0 ? exportData.progressionNotes.map((n) => `- ${n}`).join('\n') : '- Sem dados suficientes para análise'}

### Detalhes das Sessões
\`\`\`json
${JSON.stringify(exportData.sessions, null, 2)}
\`\`\`

## Pedido
Com base no histórico acima, por favor analisa:

1. **Progressão**: Onde houve melhoria? Onde estagnei?
2. **Dificuldade**: Os exercícios estão adequados?
3. **Volume**: O volume total está apropriado?
4. **Equilíbrio**: Há grupos musculares sub/sobre-trabalhados?

Depois, gera um plano atualizado que:
- Aumente progressivamente os pesos onde apropriado
- Ajuste exercícios muito fáceis/difíceis
- Mantenha a estrutura geral (mesmos dias/duração)
- Adicione variações se necessário para evitar plateau

**Formato de resposta:** JSON válido seguindo o schema do plano atual.`;
}
