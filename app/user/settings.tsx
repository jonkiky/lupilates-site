import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { NotificationToggle } from '@/components/settings/NotificationToggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ROUTES } from '@/constants/routes';
import { selectAuthProfile } from '@/features/auth/auth.selectors';
import { signOutAndCleanup } from '@/features/auth/auth.service';
import { clearAuthSession } from '@/features/auth/auth.slice';
import { clearNotifications, preferenceUpdated } from '@/features/notifications/notifications.slice';
import { cancelAllManagedReminders, syncSessionReminders } from '@/features/notifications/reminderScheduler';
import { selectUpcomingSessions } from '@/features/sessions/sessions.selectors';
import {
    getNotificationPreference,
    saveNotificationPreference,
} from '@/features/sessions/sessions.service';
import { clearSessions } from '@/features/sessions/sessions.slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ReminderRule } from '@/types/domain';

const REMINDER_OPTIONS: { value: ReminderRule; label: string }[] = [
  { value: '24H', label: '24 hours before' },
  { value: '1H', label: '1 hour before' },
  { value: 'BOTH', label: 'Both' },
];

export default function UserSettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectAuthProfile);
  const upcomingSessions = useAppSelector(selectUpcomingSessions);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderRule, setReminderRule] = useState<ReminderRule>('24H');
  // saving tracks whether a preference write is in-flight (future use for spinner)
  const [, setSaving] = useState(false);

  // Load existing preference
  useEffect(() => {
    if (!profile?.uid) return;
    let cancelled = false;
    getNotificationPreference(profile.uid).then((pref) => {
      if (cancelled || !pref) return;
      setNotificationsEnabled(pref.enabled);
      setReminderRule(pref.reminderRule);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.uid]);

  const handleToggleNotifications = async (value: boolean) => {
    if (!profile?.uid) return;
    setNotificationsEnabled(value);
    setSaving(true);
    try {
      await saveNotificationPreference({ uid: profile.uid, enabled: value, reminderRule });
      dispatch(preferenceUpdated({ enabled: value, reminderRule }));
      // Reschedule reminders with the new preference
      const pref = { uid: profile.uid, enabled: value, reminderRule, updatedAt: new Date() };
      await syncSessionReminders(upcomingSessions, pref);
    } catch {
      setNotificationsEnabled(!value); // revert
      Alert.alert('Error', 'Failed to update notification preference.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRule = async (rule: ReminderRule) => {
    if (!profile?.uid) return;
    const prev = reminderRule;
    setReminderRule(rule);
    setSaving(true);
    try {
      await saveNotificationPreference({ uid: profile.uid, enabled: notificationsEnabled, reminderRule: rule });
      dispatch(preferenceUpdated({ enabled: notificationsEnabled, reminderRule: rule }));
      // Reschedule reminders with the new rule
      const pref = { uid: profile.uid, enabled: notificationsEnabled, reminderRule: rule, updatedAt: new Date() };
      await syncSessionReminders(upcomingSessions, pref);
    } catch {
      setReminderRule(prev); // revert
      Alert.alert('Error', 'Failed to update reminder rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAllManagedReminders();
            await signOutAndCleanup();
            dispatch(clearSessions());
            dispatch(clearNotifications());
            dispatch(clearAuthSession());
            router.replace(ROUTES.auth.login);
          } catch {
            Alert.alert('Error', 'Failed to sign out.');
          }
        },
      },
    ]);
  };

  const initials = (profile?.displayName ?? 'U').charAt(0).toUpperCase();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backArrow}>‹</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
        </View>

        {/* Profile Card */}
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="defaultSemiBold" style={styles.profileName}>
                {profile?.displayName ?? 'User'}
              </ThemedText>
              <ThemedText style={styles.profileEmail}>{profile?.email ?? ''}</ThemedText>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>NOTIFICATIONS</ThemedText>
          <View style={styles.card}>
            <NotificationToggle enabled={notificationsEnabled} onToggle={handleToggleNotifications} />

            {notificationsEnabled && (
              <View style={styles.reminderSection}>
                <View style={styles.divider} />
                <View style={styles.reminderContent}>
                  <ThemedText style={styles.reminderTitle}>Reminder Time</ThemedText>
                  {REMINDER_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.radioRow,
                        reminderRule === opt.value && styles.radioRowSelected,
                      ]}
                      onPress={() => handleChangeRule(opt.value)}>
                      <View style={styles.radioOuter}>
                        {reminderRule === opt.value && <View style={styles.radioInner} />}
                      </View>
                      <ThemedText style={styles.radioLabel}>{opt.label}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>ACCOUNT</ThemedText>
          <Pressable
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
            onPress={handleSignOut}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </Pressable>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backArrow: {
    fontSize: 32,
    color: '#374151',
    lineHeight: 34,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  reminderSection: {},
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  reminderContent: {
    padding: 20,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  radioRowSelected: {
    backgroundColor: '#EEF2FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  radioLabel: {
    fontSize: 15,
    color: '#111827',
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
