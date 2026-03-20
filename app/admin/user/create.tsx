import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { USER_STATUS_COLORS } from '@/constants/statusColors';
import { createUser } from '@/features/users/users.service';
import { createUserSchema } from '@/lib/validation/schemas';
import type { UserRole, UserStatus } from '@/types/domain';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
];

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'IN_TRAINING', label: 'In Training' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export default function AdminCreateUserScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [status, setStatus] = useState<UserStatus>('IN_TRAINING');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const payload = {
      displayName: displayName.trim(),
      email: email.trim(),
      role,
      status,
    };

    const result = createUserSchema.safeParse(payload);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      Alert.alert('Validation Error', firstIssue?.message ?? 'Invalid input.');
      return;
    }

    setSaving(true);
    try {
      await createUser(payload);
      router.back();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create user.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

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
            Add User
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

        {/* Role */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Role</ThemedText>
          <View style={styles.chipRow}>
            {ROLE_OPTIONS.map((opt) => {
              const isActive = role === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.chip,
                    { borderColor: isActive ? '#4F46E5' : '#E5E7EB' },
                    isActive && { backgroundColor: '#4F46E515' },
                  ]}
                  onPress={() => setRole(opt.value)}>
                  <ThemedText
                    style={[styles.chipText, isActive && { color: '#4F46E5', fontWeight: '600' }]}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Status */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map((opt) => {
              const isActive = status === opt.value;
              const color = USER_STATUS_COLORS[opt.value];
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.chip,
                    { borderColor: isActive ? color : '#E5E7EB' },
                    isActive && { backgroundColor: color + '15' },
                  ]}
                  onPress={() => setStatus(opt.value)}>
                  <ThemedText
                    style={[styles.chipText, isActive && { color, fontWeight: '600' }]}>
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
            <ThemedText style={styles.saveButtonText}>Create User</ThemedText>
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
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  chipText: {
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
});
