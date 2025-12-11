'use client';

import * as React from 'react';
import { useHasMounted } from '@/hooks/use-mounted';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders its children on the client side.
 * Renders the fallback (or nothing) during SSR and initial hydration.
 * This prevents hydration mismatches for client-only content like auth state.
 *
 * @example
 * <ClientOnly fallback={<LoadingSkeleton />}>
 *   <AuthDependentContent />
 * </ClientOnly>
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
