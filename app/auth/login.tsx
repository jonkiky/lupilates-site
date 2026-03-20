import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet } from 'react-native';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  bootstrapUserProfile,
  getGoogleAuthClientConfig,
  routeAfterAuth,
  signInWithGoogleIdToken,
} from '@/features/auth/auth.service';
import { setAuthSession } from '@/features/auth/auth.slice';
import { useAppDispatch } from '@/store/hooks';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const googleAuthConfig = getGoogleAuthClientConfig();
  console.log('[auth] googleAuthConfig:', JSON.stringify(googleAuthConfig));

  // Do NOT pass redirectUri — the Google provider sets the correct native
  // reverse-client-ID scheme on iOS automatically when iosClientId is provided.
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleAuthConfig.webClientId,
    iosClientId: googleAuthConfig.iosClientId,
    androidClientId: googleAuthConfig.androidClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    const signInFromResponse = async () => {
      if (response?.type !== 'success') {
        return;
      }

      const idToken = response.params?.id_token ?? response.authentication?.idToken;

      if (!idToken) {
        Alert.alert('Sign in failed', 'Google did not return an ID token.');
        return;
      }

      try {
        setIsLoading(true);
          console.log('[firebase] idToken prefix:', idToken.slice(0, 20));
          const credential = await signInWithGoogleIdToken(idToken);
          console.log('[firebase] signIn success, uid:', credential.user.uid);
        const profile = await bootstrapUserProfile(credential.user.uid);

        dispatch(setAuthSession(profile));
        router.replace(routeAfterAuth(profile));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sign in with Google.';
        Alert.alert('Sign in failed', message);
          console.error('[firebase] signIn error:', JSON.stringify(error));
        } finally {
        setIsLoading(false);
      }
    };

    void signInFromResponse();
  }, [dispatch, response, router]);

  const onSignIn = async () => {
    if (!request || isPrompting || isLoading) {
      return;
    }

    if (Platform.OS === 'ios' && !googleAuthConfig.iosClientId) {
      Alert.alert('Missing iOS OAuth Client ID', 'Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in your .env file.');
      return;
    }

    try {
      setIsPrompting(true);
      await promptAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with Google.';
      Alert.alert('Sign in failed', message);
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Pilates Training
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Sign in to access your personalized training sessions.
      </ThemedText>

      <Pressable
        style={[styles.button, isLoading ? styles.buttonDisabled : null]}
        onPress={onSignIn}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ThemedText style={styles.buttonText}>Continue with Google</ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#0A7EA4',
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
