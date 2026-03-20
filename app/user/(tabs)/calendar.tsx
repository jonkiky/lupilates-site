import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { addMonths, format, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';

import { CalendarMonthGrid } from '@/components/calendar/CalendarMonthGrid';
import { SessionCard } from '@/components/session/SessionCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorBanner } from '@/components/ui/StateViews';
import { ROUTES } from '@/constants/routes';
import {
    selectSessionsError,
    selectSessionsGroupedByLocalDate,
    selectUpcomingSessions,
} from '@/features/sessions/sessions.selectors';
import { useAppSelector } from '@/store/hooks';

export default function UserCalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const sessionsByDate = useAppSelector(selectSessionsGroupedByLocalDate);
  const upcomingSessions = useAppSelector(selectUpcomingSessions);
  const sessionsError = useAppSelector(selectSessionsError);

  const handlePrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const handleSelectDate = useCallback((date: Date) => setSelectedDate(date), []);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDaySessions = selectedDateKey ? sessionsByDate[selectedDateKey] ?? [] : [];

  // Show either selected day sessions or upcoming sessions
  const displaySessions = selectedDate ? selectedDaySessions : upcomingSessions.slice(0, 5);
  const sectionTitle = selectedDate
    ? `Sessions on ${format(selectedDate, 'MMMM d')}`
    : 'Upcoming Sessions';

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
                {selectedDate ? 'No sessions on this day' : 'No upcoming sessions'}
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
