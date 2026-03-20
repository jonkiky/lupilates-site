import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NotificationToggle } from '@/components/settings/NotificationToggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { selectAuthProfile } from '@/features/auth/auth.selectors';
import { signOutAndCleanup } from '@/features/auth/auth.service';
import { preferenceUpdated } from '@/features/notifications/notifications.slice';
import { syncSessionReminders } from '@/features/notifications/reminderScheduler';
import { selectUpcomingSessions } from '@/features/sessions/sessions.selectors';
import {
  getNotificationPreference,
  saveNotificationPreference,
} from '@/features/sessions/sessions.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ReminderRule } from '@/types/domain';

const REMINDER_OPTIONS: { value: ReminderRule; label: string }[] = [
  { value: '24H', label: '24 hours before' },
  { value: '1H', label: '1 hour before' },
  { value: 'BOTH', label: 'Both' },
];

export default function AdminSettingsScreen() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectAuthProfile);
  const upcomingSessions = useAppSelector(selectUpcomingSessions);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderRule, setReminderRule] = useState<ReminderRule>('24H');
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
      const pref = { uid: profile.uid, enabled: value, reminderRule, updatedAt: new Date().toISOString() };
      await syncSessionReminders(upcomingSessions, pref);
    } catch {
      setNotificationsEnabled(!value);
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
      const pref = { uid: profile.uid, enabled: notificationsEnabled, reminderRule: rule, updatedAt: new Date().toISOString() };
      await syncSessionReminders(upcomingSessions, pref);
    } catch {
      setReminderRule(prev);
      Alert.alert('Error', 'Failed to update reminder rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOutAndCleanup() },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
        </View>

        {/* Account Info */}
        {profile && (
          <View style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Account
            </ThemedText>
            <ThemedText style={styles.cardText}>{profile.displayName}</ThemedText>
            <ThemedText style={styles.cardSubtext}>{profile.email}</ThemedText>
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>NOTIFICATIONS</ThemedText>
          <View style={styles.notifCard}>
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

        {/* Sign Out */}
        <View style={styles.section}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#111827',
  },
  cardSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  reminderSection: {},
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  reminderContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  radioRowSelected: {
    backgroundColor: '#EEF2FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
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
    fontSize: 14,
    color: '#374151',
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
