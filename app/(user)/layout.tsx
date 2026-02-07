'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FlowController } from '@/lib/flow-controller';

// Define public user paths that don't require authentication
const PUBLIC_USER_PATHS = [
  '/user/signin',
  '/user/signup',
  '/user/signup/sent',
  '/user/create-password',
  '/forgot-password',
  '/reset-password',
  '/reset-password/sent',
  '/auth/callback',
  '/auth/confirm',
];

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentPath = window.location.pathname;

      // Allow access to public paths
      if (PUBLIC_USER_PATHS.includes(currentPath)) {
        return;
      }

      // Check if user is authenticated
      if (!session) {
        router.replace('/user/signin');
        return;
      }

      // Check if user can access the current step
      const flowController = FlowController.getInstance();
      if (!flowController.canAccess(flowController.getCurrentStep())) {
        router.replace('/user/signin');
        return;
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
