'use client';

import { useEffect } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';

export default function SupabaseInitializer({ children }: { children: React.ReactNode }) {
  const { isInitialized, initializeFromSupabase } = useMasterPlanStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeFromSupabase();
    }
  }, [isInitialized, initializeFromSupabase]);

  return <>{children}</>;
}
