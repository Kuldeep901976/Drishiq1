'use client';

import { useEffect, ReactNode } from 'react';
import { FlowController } from '@/lib/flow-controller';

export default function FlowResumeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Resume flow state when app loads
    FlowController.getInstance().resumeFlow();
  }, []);

  return <>{children}</>;
}
