import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface NotificationToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function NotificationToggle({ enabled, onToggle }: NotificationToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        <ThemedText style={styles.label}>Push Notifications</ThemedText>
        <ThemedText style={styles.sublabel}>Receive session reminders</ThemedText>
      </View>
      <Pressable
        style={[styles.track, enabled ? styles.trackOn : styles.trackOff]}
        onPress={() => onToggle(!enabled)}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}>
        <View style={[styles.thumb, enabled ? styles.thumbOn : styles.thumbOff]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  labelGroup: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  sublabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
  },
  trackOn: {
    backgroundColor: '#4F46E5',
  },
  trackOff: {
    backgroundColor: '#D1D5DB',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
});
