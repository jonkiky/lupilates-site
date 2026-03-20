import {
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SESSION_STATUS_COLORS } from '@/constants/statusColors';
import type { SessionStatus, TrainingSession } from '@/types/domain';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarMonthGridProps {
  currentMonth: Date;
  sessionsByDate: Record<string, TrainingSession[]>;
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function getDotColor(sessions: TrainingSession[]): string | null {
  if (sessions.length === 0) return null;
  const statusPriority: SessionStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  for (const status of statusPriority) {
    if (sessions.some((s) => s.status === status)) {
      return SESSION_STATUS_COLORS[status];
    }
  }
  return null;
}

export function CalendarMonthGrid({
  currentMonth,
  sessionsByDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarMonthGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = new Date();

  return (
    <View>
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={onPrevMonth} style={styles.navButton}>
          <ThemedText style={styles.navArrow}>{'‹'}</ThemedText>
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.monthTitle}>
          {format(currentMonth, 'MMMM yyyy')}
        </ThemedText>
        <Pressable onPress={onNextMonth} style={styles.navButton}>
          <ThemedText style={styles.navArrow}>{'›'}</ThemedText>
        </Pressable>
      </View>

      {/* Day Labels */}
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.dayLabelCell}>
            <ThemedText style={styles.dayLabelText}>{label}</ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySessions = sessionsByDate[dateKey] ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dotColor = getDotColor(daySessions);

          return (
            <Pressable
              key={dateKey}
              style={[
                styles.dayCell,
                isSelected && styles.daySelected,
                isToday && !isSelected && styles.dayToday,
              ]}
              onPress={() => onSelectDate(day)}>
              <ThemedText
                style={[
                  styles.dayText,
                  !inMonth && styles.dayTextMuted,
                  isSelected && styles.dayTextSelected,
                ]}>
                {format(day, 'd')}
              </ThemedText>
              {dotColor ? (
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navArrow: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    color: '#111827',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: '#4F46E5',
  },
  dayToday: {
    backgroundColor: '#EEF2FF',
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
  },
  dayTextMuted: {
    color: '#D1D5DB',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
});
