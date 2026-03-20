import { routeAfterAuth } from '@/features/auth/auth.service';
import type { UserProfile } from '@/types/domain';

export function useRoleRoute(profile: UserProfile | null) {
  if (!profile) {
    return null;
  }

  return routeAfterAuth(profile);
}
