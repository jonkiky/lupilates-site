import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

// --- Loading Indicator ---

interface LoadingProps {
  message?: string;
}

export function ScreenLoading({ message }: LoadingProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
      {message && <ThemedText style={styles.loadingText}>{message}</ThemedText>}
    </View>
  );
}

// --- Empty State ---

interface EmptyProps {
  icon?: string;
  title: string;
  message?: string;
}

export function EmptyState({ icon = '📭', title, message }: EmptyProps) {
  return (
    <View style={styles.center}>
      <ThemedText style={styles.emptyIcon}>{icon}</ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      {message && <ThemedText style={styles.emptyMessage}>{message}</ThemedText>}
    </View>
  );
}

// --- Inline Error Banner ---

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.errorBanner}>
      <ThemedText style={styles.errorText}>⚠ {message}</ThemedText>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryLink}>
          <ThemedText style={styles.retryLinkText}>Retry</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    color: '#374151',
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
  },
  retryLink: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  retryLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
  },
});
