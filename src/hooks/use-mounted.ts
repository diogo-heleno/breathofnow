'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that returns true after the component has mounted on the client.
 * Useful for avoiding hydration mismatches when rendering client-only content.
 *
 * @example
 * const hasMounted = useHasMounted();
 * if (!hasMounted) return <LoadingSkeleton />;
 * return <AuthDependentContent />;
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
