import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SESSION_STATUS_COLORS } from '@/constants/statusColors';
import { selectSessionById } from '@/features/sessions/sessions.selectors';
import { getSessionById } from '@/features/sessions/sessions.service';
import { useAppSelector } from '@/store/hooks';
import type { TrainingSession } from '@/types/domain';

export default function SessionDetailModalScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();

  // Try store first
  const storeSession = useAppSelector((state) =>
    sessionId ? selectSessionById(state, sessionId) : undefined,
  );
  const [remoteSession, setRemoteSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(!storeSession);

  const session = storeSession ?? remoteSession;

  useEffect(() => {
    if (storeSession || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    getSessionById(sessionId)
      .then((s) => {
        if (!cancelled) setRemoteSession(s);
      })
      .catch((err) => console.error('[session-detail]', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, storeSession]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>Session not found</ThemedText>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <ThemedText style={styles.closeButtonText}>Close</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const statusColor = SESSION_STATUS_COLORS[session.status];
  const dateLabel = format(session.startsAt, 'MMMM d, yyyy');
  const timeLabel = `${format(session.startsAt, 'h:mm a')} - ${format(session.endsAt, 'h:mm a')}`;
  const statusLabel = session.status.charAt(0) + session.status.slice(1).toLowerCase().replace('_', ' ');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <ThemedText type="subtitle" style={styles.title}>
          Session Details
        </ThemedText>

        {/* Date & Time */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Date & Time</ThemedText>
          <ThemedText style={styles.fieldValue}>{dateLabel}</ThemedText>
          <ThemedText style={styles.fieldValue}>{timeLabel}</ThemedText>
        </View>

        {/* Status */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Status</ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          onPress={() => router.back()}>
          <ThemedText style={styles.closeButtonText}>Close</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    color: '#111827',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  closeButton: {
    marginTop: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
