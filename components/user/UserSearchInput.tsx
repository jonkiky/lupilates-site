import { StyleSheet, TextInput, View } from 'react-native';

interface UserSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function UserSearchInput({
  value,
  onChangeText,
  placeholder = 'Search users...',
}: UserSearchInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  input: {
    fontSize: 15,
    color: '#111827',
    height: 42,
  },
});
