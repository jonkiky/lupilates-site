import { initializeAuth, inMemoryPersistence } from 'firebase/auth';

import { firebaseApp } from '@/lib/firebase/app';

// Firebase JS SDK v12 does not expose getReactNativePersistence as a named
// export in this bundle. Using inMemoryPersistence suppresses the warning.
// To persist auth across app restarts, swap this for AsyncStorage persistence
// once @react-native-firebase/auth is adopted, or upgrade to a Firebase
// version that ships the react-native auth subpath.
export const firebaseAuth = initializeAuth(firebaseApp, {
  persistence: inMemoryPersistence,
});
