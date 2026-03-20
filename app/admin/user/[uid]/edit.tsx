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

import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { USER_STATUS_COLORS } from '@/constants/statusColors';
import { selectUserById } from '@/features/users/users.selectors';
import { getUserById, updateUser } from '@/features/users/users.service';
import { updateUserSchema } from '@/lib/validation/schemas';
import { useAppSelector } from '@/store/hooks';
import type { UserProfile, UserStatus } from '@/types/domain';

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'IN_TRAINING', label: 'In Training' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export default function AdminEditUserScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();

  const storeUser = useAppSelector((state) => (uid ? selectUserById(state, uid) : undefined));

  const [user, setUser] = useState<UserProfile | null>(storeUser ?? null);
  const [loading, setLoading] = useState(!storeUser);
  const [displayName, setDisplayName] = useState(storeUser?.displayName ?? '');
  const [email, setEmail] = useState(storeUser?.email ?? '');
  const [status, setStatus] = useState<UserStatus>(storeUser?.status ?? 'IN_TRAINING');
  const [saving, setSaving] = useState(false);

  // Fetch if not in store
  useEffect(() => {
    if (storeUser || !uid) return;
    let cancelled = false;
    setLoading(true);
    getUserById(uid)
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        if (u) {
          setDisplayName(u.displayName);
          setEmail(u.email);
          setStatus(u.status);
        }
      })
      .catch((err) => console.error('[edit-user]', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, storeUser]);

  // Sync from store
  useEffect(() => {
    if (storeUser) {
      setUser(storeUser);
    }
  }, [storeUser]);

  const handleSave = async () => {
    if (!uid) return;

    const payload = {
      displayName: displayName.trim(),
      email: email.trim(),
      status,
    };

    const result = updateUserSchema.safeParse(payload);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      Alert.alert('Validation Error', firstIssue?.message ?? 'Invalid input.');
      return;
    }

    setSaving(true);
    try {
      await updateUser(uid, payload);
      router.back();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update user.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>User not found</ThemedText>
        <Pressable style={styles.goBackButton} onPress={() => router.back()}>
          <ThemedText style={styles.goBackText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const initials = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backArrow}>‹</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Edit User
          </ThemedText>
        </View>
        <Pressable onPress={handleSave} disabled={saving}>
          <ThemedText style={[styles.saveText, saving && styles.saveTextDisabled]}>
            Save
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{initials}</ThemedText>
          </View>
        </View>

        {/* Display Name */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Display Name</ThemedText>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter display name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Email */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Status */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => {
              const isActive = status === opt.value;
              const color = USER_STATUS_COLORS[opt.value];
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

        {/* Save Button */}
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
  backBtn: {
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  field: {},
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 14,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
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
  goBackButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  goBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
