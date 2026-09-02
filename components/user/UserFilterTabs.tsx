import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { UserStatus } from '@/types/domain';

export type UserFilterTab = UserStatus | 'ALL' | 'ADMIN';

interface UserFilterTabsProps {
  active: UserFilterTab;
  onChange: (tab: UserFilterTab) => void;
}

const TABS: { value: UserFilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_TRAINING', label: 'In Training' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ADMIN', label: 'Admin' },
];

export function UserFilterTabs({ active, onChange }: UserFilterTabsProps) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.row}
      showsHorizontalScrollIndicator={false}>
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Pressable
            key={tab.value}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab.value)}>
            <ThemedText style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
