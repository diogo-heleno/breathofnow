// FitLog Plans Page

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileJson } from 'lucide-react';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { useFitLogStore } from '@/stores/fitlog-store';
import { PlanCard } from '@/components/fitlog/plans';
import { EmptyState } from '@/components/fitlog/common';
import type { WorkoutPlan } from '@/types/fitlog';

interface PlansPageProps {
  params: { locale: string };
}

export default function PlansPage({ params }: PlansPageProps) {
  const { locale } = params;
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setActivePlan } = useFitLogStore();

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const allPlans = await fitlogDb.getAllPlans();
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleActivate = async (planId: number) => {
    try {
      await fitlogDb.setActivePlan(planId);
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setActivePlan({ ...plan, isActive: true });
      }
      loadPlans(); // Reload to update UI
    } catch (error) {
      console.error('Error activating plan:', error);
    }
  };

  const handleDelete = async (planId: number) => {
    try {
      await fitlogDb.deletePlan(planId);
      loadPlans(); // Reload after delete
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-neutral-200 rounded-xl animate-pulse" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-40 bg-neutral-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Planos de Treino</h1>
        <Link
          href={`/${locale}/fitlog/plans/import`}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileJson className="w-8 h-8 text-primary" />
            </div>
          }
          title="Sem planos"
          description="Importa um plano de treino em formato JSON para começar."
          action={{
            label: 'Importar Plano',
            onClick: () => router.push(`/${locale}/fitlog/plans/import`),
          }}
        />
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onActivate={() => handleActivate(plan.id!)}
              onDelete={() => handleDelete(plan.id!)}
              onClick={() => router.push(`/${locale}/fitlog/plans/${plan.id}`)}
            />
          ))}
        </div>
      )}

      {/* Info section */}
      <div className="p-4 bg-neutral-100 rounded-xl">
        <h3 className="font-semibold text-neutral-900 mb-2">💡 Dica</h3>
        <p className="text-sm text-neutral-600">
          Podes ter múltiplos planos guardados e alternar entre eles. Apenas um plano pode estar ativo de cada vez.
          Os dados de treino de cada plano são mantidos separadamente.
        </p>
      </div>
    </div>
  );
}
