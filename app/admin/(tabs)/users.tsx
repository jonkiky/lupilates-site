import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorBanner } from '@/components/ui/StateViews';
import { UserCard } from '@/components/user/UserCard';
import { UserFilterTabs, type UserFilterTab } from '@/components/user/UserFilterTabs';
import { UserSearchInput } from '@/components/user/UserSearchInput';
import { ROUTES } from '@/constants/routes';
import { listenUsers } from '@/features/users/users.listener';
import { selectAllUsers, selectUsersError } from '@/features/users/users.selectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
export default function AdminUsersScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const allUsers = useAppSelector(selectAllUsers);
  const usersError = useAppSelector(selectUsersError);

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<UserFilterTab>('IN_TRAINING');

  useEffect(() => {
    const unsubscribe = listenUsers(dispatch);
    return unsubscribe;
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (filterTab === 'ADMIN') {
      list = list.filter((u) => u.role === 'ADMIN');
    } else if (filterTab !== 'ALL') {
      list = list.filter((u) => u.role === 'USER' && u.status === filterTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.displayName ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [allUsers, filterTab, search]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Users
            </ThemedText>
            <ThemedText style={styles.countText}>{filteredUsers.length} users</ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={() => router.push(ROUTES.admin.createUser as any)}>
            <ThemedText style={styles.addButtonText}>+ Add User</ThemedText>
          </Pressable>
        </View>

        {/* Error Banner */}
        {usersError && <ErrorBanner message={usersError} />}

        {/* Search */}
        <View style={styles.searchSection}>
          <UserSearchInput value={search} onChangeText={setSearch} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <UserFilterTabs active={filterTab} onChange={setFilterTab} />
        </View>

        {/* User List */}
        <View style={styles.listSection}>
          {filteredUsers.length > 0 ? (
            <View style={styles.userList}>
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.uid}
                  user={user}
                  onPress={() => router.push(ROUTES.admin.editUser(user.uid) as any)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>
                {search.trim() ? 'No users match your search' : 'No users found'}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  userList: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
