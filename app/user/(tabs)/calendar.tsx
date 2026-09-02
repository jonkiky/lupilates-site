import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  addMonths,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useRouter } from 'expo-router';

import { CalendarMonthGrid } from '@/components/calendar/CalendarMonthGrid';
import { SessionCard } from '@/components/session/SessionCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorBanner } from '@/components/ui/StateViews';
import { ROUTES } from '@/constants/routes';
import { selectAuthProfile } from '@/features/auth/auth.selectors';
import { listenUserSessions } from '@/features/sessions/sessions.listener';
import {
    selectSessionsError,
    selectSessionsGroupedByLocalDate,
} from '@/features/sessions/sessions.selectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function UserCalendarScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const profile = useAppSelector(selectAuthProfile);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const sessionsByDate = useAppSelector(selectSessionsGroupedByLocalDate);
  const sessionsError = useAppSelector(selectSessionsError);

  useEffect(() => {
    if (!profile?.uid) return;
    const from = startOfMonth(subMonths(currentMonth, 1));
    const to = endOfMonth(addMonths(currentMonth, 1));
    return listenUserSessions(profile.uid, from, to, dispatch);
  }, [currentMonth, dispatch, profile?.uid]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((month) => subMonths(month, 1));
    setSelectedDate(undefined);
  }, []);
  const handleNextMonth = useCallback(() => {
    setCurrentMonth((month) => addMonths(month, 1));
    setSelectedDate(undefined);
  }, []);
  const handleSelectDate = useCallback((date: Date) => setSelectedDate(date), []);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDaySessions = selectedDateKey ? sessionsByDate[selectedDateKey] ?? [] : [];
  const monthSessions = useMemo(
    () =>
      Object.values(sessionsByDate)
        .flat()
        .filter((session) => isSameMonth(new Date(session.startsAt), currentMonth))
        .sort(
          (first, second) =>
            new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
        ),
    [currentMonth, sessionsByDate],
  );

  // Show either the selected day's sessions or every session in the displayed month.
  const displaySessions = selectedDate ? selectedDaySessions : monthSessions;
  const sectionTitle = selectedDate
    ? `Sessions on ${format(selectedDate, 'MMMM d')}`
    : `Sessions in ${format(currentMonth, 'MMMM')}`;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Calendar
          </ThemedText>
        </View>

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

        {/* Error Banner */}
        {sessionsError && <ErrorBanner message={sessionsError} />}

        {/* Session List */}
        <View style={styles.listSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {sectionTitle}
          </ThemedText>
          {displaySessions.length > 0 ? (
            <View style={styles.sessionList}>
              {displaySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => router.push(ROUTES.modal.sessionDetail(session.id) as any)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>
                {selectedDate ? 'No sessions on this day' : 'No sessions this month'}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
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
