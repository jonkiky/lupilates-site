import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { addMonths, endOfMonth, format, isSameDay, startOfMonth, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';

import { CalendarMonthGrid } from '@/components/calendar/CalendarMonthGrid';
import { AdminSessionCard } from '@/components/session/AdminSessionCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorBanner } from '@/components/ui/StateViews';
import { ROUTES } from '@/constants/routes';
import { listenAdminSessions } from '@/features/sessions/sessions.listener';
import {
    selectSessionsError,
    selectSessionsForDay,
    selectSessionsGroupedByLocalDate,
} from '@/features/sessions/sessions.selectors';
import { listenUsers } from '@/features/users/users.listener';
import { selectUserEntities } from '@/features/users/users.selectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function AdminCalendarScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const userEntities = useAppSelector(selectUserEntities);
  const sessionsByDate = useAppSelector(selectSessionsGroupedByLocalDate);
  const sessionsError = useAppSelector(selectSessionsError);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Listen to admin sessions for current month window
  useEffect(() => {
    const from = startOfMonth(subMonths(currentMonth, 1));
    const to = endOfMonth(addMonths(currentMonth, 1));
    const unsubscribe = listenAdminSessions(from, to, dispatch);
    return unsubscribe;
  }, [dispatch, currentMonth]);

  // Listen to users for name resolution
  useEffect(() => {
    const unsubscribe = listenUsers(dispatch);
    return unsubscribe;
  }, [dispatch]);

  const handlePrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const handleSelectDate = useCallback(
    (date: Date) => {
      if (selectedDate && isSameDay(date, selectedDate)) {
        router.push(`${ROUTES.admin.createSession}?date=${format(date, 'yyyy-MM-dd')}`);
      } else {
        setSelectedDate(date);
      }
    },
    [selectedDate, router],
  );

  const selectedDayKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const daySessions = useAppSelector((state) => selectSessionsForDay(state, selectedDayKey));

  const dayLabel = selectedDate
    ? format(selectedDate, 'MMMM d') + "'s Sessions"
    : "Today's Sessions";

  const monthSessionCount = useMemo(() => {
    const monthPrefix = format(currentMonth, 'yyyy-MM');
    return Object.entries(sessionsByDate)
      .filter(([key]) => key.startsWith(monthPrefix))
      .reduce((sum, [, sessions]) => sum + sessions.length, 0);
  }, [sessionsByDate, currentMonth]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Admin Calendar
            </ThemedText>
            <ThemedText style={styles.monthCount}>
              {monthSessionCount} session{monthSessionCount !== 1 ? 's' : ''} in {format(currentMonth, 'MMMM')}
            </ThemedText>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push(ROUTES.admin.createSession)}>
            <ThemedText style={styles.addButtonText}>+</ThemedText>
          </Pressable>
        </View>

        {/* Error Banner */}
        {sessionsError && <ErrorBanner message={sessionsError} />}

        {/* Calendar Grid */}
        <View style={styles.calendarSection}>
          <CalendarMonthGrid
            currentMonth={currentMonth}
            sessionsByDate={sessionsByDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </View>

        {/* Day Sessions List */}
        <View style={styles.listSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {dayLabel}
          </ThemedText>
          {daySessions.length > 0 ? (
            <View style={styles.sessionList}>
              {daySessions.map((session) => (
                <AdminSessionCard
                  key={session.id}
                  session={session}
                  user={userEntities[session.userId]}
                  onPress={() =>
                    router.push(ROUTES.admin.editSession(session.id) as any)
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>No sessions for this day</ThemedText>
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  monthCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  calendarSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
  },
  sessionList: {
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
