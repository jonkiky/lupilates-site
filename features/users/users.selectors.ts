import { createSelector } from '@reduxjs/toolkit';

import { usersAdapter } from '@/features/users/users.slice';
import type { RootState } from '@/store/rootReducer';
import type { UserProfile, UserStatus } from '@/types/domain';

const usersSelectors = usersAdapter.getSelectors<RootState>((state) => state.users);

export const selectAllUsers = usersSelectors.selectAll;
export const selectUserById = usersSelectors.selectById;
export const selectUserEntities = usersSelectors.selectEntities;

export const selectUsersListenerActive = (state: RootState) => state.users.listenerActive;
export const selectUsersError = (state: RootState) => state.users.error;

export const selectUsersByStatus = createSelector(
  [selectAllUsers, (_state: RootState, status: UserStatus | 'ALL') => status],
  (users, status): UserProfile[] => {
    if (status === 'ALL') return users;
    return users.filter((u) => u.status === status);
  },
);

export const selectUsersBySearch = createSelector(
  [
    selectAllUsers,
    (_state: RootState, _search: string, status: UserStatus | 'ALL') => status,
    (_state: RootState, search: string) => search,
  ],
  (users, status, search): UserProfile[] => {
    let filtered = users;
    if (status !== 'ALL') {
      filtered = filtered.filter((u) => u.status === status);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    return filtered;
  },
);
