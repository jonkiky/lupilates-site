import { useEffect } from 'react';

import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';

import { bootstrapUserProfile, routeAfterAuth } from '@/features/auth/auth.service';
import { clearAuthSession, setAuthError, setAuthLoading, setAuthSession } from '@/features/auth/auth.slice';
import { firebaseAuth } from '@/lib/firebase/auth';
import { useAppDispatch } from '@/store/hooks';

export function useAuthGate() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(setAuthLoading());

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        dispatch(clearAuthSession());
        router.replace('/auth/login');
        return;
      }

      try {
        const profile = await bootstrapUserProfile(user.uid);
        dispatch(setAuthSession(profile));

        const targetRoute = routeAfterAuth(profile);
        router.replace(targetRoute);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to bootstrap auth state.';
        dispatch(setAuthError(message));
      }
    });

    return unsubscribe;
  }, [dispatch, router]);
}
