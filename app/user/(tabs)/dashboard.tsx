import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';

import { SessionCard } from '@/components/session/SessionCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorBanner, ScreenLoading } from '@/components/ui/StateViews';
import { ROUTES } from '@/constants/routes';
import { selectAuthProfile } from '@/features/auth/auth.selectors';
import { listenUserSessions } from '@/features/sessions/sessions.listener';
import {
  selectCompletedClassCount,
  selectCompletedThisMonth,
  selectNextUpcomingSession,
  selectSessionsError,
  selectSessionsListenerActive,
} from '@/features/sessions/sessions.selectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function UserDashboardScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const profile = useAppSelector(selectAuthProfile);
  const completedTotal = useAppSelector(selectCompletedClassCount);
  const completedMonth = useAppSelector(selectCompletedThisMonth);
  const nextSession = useAppSelector(selectNextUpcomingSession);
  const listenerActive = useAppSelector(selectSessionsListenerActive);
  const sessionsError = useAppSelector(selectSessionsError);

  // Show loading on first mount before listener has delivered data
  const isInitialLoading = !listenerActive && completedTotal === 0 && !sessionsError;

  // Start a session listener covering a wide window (prev month → next month)
  useEffect(() => {
    if (!profile?.uid) return;
    const now = new Date();
    const from = startOfMonth(subMonths(now, 1));
    const to = endOfMonth(addMonths(now, 1));
    const unsubscribe = listenUserSessions(profile.uid, from, to, dispatch);
    return unsubscribe;
  }, [dispatch, profile?.uid]);

  const displayName = profile?.displayName ?? 'User';
  const firstName = displayName.split(' ')[0];

  return (
    <ThemedView style={styles.container}>
      {isInitialLoading ? (
        <ScreenLoading message="Loading your sessions..." />
      ) : (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Dashboard
            </ThemedText>
            <ThemedText style={styles.subtitle}>Welcome back, {firstName}</ThemedText>
          </View>
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push(ROUTES.user.settings)}>
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </Pressable>
        </View>

        {/* Error Banner */}
        {sessionsError && <ErrorBanner message={sessionsError} />}

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <ThemedText style={styles.statLabel}>Completed Classes</ThemedText>
            <ThemedText style={styles.statValue}>{completedTotal}</ThemedText>
          </View>
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <ThemedText style={styles.statLabel}>This Month</ThemedText>
            <ThemedText style={styles.statValue}>{completedMonth}</ThemedText>
          </View>
        </View>

        {/* Next Session */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Next Session
          </ThemedText>
          {nextSession ? (
            <SessionCard
              session={nextSession}
              onPress={() => router.push(ROUTES.modal.sessionDetail(nextSession.id) as any)}
            />
          ) : (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>No upcoming sessions</ThemedText>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            onPress={() => router.push(ROUTES.user.calendar)}>
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            </View>
            <ThemedText style={styles.actionLabel}>View Calendar</ThemedText>
            <ThemedText style={styles.actionChevron}>›</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            onPress={() => router.push(ROUTES.user.settings)}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="settings-outline" size={20} color="#7C3AED" />
            </View>
            <ThemedText style={styles.actionLabel}>Settings</ThemedText>
            <ThemedText style={styles.actionChevron}>›</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
      )}
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  settingsIcon: {
    fontSize: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
  },
  statCardPrimary: {
    backgroundColor: '#4F46E5',
  },
  statCardSecondary: {
    backgroundColor: '#059669',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
    paddingTop: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  actionChevron: {
    fontSize: 22,
    color: '#9CA3AF',
  },
});
