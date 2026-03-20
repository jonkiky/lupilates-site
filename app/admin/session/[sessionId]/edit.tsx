import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SESSION_STATUS_COLORS } from '@/constants/statusColors';
import { selectSessionById } from '@/features/sessions/sessions.selectors';
import {
    cancelSession,
    getSessionById,
    updateSession,
} from '@/features/sessions/sessions.service';
import { selectUserEntities } from '@/features/users/users.selectors';
import { updateSessionSchema } from '@/lib/validation/schemas';
import { useAppSelector } from '@/store/hooks';
import type { SessionStatus, TrainingSession } from '@/types/domain';

const STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

export default function AdminEditSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const userEntities = useAppSelector(selectUserEntities);

  const storeSession = useAppSelector((state) =>
    sessionId ? selectSessionById(state, sessionId) : undefined,
  );

  const [session, setSession] = useState<TrainingSession | null>(storeSession ?? null);
  const [loading, setLoading] = useState(!storeSession);
  const [status, setStatus] = useState<SessionStatus>(storeSession?.status ?? 'SCHEDULED');
  const [notes, setNotes] = useState(storeSession?.notes ?? '');
  const [saving, setSaving] = useState(false);

  // Fetch from Firestore if not in store
  useEffect(() => {
    if (storeSession || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    getSessionById(sessionId)
      .then((s) => {
        if (cancelled) return;
        setSession(s);
        if (s) {
          setStatus(s.status);
          setNotes(s.notes ?? '');
        }
      })
      .catch((err) => console.error('[edit-session]', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, storeSession]);

  // Sync from store updates
  useEffect(() => {
    if (storeSession) {
      setSession(storeSession);
    }
  }, [storeSession]);

  const handleSave = async () => {
    if (!sessionId) return;

    const patch = {
      status,
      notes: notes.trim() || undefined,
    };

    const result = updateSessionSchema.safeParse(patch);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      Alert.alert('Validation Error', firstIssue?.message ?? 'Invalid input.');
      return;
    }

    setSaving(true);
    try {
      await updateSession(sessionId, patch);
      router.back();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update session.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!sessionId) return;
    Alert.alert('Cancel Session', 'Are you sure you want to cancel this session?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await cancelSession(sessionId);
            router.back();
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to cancel session.';
            Alert.alert('Error', msg);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const user = userEntities[session.userId];
  const dateLabel = format(session.startsAt, 'MMMM d, yyyy');
  const timeLabel = `${format(session.startsAt, 'h:mm a')} - ${format(session.endsAt, 'h:mm a')}`;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <ThemedText style={styles.backArrow}>‹</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Edit Session
          </ThemedText>
        </View>
        <Pressable onPress={handleSave} disabled={saving}>
          <ThemedText style={[styles.saveText, saving && styles.saveTextDisabled]}>
            Save
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* User Card (readonly) */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {(user?.displayName ?? 'U').charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="defaultSemiBold" style={styles.userName}>
              {user?.displayName ?? 'Unknown User'}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user?.email ?? ''}</ThemedText>
          </View>
        </View>

        {/* Date/Time (readonly) */}
        <View style={styles.readonlyField}>
          <ThemedText style={styles.label}>Date & Time</ThemedText>
          <ThemedText style={styles.readonlyValue}>{dateLabel}</ThemedText>
          <ThemedText style={styles.readonlyValue}>{timeLabel}</ThemedText>
        </View>

        {/* Status Selector */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((opt) => {
              const isActive = status === opt.value;
              const color = SESSION_STATUS_COLORS[opt.value];
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.statusChip,
                    { borderColor: isActive ? color : '#E5E7EB' },
                    isActive && { backgroundColor: color + '15' },
                  ]}
                  onPress={() => setStatus(opt.value)}>
                  <ThemedText
                    style={[styles.statusChipText, isActive && { color, fontWeight: '600' }]}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Training Notes (optional)</ThemedText>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter training notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Actions */}
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
          )}
        </Pressable>

        {session.status !== 'CANCELLED' && (
          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            onPress={handleCancel}
            disabled={saving}>
            <ThemedText style={styles.cancelButtonText}>Cancel Session</ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    padding: 4,
  },
  backArrow: {
    fontSize: 32,
    color: '#374151',
    lineHeight: 34,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  form: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  readonlyField: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  readonlyValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  field: {},
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  statusChipText: {
    fontSize: 14,
    color: '#374151',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  backButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
