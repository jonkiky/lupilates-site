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

import { addDays, addHours, format, isValid, parse, setHours, setMinutes } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { selectAuthProfile } from '@/features/auth/auth.selectors';
import { createSession, fetchRecentUserNotes } from '@/features/sessions/sessions.service';
import { listenUsers } from '@/features/users/users.listener';
import { selectAllUsers } from '@/features/users/users.selectors';
import { createSessionSchema } from '@/lib/validation/schemas';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { TrainingSession, UserProfile } from '@/types/domain';

export default function AdminCreateSessionScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectAuthProfile);
  const users = useAppSelector(selectAllUsers);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [dateStr, setDateStr] = useState(() => date ?? format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Pick<TrainingSession, 'id' | 'startsAt' | 'notes'>[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Derived
  const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  const isDateValid = isValid(parsedDate) && dateStr.length === 10;
  const startsAt = isDateValid
    ? setMinutes(setHours(parsedDate, hour), minute)
    : null;
  const endsAt = startsAt ? addHours(startsAt, 1) : null;

  // Listen to users for picker
  useEffect(() => {
    const unsubscribe = listenUsers(dispatch);
    return unsubscribe;
  }, [dispatch]);

  const activeUsers = users.filter(
    (u) => u.role === 'USER' && u.status === 'IN_TRAINING',
  );
  const filteredUsers = userSearch.trim()
    ? activeUsers.filter((u) => {
        const q = userSearch.toLowerCase();
        return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
    : activeUsers;

  // Fetch recent training notes when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setRecentNotes([]);
      return;
    }
    let cancelled = false;
    setLoadingNotes(true);
    fetchRecentUserNotes(selectedUser.uid, 4)
      .then((notes) => {
        if (!cancelled) setRecentNotes(notes);
      })
      .catch(() => {
        if (!cancelled) setRecentNotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingNotes(false);
      });
    return () => { cancelled = true; };
  }, [selectedUser]);

  const handleSave = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a user.');
      return;
    }
    if (!profile?.uid) return;
    if (!startsAt || !endsAt) {
      Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    const payload = {
      userId: selectedUser.uid,
      trainerId: profile.uid,
      title: 'Pilates Session',
      notes: notes.trim() || undefined,
      startsAt,
      endsAt,
    };

    const result = createSessionSchema.safeParse(payload);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      Alert.alert('Validation Error', firstIssue?.message ?? 'Invalid input.');
      return;
    }

    setSaving(true);
    try {
      await createSession(payload);
      router.back();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create session.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <ThemedText style={styles.closeText}>✕</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            New Session
          </ThemedText>
        </View>
        <Pressable onPress={handleSave} disabled={saving}>
          <ThemedText style={[styles.saveText, saving && styles.saveTextDisabled]}>
            Save
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Select User */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Select User</ThemedText>
          <Pressable
            style={styles.pickerTrigger}
            onPress={() => {
              setShowUserPicker(!showUserPicker);
              if (showUserPicker) setUserSearch('');
            }}>
            <ThemedText style={selectedUser ? styles.pickerValue : styles.pickerPlaceholder}>
              {selectedUser ? selectedUser.displayName : 'Choose a user...'}
            </ThemedText>
            <ThemedText style={styles.pickerArrow}>▾</ThemedText>
          </Pressable>
          {showUserPicker && (
            <View style={styles.userList}>
              <TextInput
                style={styles.userSearchInput}
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search by name or email..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {filteredUsers.map((u) => (
                <Pressable
                  key={u.uid}
                  style={({ pressed }) => [
                    styles.userOption,
                    u.uid === selectedUser?.uid && styles.userOptionSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setSelectedUser(u);
                    setShowUserPicker(false);
                  }}>
                  <View style={styles.userOptionAvatar}>
                    <ThemedText style={styles.userOptionAvatarText}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.userOptionInfo}>
                    <ThemedText style={styles.userOptionName}>{u.displayName}</ThemedText>
                    <ThemedText style={styles.userOptionEmail}>{u.email}</ThemedText>
                  </View>
                </Pressable>
              ))}
              {filteredUsers.length === 0 && (
                <ThemedText style={styles.emptyUserList}>No users found</ThemedText>
              )}
            </View>
          )}
        </View>

        {/* Selected User Card */}
        {selectedUser && (
          <View style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <View style={styles.userCardAvatar}>
                <ThemedText style={styles.userCardAvatarText}>
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View>
                <ThemedText type="defaultSemiBold" style={styles.userCardName}>
                  {selectedUser.displayName}
                </ThemedText>
                <ThemedText style={styles.userCardEmail}>{selectedUser.email}</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Previous Training Notes */}
        {selectedUser && (
          <View style={styles.prevNotesSection}>
            <ThemedText style={styles.label}>Previous Training Notes</ThemedText>
            {loadingNotes ? (
              <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 8 }} />
            ) : recentNotes.length > 0 ? (
              recentNotes.map((s) => (
                <View key={s.id} style={styles.prevNoteCard}>
                  <ThemedText style={styles.prevNoteDate}>
                    {format(s.startsAt, 'MMM d, yyyy')}
                  </ThemedText>
                  <ScrollView style={styles.prevNoteScroll} nestedScrollEnabled>
                    <ThemedText style={styles.prevNoteText}>
                      {s.notes}
                    </ThemedText>
                  </ScrollView>
                </View>
              ))
            ) : (
              <ThemedText style={styles.prevNoteEmpty}>No previous notes</ThemedText>
            )}
          </View>
        )}

        {/* Date */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Date</ThemedText>
          <TextInput
            style={styles.input}
            value={dateStr}
            onChangeText={setDateStr}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Time */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Start Time</ThemedText>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <ThemedText style={styles.timeLabel}>Hour</ThemedText>
              <Pressable
                style={styles.timeAdjust}
                onPress={() => setHour((h) => Math.min(23, h + 1))}>
                <ThemedText style={styles.timeAdjustText}>▲</ThemedText>
              </Pressable>
              <ThemedText style={styles.timeValue}>{String(hour).padStart(2, '0')}</ThemedText>
              <Pressable
                style={styles.timeAdjust}
                onPress={() => setHour((h) => Math.max(0, h - 1))}>
                <ThemedText style={styles.timeAdjustText}>▼</ThemedText>
              </Pressable>
            </View>
            <ThemedText style={styles.timeSeparator}>:</ThemedText>
            <View style={styles.timeField}>
              <ThemedText style={styles.timeLabel}>Min</ThemedText>
              <Pressable
                style={styles.timeAdjust}
                onPress={() => setMinute((m) => (m >= 59 ? 0 : m + 1))}>
                <ThemedText style={styles.timeAdjustText}>▲</ThemedText>
              </Pressable>
              <ThemedText style={styles.timeValue}>{String(minute).padStart(2, '0')}</ThemedText>
              <Pressable
                style={styles.timeAdjust}
                onPress={() => setMinute((m) => (m <= 0 ? 59 : m - 1))}>
                <ThemedText style={styles.timeAdjustText}>▼</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Preview */}
        <View style={styles.previewRow}>
          <ThemedText style={styles.previewLabel}>Session:</ThemedText>
          <ThemedText style={styles.previewValue}>
            {startsAt
              ? `${format(startsAt, 'MMM d, yyyy')} · ${format(startsAt, 'h:mm a')} – ${format(endsAt!, 'h:mm a')}`
              : 'Enter a valid date (YYYY-MM-DD)'}
          </ThemedText>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Training Notes (optional)</ThemedText>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter training notes and objectives..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.submitText}>Create Session</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    gap: 12,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: '#374151',
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
  field: {},
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerTrigger: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValue: {
    fontSize: 15,
    color: '#111827',
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  pickerArrow: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  userList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 260,
    overflow: 'hidden',
  },
  userSearchInput: {
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  pressed: {
    opacity: 0.7,
  },
  userOptionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userOptionAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userOptionInfo: {
    flex: 1,
  },
  userOptionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  userOptionEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyUserList: {
    padding: 16,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userCardAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userCardName: {
    fontSize: 16,
    color: '#111827',
  },
  userCardEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeField: {
    alignItems: 'center',
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  timeAdjust: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  timeAdjustText: {
    fontSize: 14,
    color: '#374151',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    minWidth: 44,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  previewValue: {
    fontSize: 13,
    color: '#111827',
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
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  prevNotesSection: {
    gap: 8,
  },
  prevNoteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prevNoteDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  prevNoteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  prevNoteScroll: {
    maxHeight: 100,
  },
  prevNoteEmpty: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
